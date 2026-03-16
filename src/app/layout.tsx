import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DocuCheck | Deteksi Kemiripan Dokumen",
  description: "Sistem deteksi kemiripan isi dokumen menggunakan Algoritma Winnowing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <nav className="navbar">
          <Link href="/" className="logo">DocuCheck</Link>
          <div className="nav-links">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/upload" className="nav-link">Upload</Link>
            <Link href="/results" className="nav-link">Hasil Deteksi</Link>
            <Link href="/documents" className="nav-link">Daftar Dokumen</Link>
          </div>
        </nav>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
