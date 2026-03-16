import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container animate-in">
      <section className="hero">
        <h1>Deteksi Kemiripan Dokumen dengan <span className="logo" style={{fontSize: 'inherit'}}>Winnowing</span></h1>
        <p>
          Uji orisinalitas ide dan dokumen Anda menggunakan algoritma fingerprinting yang canggih. 
          Cepat, akurat, dan aman.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/upload" className="btn btn-primary">
            Mulai Upload
          </Link>
          <Link href="/documents" className="btn btn-outline">
            Lihat Daftar
          </Link>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '4rem' }}>
        <div className="card">
          <h3 style={{ color: 'var(--primary)' }}>Algoritma Winnowing</h3>
          <p style={{ opacity: 0.7 }}>
            Menggunakan metode fingerprinting k-grams dan rolling hash untuk mendeteksi overlap konten antar dokumen.
          </p>
        </div>
        <div className="card">
          <h3 style={{ color: 'var(--accent)' }}>Multi-Format</h3>
          <p style={{ opacity: 0.7 }}>
            Mendukung berbagai format dokumen populer seperti PDF, DOCX, dan Plain Text (.txt).
          </p>
        </div>
        <div className="card">
          <h3 style={{ color: 'var(--primary)' }}>Visual Dashboard</h3>
          <p style={{ opacity: 0.7 }}>
            Tampilan tabel yang intuitif dengan indikator tingkat kemiripan berbasis warna.
          </p>
        </div>
      </section>
    </div>
  );
}
