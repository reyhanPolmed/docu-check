"use client";

import { useState } from "react";
import { uploadDocument } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState("");
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(false);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    
    try {
      const result = await uploadDocument(formData);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/documents");
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal meng-upload dokumen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container animate-in">
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Upload Dokumen Baru</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Judul Dokumen (Opsional)</label>
            <input 
              name="title" 
              type="text" 
              className="form-control" 
              placeholder="Masukkan judul atau biarkan kosong"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Pilih File (.txt, .pdf, .docx)</label>
            <div 
              style={{
                border: '2px dashed var(--border)',
                borderRadius: '1rem',
                padding: '3rem 2rem',
                textAlign: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.3s ease',
                background: 'var(--glass-bg)'
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--glass-bg)';
              }}
            >
              <input 
                name="file" 
                type="file" 
                accept=".txt,.pdf,.docx"
                required
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setFileName(e.target.files[0].name);
                  }
                }}
              />
              <div style={{ pointerEvents: 'none' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📄</div>
                {fileName ? (
                  <p style={{ color: 'var(--primary)', fontWeight: '600' }}>{fileName}</p>
                ) : (
                  <p>Klik atau drop file di sini</p>
                )}
                <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.5rem' }}>
                  Max size: 10MB
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--danger)', 
              padding: '1rem', 
              borderRadius: '0.75rem', 
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              color: 'var(--accent)', 
              padding: '1rem', 
              borderRadius: '0.75rem', 
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              ✅ Dokumen berhasil di-upload! Mengalihkan...
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? "Memproses..." : "Upload & Hitung Kemiripan"}
          </button>
        </form>
      </div>
    </div>
  );
}
