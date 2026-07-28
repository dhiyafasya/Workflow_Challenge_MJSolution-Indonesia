import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';

interface Content { id: string; judul: string; tipe: string; payload: string; created_at: string; }

export default function ContentsPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState({ judul: '', tipe: 'url', payload: '' });

  useEffect(() => {
    api.getContents().then(setContents).catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return contents;
    const q = search.toLowerCase();
    return contents.filter((c) => c.judul.toLowerCase().includes(q) || c.payload.toLowerCase().includes(q));
  }, [contents, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const openAdd = () => {
    setEditId('');
    setForm({ judul: '', tipe: 'url', payload: '' });
    setModalOpen(true);
  };

  const openEdit = (c: Content) => {
    setEditId(c.id);
    setForm({ judul: c.judul, tipe: c.tipe, payload: c.payload });
    setModalOpen(true);
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
      setModalOpen(false);
    } catch (err) { alert(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus content ini?')) return;
    try {
      await api.deleteContent(id);
      setContents((prev) => prev.filter((c) => c.id !== id));
      if (editId === id) setEditId('');
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
        <div className="devices-toolbar">
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input placeholder="Cari content..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="toolbar-actions">
            <button className="btn btn-primary" onClick={openAdd}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Tambah Content
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Daftar Content {search && <span className="search-hint">— hasil untuk "{search}"</span>}</h3>
        {filtered.length === 0 ? (
          <div className="empty-state"><p>{contents.length === 0 ? 'Belum ada content. Klik "Tambah Content" di atas.' : 'Content tidak ditemukan.'}</p></div>
        ) : (
          <table>
            <thead><tr><th>No</th><th>Judul</th><th>Tipe</th><th>Payload</th><th>Dibuat</th><th>Aksi</th></tr></thead>
            <tbody>
              {paginated.map((c, idx) => (
                <tr key={c.id}>
                  <td className="table-muted table-no">{(safePage - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="fw-600">{c.judul}</td>
                  <td><span className="badge badge-online">{tipeLabel[c.tipe] || c.tipe}</span></td>
                  <td className="content-payload">{c.payload}</td>
                  <td className="table-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button className="btn-icon" onClick={() => openEdit(c)} title="Edit">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(c.id)} title="Hapus">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn-icon page-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} title="Sebelumnya">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`page-btn ${p === safePage ? 'page-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="btn-icon page-btn" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} title="Selanjutnya">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Content' : 'Tambah Content'}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label>Judul</label>
            <input placeholder="Contoh: Promo Akhir Tahun" value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })} required autoFocus />
          </div>
          <div className="modal-field">
            <label>Tipe</label>
            <select value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })}>
              <option value="url">URL</option>
              <option value="text">Teks</option>
              <option value="image">Gambar</option>
            </select>
          </div>
          <div className="modal-field">
            <label>Payload / URL</label>
            <input placeholder="Contoh: https://..." value={form.payload}
              onChange={(e) => setForm({ ...form, payload: e.target.value })} required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">{editId ? 'Simpan' : 'Tambah'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
