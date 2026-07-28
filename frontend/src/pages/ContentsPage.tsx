import { useState, useEffect } from 'react';
import { api } from '../api';

interface Content { id: string; judul: string; tipe: string; payload: string; created_at: string; }

export default function ContentsPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [form, setForm] = useState({ judul: '', tipe: 'url', payload: '' });

  useEffect(() => {
    api.getContents().then(setContents).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createContent(form);
      const updated = await api.getContents();
      setContents(updated);
      setForm({ judul: '', tipe: 'url', payload: '' });
    } catch (err) { alert(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus content ini?')) return;
    try {
      await api.deleteContent(id);
      setContents((prev) => prev.filter((c) => c.id !== id));
    } catch (err) { alert(err); }
  };

  const tipeLabel: Record<string, string> = { url: 'URL', text: 'Teks', image: 'Gambar' };

  return (
    <>
      <div className="page-header">
        <h2>Contents</h2>
        <p>Kelola konten untuk ditampilkan di device</p>
      </div>

      <div className="card">
        <h3>Tambah Content</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input placeholder="Judul" value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })} required />
            <select value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })}>
              <option value="url">URL</option>
              <option value="text">Teks</option>
              <option value="image">Gambar</option>
            </select>
            <input placeholder="Payload / URL" value={form.payload}
              onChange={(e) => setForm({ ...form, payload: e.target.value })} />
            <button type="submit" className="btn btn-primary">Tambah</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Daftar Content</h3>
        {contents.length === 0 ? (
          <div className="empty-state"><p>Belum ada content. Tambahkan content baru di atas.</p></div>
        ) : (
          <table>
            <thead><tr><th>Judul</th><th>Tipe</th><th>Payload</th><th>Dibuat</th><th>Aksi</th></tr></thead>
            <tbody>
              {contents.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.judul}</td>
                  <td><span className="badge badge-online">{tipeLabel[c.tipe] || c.tipe}</span></td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', color: '#86868b' }}>{c.payload}</td>
                  <td style={{ color: '#86868b' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td><button className="btn btn-danger btn-small" onClick={() => handleDelete(c.id)}>Hapus</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
