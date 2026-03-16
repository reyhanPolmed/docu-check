import { getComparisonDetail } from "@/app/actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import HighlightPanel from "./HighlightPanel";

export default async function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getComparisonDetail(id);

  if (!detail) {
    notFound();
  }

  // Typecast detail.matchedRangesA and B because they are raw JSON from Prisma
  const documentA = detail.documentA;
  const documentB = detail.documentB;
  const similarityScore = detail.similarityScore;
  const matchedRangesA = (detail as any).matchedRangesA;
  const matchedRangesB = (detail as any).matchedRangesB;

  // We need to pass the ranges to the client component for rendering.
  // In Prisma, Json is typed loosely, we ensure it's an array of tuples here.
  const rangesA = Array.isArray(matchedRangesA) ? matchedRangesA as [number, number][] : [];
  const rangesB = Array.isArray(matchedRangesB) ? matchedRangesB as [number, number][] : [];

  const getScoreColor = (score: number) => {
    if (score < 31) return "var(--accent)";
    if (score < 61) return "var(--warning)";
    return "var(--danger)";
  };

  return (
    <div className="container animate-in" style={{ maxWidth: '1400px' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <Link href="/documents" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }}>
              &larr; Kembali
            </Link>
            <h2>Detail Perbandingan Dokumen</h2>
          </div>
          <p style={{ opacity: 0.6 }}>
            Perbandingan teks berdasarkan k-gram Winnowing fingerprinting
          </p>
        </div>
        <div className="card" style={{ padding: '1rem 2rem', textAlign: 'center', minWidth: '200px' }}>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7 }}>Kemiripan</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: getScoreColor(similarityScore) }}>
            {similarityScore.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="compare-container">
        {/* Panel A */}
        <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--glass-bg)' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary)' }}>Dokumen 1</h3>
            <div style={{ fontWeight: '600', marginTop: '0.5rem' }}>{documentA.title}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.5 }}>{documentA.fileName}</div>
          </div>
          <div className="text-panel">
            <HighlightPanel content={documentA.content} ranges={rangesA} />
          </div>
        </div>

        {/* Panel B */}
        <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--glass-bg)' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--accent)' }}>Dokumen 2</h3>
            <div style={{ fontWeight: '600', marginTop: '0.5rem' }}>{documentB.title}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.5 }}>{documentB.fileName}</div>
          </div>
          <div className="text-panel">
            <HighlightPanel content={documentB.content} ranges={rangesB} />
          </div>
        </div>
      </div>
    </div>
  );
}
