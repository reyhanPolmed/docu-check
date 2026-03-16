"use client";

import { useState } from "react";
import { deleteDocument } from "@/app/actions";

export default function DeleteButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus dokumen ini?")) return;
    
    setLoading(true);
    try {
      await deleteDocument(id);
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus dokumen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      className="btn btn-outline"
      style={{ 
        padding: '0.4rem 0.8rem', 
        fontSize: '0.8rem',
        color: 'var(--danger)',
        borderColor: 'rgba(239, 68, 68, 0.2)'
      }}
    >
      {loading ? "..." : "Hapus"}
    </button>
  );
}
