export const dynamic = 'force-dynamic';
import { getDocumentSimilarPairs } from "@/app/actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import PairsClient from "./PairsClient";

export default async function DocumentPairsPage({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  const data = await getDocumentSimilarPairs(docId);

  if (!data) {
    notFound();
  }

  const { sourceDoc, pairs } = data;

  return (
    <div className="container animate-in" style={{ maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <Link href="/results" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }}>
            ← Kembali ke Hasil
          </Link>
          <h2 style={{ margin: 0 }}>Daftar Pasangan Mirip</h2>
        </div>
        <p style={{ opacity: 0.6, marginTop: '0.5rem' }}>
          Menampilkan semua dokumen yang memiliki indikasi kemiripan dengan dokumen sumber.
        </p>
      </div>

      {/* Source Document Info */}
      <div className="card source-doc-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="source-doc-icon">📄</div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.5, marginBottom: '0.25rem' }}>
              Dokumen Sumber
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>{sourceDoc.title}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.4 }}>{sourceDoc.fileName}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>{pairs.length}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Dokumen Mirip</div>
          </div>
        </div>
      </div>

      {/* Client component for interactive pair selection + preview */}
      <PairsClient 
        sourceDoc={sourceDoc}
        pairs={pairs}
      />
    </div>
  );
}
