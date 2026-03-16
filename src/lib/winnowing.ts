/**
 * Winnowing Algorithm for Document Fingerprinting
 * With Position Metadata Support
 */

export const K_SIZE = 15; // k-gram size (increased from 5 to prevent short non-plagiarized matches)
export const WINDOW_SIZE = 10; // window size

export interface Fingerprint {
  hash: number;
  origStart: number;
  origEnd: number;
}

export interface MatchedRanges {
  rangesA: [number, number][];
  rangesB: [number, number][];
}

/**
 * Normalizes text and creates a mapping from normalized index to original index
 * @returns { normalized: string, posMap: number[] }
 */
export function normalizeWithMapping(text: string): { normalized: string; posMap: number[] } {
  let normalized = "";
  const posMap: number[] = [];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (/[a-zA-Z0-9]/.test(char)) {
      normalized += char.toLowerCase();
      posMap.push(i);
    }
  }
  
  return { normalized, posMap };
}

/**
 * Generates k-grams with original position metadata
 */
export function generateKGramsWithPos(
  normalized: string, 
  posMap: number[], 
  k: number = K_SIZE
): { gram: string; hash: number; origStart: number; origEnd: number }[] {
  const kgrams = [];
  if (normalized.length < k) return [];
  
  for (let i = 0; i <= normalized.length - k; i++) {
    const gram = normalized.substring(i, i + k);
    const origStart = posMap[i];
    const origEnd = posMap[i + k - 1]; // Inclusive end of the gram in original text
    
    kgrams.push({
      gram,
      hash: hash(gram),
      origStart,
      origEnd
    });
  }
  
  return kgrams;
}

/**
 * Simple rolling hash (Rabin-Karp style)
 */
export function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0; // Use bitwise OR to keep it 32-bit int
  }
  return h;
}

/**
 * Generates fingerprints using the Winnowing algorithm with position metadata
 */
export function generateFingerprintsWithPos(text: string): Fingerprint[] {
  const { normalized, posMap } = normalizeWithMapping(text);
  const kgrams = generateKGramsWithPos(normalized, posMap);

  if (kgrams.length < WINDOW_SIZE) {
    // If not enough grams for a window, just return all unique hashes
    const unique = new Map<number, Fingerprint>();
    for (const g of kgrams) {
      if (!unique.has(g.hash)) {
        unique.set(g.hash, { hash: g.hash, origStart: g.origStart, origEnd: g.origEnd });
      }
    }
    return Array.from(unique.values());
  }

  const fingerprints: Fingerprint[] = [];
  const selectedHashes = new Set<number>();
  let minIndex = -1;

  for (let i = 0; i <= kgrams.length - WINDOW_SIZE; i++) {
    let minHash = Infinity;
    let currentMinIndex = -1;

    for (let j = 0; j < WINDOW_SIZE; j++) {
      const currentGram = kgrams[i + j];
      // Select the rightmost minimum to ensure we catch moving windows
      if (currentGram.hash <= minHash) {
        minHash = currentGram.hash;
        currentMinIndex = i + j;
      }
    }

    if (currentMinIndex !== minIndex) {
      minIndex = currentMinIndex;
      const selectedGram = kgrams[minIndex];
      
      // Store the specific occurrence
      fingerprints.push({
        hash: selectedGram.hash,
        origStart: selectedGram.origStart,
        origEnd: selectedGram.origEnd
      });
      selectedHashes.add(selectedGram.hash);
    }
  }

  return fingerprints;
}

/**
 * Normalizes text (Legacy function for backward compatibility)
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Generates fingerprints (Legacy function for backward compatibility)
 */
export function generateFingerprints(text: string): number[] {
  return generateFingerprintsWithPos(text).map(f => f.hash);
}

/**
 * Calculates Jaccard similarity between two sets of fingerprints
 */
export function calculateSimilarity(fpA: number[] | Fingerprint[], fpB: number[] | Fingerprint[]): number {
  if (fpA.length === 0 || fpB.length === 0) return 0;

  const getHashes = (fps: any[]) => fps.map(f => typeof f === 'number' ? f : f.hash);
  
  const setA = new Set(getHashes(fpA));
  const setB = new Set(getHashes(fpB));

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersection++;
    }
  }

  const union = setA.size + setB.size - intersection;
  return (intersection / union) * 100;
}

/**
 * Finds matching ranges between two sets of position-aware fingerprints
 */
export function findMatchedRanges(
  fpA: Fingerprint[], 
  fpB: Fingerprint[],
  textA?: string,
  textB?: string
): MatchedRanges {
  
  const mapA = new Map<number, Fingerprint[]>();
  for (const f of fpA) {
    if (!mapA.has(f.hash)) mapA.set(f.hash, []);
    mapA.get(f.hash)!.push(f);
  }

  const mapB = new Map<number, Fingerprint[]>();
  for (const f of fpB) {
    if (!mapB.has(f.hash)) mapB.set(f.hash, []);
    mapB.get(f.hash)!.push(f);
  }

  const validA = new Set<Fingerprint>();
  const validB = new Set<Fingerprint>();

  for (const [hash, fpsA] of mapA.entries()) {
    const fpsB = mapB.get(hash);
    if (!fpsB) continue;

    if (textA && textB) {
      // Exact text verification (prevents hash collisions)
      for (const fA of fpsA) {
        const strA = normalizeText(textA.substring(fA.origStart, fA.origEnd + 1));
        let matchFound = false;
        
        for (const fB of fpsB) {
          const strB = normalizeText(textB.substring(fB.origStart, fB.origEnd + 1));
          if (strA === strB) {
            validB.add(fB);
            matchFound = true;
          }
        }
        
        if (matchFound) {
          validA.add(fA);
        }
      }
    } else {
      fpsA.forEach(f => validA.add(f));
      fpsB.forEach(f => validB.add(f));
    }
  }

  const rangesA = Array.from(validA).map(f => [f.origStart, f.origEnd] as [number, number]);
  const rangesB = Array.from(validB).map(f => [f.origStart, f.origEnd] as [number, number]);

  // 3. Merge overlapping ranges
  const mergeRanges = (ranges: [number, number][]): [number, number][] => {
    if (ranges.length === 0) return [];
    
    // Sort by start position
    ranges.sort((a, b) => a[0] - b[0]);
    
    const merged: [number, number][] = [ranges[0]];
    
    for (let i = 1; i < ranges.length; i++) {
      const current = ranges[i];
      const last = merged[merged.length - 1];
      
      // Use character gap instead of k-gram gap, 15 chars allows minor edits without breaking range
      const maxGapChars = 15; 
      
      if (current[0] <= last[1] + maxGapChars) {
        last[1] = Math.max(last[1], current[1]);
      } else {
        merged.push(current);
      }
    }
    
    return merged;
  };

  // 4. Filter short ranges (anti-false-positive)
  const MIN_RANGE_CHARS = 30;
  const filterShortRanges = (ranges: [number, number][]): [number, number][] => {
    return ranges.filter(r => (r[1] - r[0] + 1) >= MIN_RANGE_CHARS);
  };

  return {
    rangesA: filterShortRanges(mergeRanges(rangesA)),
    rangesB: filterShortRanges(mergeRanges(rangesB))
  };
}
