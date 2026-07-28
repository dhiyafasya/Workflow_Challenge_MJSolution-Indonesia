import { Search, Plus, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
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
            <Search size={16} />
            <input placeholder="Cari content..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="toolbar-actions">
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} />
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
                      <Pencil size={16} />
                    </button>
                    <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(c.id)} title="Hapus">
                      <Trash2 size={16} />
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
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`page-btn ${p === safePage ? 'page-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="btn-icon page-btn" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} title="Selanjutnya">
              <ChevronRight size={16} />
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
