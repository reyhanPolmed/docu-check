"use client";

import { useState, useEffect, useCallback } from "react";
import { getComparisonDetail } from "@/app/actions";
import HighlightPanel from "@/app/compare/[id]/HighlightPanel";

interface PairData {
  similarityId: string;
  score: number;
  pairedDoc: {
    id: string;
    title: string;
    fileName: string;
  };
  sourceIsA: boolean;
}

interface SourceDoc {
  id: string;
  title: string;
  fileName: string;
}

interface ComparisonData {
  documentA: { title: string; fileName: string; content: string };
  documentB: { title: string; fileName: string; content: string };
  similarityScore: number;
  matchedRangesA: [number, number][];
  matchedRangesB: [number, number][];
}

export default function PairsClient({
  sourceDoc,
  pairs,
}: {
  sourceDoc: SourceDoc;
  pairs: PairData[];
}) {
  const [selectedPairIndex, setSelectedPairIndex] = useState<number | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadComparison = useCallback(async (similarityId: string) => {
    setLoading(true);
    try {
      const detail = await getComparisonDetail(similarityId);
      if (detail) {
        const rangesA = Array.isArray((detail as any).matchedRangesA)
          ? (detail as any).matchedRangesA as [number, number][]
          : [];
        const rangesB = Array.isArray((detail as any).matchedRangesB)
          ? (detail as any).matchedRangesB as [number, number][]
          : [];

        setComparison({
          documentA: detail.documentA,
          documentB: detail.documentB,
          similarityScore: detail.similarityScore,
          matchedRangesA: rangesA,
          matchedRangesB: rangesB,
        });
      }
    } catch (err) {
      console.error("Failed to load comparison:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectPair = (index: number) => {
    setSelectedPairIndex(index);
    loadComparison(pairs[index].similarityId);
  };

  // Auto-select first pair on mount
  useEffect(() => {
    if (pairs.length > 0 && selectedPairIndex === null) {
      handleSelectPair(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getBadgeClass = (score: number) => {
    if (score < 31) return "badge badge-low";
    if (score < 61) return "badge badge-medium";
    return "badge badge-high";
  };

  const getScoreColor = (score: number) => {
    if (score < 31) return "var(--accent)";
    if (score < 61) return "var(--warning)";
    return "var(--danger)";
  };

  // Determine which side is the source document in the comparison
  const getPreviewDocs = () => {
    if (!comparison || selectedPairIndex === null) return null;
    const pair = pairs[selectedPairIndex];

    if (pair.sourceIsA) {
      // Source doc is documentA
      return {
        left: { ...comparison.documentA, label: "Dokumen Sumber", ranges: comparison.matchedRangesA },
        right: { ...comparison.documentB, label: "Dokumen Pembanding", ranges: comparison.matchedRangesB },
      };
    } else {
      // Source doc is documentB (roles are swapped)
      return {
        left: { ...comparison.documentB, label: "Dokumen Sumber", ranges: comparison.matchedRangesB },
        right: { ...comparison.documentA, label: "Dokumen Pembanding", ranges: comparison.matchedRangesA },
      };
    }
  };

  const previewDocs = getPreviewDocs();

  return (
    <div className="pairs-layout">
      {/* Left sidebar: list of pairs */}
      <div className="pairs-sidebar">
        <div className="pairs-sidebar-header">
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Pasangan Mirip</h3>
          <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{pairs.length} dokumen</span>
        </div>
        <div className="pairs-list">
          {pairs.map((pair, index) => (
            <button
              key={pair.similarityId}
              className={`pair-item ${selectedPairIndex === index ? 'pair-item-active' : ''}`}
              onClick={() => handleSelectPair(index)}
            >
              <div className="pair-item-content">
                <div className="pair-item-title">{pair.pairedDoc.title}</div>
                <div className="pair-item-file">{pair.pairedDoc.fileName}</div>
              </div>
              <div className="pair-item-score" style={{ color: getScoreColor(pair.score) }}>
                {pair.score.toFixed(1)}%
              </div>
              <div className="pair-item-bar">
                <div 
                  className="pair-item-bar-fill" 
                  style={{ 
                    width: `${Math.min(pair.score, 100)}%`,
                    background: getScoreColor(pair.score)
                  }} 
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Preview area */}
      <div className="pairs-preview">
        {loading && (
          <div className="pairs-loading">
            <div className="pairs-loading-spinner" />
            <span>Memuat preview dokumen...</span>
          </div>
        )}
        
        {!loading && previewDocs && comparison && (
          <>
            {/* Score header */}
            <div className="preview-score-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span className={getBadgeClass(comparison.similarityScore)} style={{ fontSize: '1.1rem', padding: '0.6rem 1.2rem' }}>
                  Kemiripan: {comparison.similarityScore.toFixed(1)}%
                </span>
                <span style={{ fontSize: '0.85rem', opacity: 0.5 }}>
                  Bagian yang mirip ditandai dengan highlight kuning
                </span>
              </div>
            </div>

            {/* Side by side panels */}
            <div className="compare-container">
              {/* Left panel: Source Doc */}
              <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--glass-bg)' }}>
                  <div style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    opacity: 0.5,
                    marginBottom: '0.25rem'
                  }}>
                    {previewDocs.left.label}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary)' }}>
                    {previewDocs.left.title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', opacity: 0.4 }}>{previewDocs.left.fileName}</div>
                </div>
                <div className="text-panel">
                  <HighlightPanel content={previewDocs.left.content} ranges={previewDocs.left.ranges} />
                </div>
              </div>

              {/* Right panel: Paired Doc */}
              <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--glass-bg)' }}>
                  <div style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    opacity: 0.5,
                    marginBottom: '0.25rem'
                  }}>
                    {previewDocs.right.label}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent)' }}>
                    {previewDocs.right.title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', opacity: 0.4 }}>{previewDocs.right.fileName}</div>
                </div>
                <div className="text-panel">
                  <HighlightPanel content={previewDocs.right.content} ranges={previewDocs.right.ranges} />
                </div>
              </div>
            </div>
          </>
        )}

        {!loading && !previewDocs && (
          <div className="pairs-empty-preview">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👈</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Pilih dokumen dari daftar</div>
            <div style={{ marginTop: '0.5rem', opacity: 0.5 }}>
              Klik salah satu pasangan di sidebar untuk melihat preview perbandingan
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
