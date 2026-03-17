export const dynamic = 'force-dynamic';
import { getDocumentsWithSimilarity } from "@/app/actions";
import Link from "next/link";

export default async function ResultsPage() {
  const documents = await getDocumentsWithSimilarity();

  const getBadgeClass = (score: number) => {
    if (score < 31) return "badge badge-low";
    if (score < 61) return "badge badge-medium";
    return "badge badge-high";
  };

  const getScoreLabel = (score: number) => {
    if (score < 31) return "Rendah";
    if (score < 61) return "Sedang";
    return "Tinggi";
  };

  // Filter only documents that have at least 1 similar pair
  const docsWithSimilarity = documents.filter((d: any) => d.similarCount > 0);

  return (
    <div className="container animate-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>
          <span style={{ marginRight: '0.75rem' }}>📊</span>
          Hasil Deteksi Kemiripan
        </h2>
        <p style={{ opacity: 0.6, maxWidth: '700px' }}>
          Berikut daftar dokumen yang terindikasi memiliki kemiripan dengan dokumen lain.
          Klik pada dokumen untuk melihat daftar pasangan dan detail perbandingan.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="results-stats">
        <div className="stat-card">
          <div className="stat-number">{documents.length}</div>
          <div className="stat-label">Total Dokumen</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: 'var(--warning)' }}>{docsWithSimilarity.length}</div>
          <div className="stat-label">Terindikasi Mirip</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: 'var(--danger)' }}>
            {docsWithSimilarity.filter((d: any) => d.maxSimilarity >= 60).length}
          </div>
          <div className="stat-label">Kemiripan Tinggi</div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="card" style={{ padding: '0', marginTop: '2rem' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>No</th>
                <th>Dokumen</th>
                <th>Jumlah Dokumen Mirip</th>
                <th>Kemiripan Tertinggi</th>
                <th>Tingkat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {docsWithSimilarity.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Tidak ada indikasi kemiripan</div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      Semua dokumen yang di-upload terlihat unik satu sama lain.
                    </div>
                  </td>
                </tr>
              ) : (
                docsWithSimilarity.map((doc: any, index: number) => (
                  <tr key={doc.id} className="results-row">
                    <td style={{ fontWeight: '600', opacity: 0.5 }}>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{doc.title}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.4, marginTop: '2px' }}>{doc.fileName}</div>
                    </td>
                    <td>
                      <div className="similar-count">
                        <span className="similar-count-number">{doc.similarCount}</span>
                        <span className="similar-count-text">
                          dokumen mirip
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={getBadgeClass(doc.maxSimilarity)} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                        {doc.maxSimilarity.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 600,
                        color: doc.maxSimilarity >= 60 ? 'var(--danger)' : doc.maxSimilarity >= 30 ? 'var(--warning)' : 'var(--accent)'
                      }}>
                        {getScoreLabel(doc.maxSimilarity)}
                      </span>
                    </td>
                    <td>
                      <Link 
                        href={`/results/${doc.id}`}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
                      >
                        Lihat Pasangan →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All documents (including ones without similarity) */}
      {documents.filter((d: any) => d.similarCount === 0).length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <h3 style={{ opacity: 0.5, marginBottom: '1rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Dokumen Tanpa Indikasi Kemiripan
          </h3>
          <div className="card" style={{ padding: '0' }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Dokumen</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.filter((d: any) => d.similarCount === 0).map((doc: any) => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{doc.title}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.4 }}>{doc.fileName}</div>
                      </td>
                      <td>
                        <span className="badge badge-low">Unik ✓</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
