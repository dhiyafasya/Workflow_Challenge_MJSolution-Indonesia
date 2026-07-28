import { useState, useEffect } from 'react';
import { api } from '../api';

interface Content { id: string; judul: string; tipe: string; payload: string; created_at: string; }

export default function ContentsPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [form, setForm] = useState({ judul: '', tipe: 'url', payload: '' });
  const [editId, setEditId] = useState('');

  useEffect(() => {
    api.getContents().then(setContents).catch(console.error);
  }, []);

  const resetForm = () => {
    setForm({ judul: '', tipe: 'url', payload: '' });
    setEditId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.updateContent(editId, form);
      } else {
        await api.createContent(form);
      }
      const updated = await api.getContents();
      setContents(updated);
      resetForm();
    } catch (err) { alert(err); }
  };

  const handleEdit = (c: Content) => {
    setForm({ judul: c.judul, tipe: c.tipe, payload: c.payload });
    setEditId(c.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus content ini?')) return;
    try {
      await api.deleteContent(id);
      setContents((prev) => prev.filter((c) => c.id !== id));
      if (editId === id) resetForm();
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
        <h3>{editId ? 'Edit Content' : 'Tambah Content'}</h3>
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
            <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Tambah'}</button>
            {editId && <button type="button" className="btn btn-secondary" onClick={resetForm}>Batal</button>}
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
                  <td className="fw-600">{c.judul}</td>
                  <td><span className="badge badge-online">{tipeLabel[c.tipe] || c.tipe}</span></td>
                  <td className="content-payload">{c.payload}</td>
                  <td className="table-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button className="btn-icon" onClick={() => handleEdit(c)} title="Edit">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(c.id)} title="Hapus">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
