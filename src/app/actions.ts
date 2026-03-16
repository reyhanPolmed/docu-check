"use server";

import prisma from "@/lib/prisma";
import { parseFile } from "@/lib/file-parser";
import { generateFingerprintsWithPos, calculateSimilarity, findMatchedRanges, Fingerprint } from "@/lib/winnowing";
import { revalidatePath } from "next/cache";

export async function uploadDocument(formData: FormData) {
  const file = formData.get("file") as File;
  const title = formData.get("title") as string || file.name;

  if (!file) throw new Error("File tidak ditemukan");

  // 1. Convert file to buffer and parse text
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const content = await parseFile(buffer, file.name);

  // 2. Generate Winnowing fingerprints with position metadata
  const fingerprints = generateFingerprintsWithPos(content);

  // 3. Save document to database
  // Prisma accepts JSON objects natively if they are standard JSON types.
  // Our Fingerprint[] array is a standard JSON array of objects.
  const document = await prisma.document.create({
    data: {
      title,
      fileName: file.name,
      content,
      // For JSON fields, Prisma expects specific input types.
      fingerprints: JSON.parse(JSON.stringify(fingerprints)),
    },
  });

  // 4. Calculate similarity with all existing documents
  const existingDocuments = await prisma.document.findMany({
    where: {
      id: { not: document.id },
    },
    select: {
      id: true,
      fingerprints: true,
      content: true,
    },
  });

  if (existingDocuments.length > 0) {
    const similarityData = existingDocuments.map((doc: { id: string, fingerprints: any, content: string }) => {
      // fingerprints field is now a JsonArray of Fingerprint objects in Prisma
      const docFingerprints = doc.fingerprints as Fingerprint[];
      const score = calculateSimilarity(fingerprints, docFingerprints);
      const matchedRanges = findMatchedRanges(fingerprints, docFingerprints, content, doc.content);
      
      return {
        documentAId: document.id,
        documentBId: doc.id,
        similarityScore: score,
        matchedRangesA: matchedRanges.rangesA,
        matchedRangesB: matchedRanges.rangesB,
      };
    });

    // Bulk create similarity results
    await prisma.similarityResult.createMany({
      data: similarityData,
    });
  }

  revalidatePath("/documents");
  return { success: true, id: document.id };
}

export async function getDocuments() {
  const documents = await prisma.document.findMany({
    include: {
      similarAsA: {
        select: { id: true, similarityScore: true },
        orderBy: { similarityScore: "desc" },
        take: 1,
      },
      similarAsB: {
        select: { id: true, similarityScore: true },
        orderBy: { similarityScore: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Process to find max similarity for each document
  return (documents || []).map((doc: any) => {
    const maxA = doc.similarAsA[0]?.similarityScore || 0;
    const maxB = doc.similarAsB[0]?.similarityScore || 0;
    return {
      ...doc,
      maxSimilarity: Math.max(maxA, maxB),
    };
  });
}

export async function deleteDocument(id: string) {
  await prisma.document.delete({
    where: { id },
  });
  revalidatePath("/documents");
  return { success: true };
}

export async function getComparisonDetail(similarityId: string) {
  const result = await prisma.similarityResult.findUnique({
    where: { id: similarityId },
    include: {
      documentA: {
        select: { title: true, fileName: true, content: true }
      },
      documentB: {
        select: { title: true, fileName: true, content: true }
      }
    }
  });
  
  return result;
}

/**
 * Get all documents that have at least one similarity result,
 * along with how many similar documents each one has.
 */
export async function getDocumentsWithSimilarity() {
  const documents = await prisma.document.findMany({
    include: {
      similarAsA: {
        select: { id: true, similarityScore: true, documentBId: true },
        orderBy: { similarityScore: "desc" },
      },
      similarAsB: {
        select: { id: true, similarityScore: true, documentAId: true },
        orderBy: { similarityScore: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return documents.map((doc: any) => {
    // Collect all unique paired document IDs
    const pairedIds = new Set<string>();
    let maxScore = 0;

    for (const r of doc.similarAsA) {
      if (r.similarityScore > 0) {
        pairedIds.add(r.documentBId);
        if (r.similarityScore > maxScore) maxScore = r.similarityScore;
      }
    }
    for (const r of doc.similarAsB) {
      if (r.similarityScore > 0) {
        pairedIds.add(r.documentAId);
        if (r.similarityScore > maxScore) maxScore = r.similarityScore;
      }
    }

    return {
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      createdAt: doc.createdAt,
      similarCount: pairedIds.size,
      maxSimilarity: maxScore,
    };
  });
}

/**
 * Get all similar document pairs for a specific document ID.
 * Returns an array of pairs with document info and similarity scores.
 */
export async function getDocumentSimilarPairs(docId: string) {
  // Get the source document
  const sourceDoc = await prisma.document.findUnique({
    where: { id: docId },
    select: { id: true, title: true, fileName: true },
  });

  if (!sourceDoc) return null;

  // Get all similarity results where this doc is either A or B
  const resultsAsA = await prisma.similarityResult.findMany({
    where: { documentAId: docId },
    include: {
      documentB: {
        select: { id: true, title: true, fileName: true },
      },
    },
    orderBy: { similarityScore: "desc" },
  });

  const resultsAsB = await prisma.similarityResult.findMany({
    where: { documentBId: docId },
    include: {
      documentA: {
        select: { id: true, title: true, fileName: true },
      },
    },
    orderBy: { similarityScore: "desc" },
  });

  // Normalize the pairs so source doc is always on the "left"
  const pairs = [
    ...resultsAsA.map((r: any) => ({
      similarityId: r.id,
      score: r.similarityScore,
      pairedDoc: r.documentB,
      sourceIsA: true,
    })),
    ...resultsAsB.map((r: any) => ({
      similarityId: r.id,
      score: r.similarityScore,
      pairedDoc: r.documentA,
      sourceIsA: false,
    })),
  ];

  // Sort by score descending
  pairs.sort((a, b) => b.score - a.score);

  return {
    sourceDoc,
    pairs,
  };
}
