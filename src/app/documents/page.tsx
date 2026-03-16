import { getDocuments, deleteDocument } from "@/app/actions";
import Link from "next/link";
import DeleteButton from "./DeleteButton"; // We'll create this

export default async function DocumentsPage() {
  const documents: any[] = await getDocuments();

  const getBadgeClass = (score: number) => {
    if (score < 31) return "badge badge-low";
    if (score < 61) return "badge badge-medium";
    return "badge badge-high";
  };

  return (
    <div className="container animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Daftar Dokumen</h2>
          <p style={{ opacity: 0.6 }}>Total: {documents.length} dokumen terdeteksi</p>
        </div>
        <Link href="/upload" className="btn btn-primary">
          + Upload Baru
        </Link>
      </div>

      <div className="card" style={{ padding: '0' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Judul & File</th>
                <th>Tanggal Upload</th>
                <th>Kemiripan Tertinggi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                    Belum ada dokumen yang di-upload.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{doc.title}</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.5 }}>{doc.fileName}</div>
                    </td>
                    <td>{new Date(doc.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}</td>
                    <td>
                      <span className={getBadgeClass(doc.maxSimilarity)}>
                        {doc.maxSimilarity.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {doc.similarAsA[0] || doc.similarAsB[0] ? (
                          <Link 
                            href={`/compare/${doc.similarAsA[0]?.id || doc.similarAsB[0]?.id}`} 
                            className="btn btn-outline" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                          >
                            Lihat Detail
                          </Link>
                        ) : null}
                        <DeleteButton id={doc.id} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
