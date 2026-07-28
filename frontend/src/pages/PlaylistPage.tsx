import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';

interface Device { id: string; nama: string; lokasi: string; status: string; last_seen: string | null; }
interface Content { id: string; judul: string; tipe: string; payload: string; }
interface PlaylistItem { id: string; device_id: string; content_id: string; urutan: number; contents: Content; }

const tipeLabel: Record<string, string> = { url: 'URL', text: 'Teks', image: 'Gambar' };

export default function PlaylistPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedContent, setSelectedContent] = useState('');

  useEffect(() => {
    api.getDevices().then(setDevices).catch(console.error);
    api.getContents().then(setContents).catch(console.error);
    api.getPlaylists().then(setPlaylists).catch(console.error);
  }, []);

  const filteredDevices = useMemo(() => {
    if (!search) return devices;
    const q = search.toLowerCase();
    return devices.filter((d) => d.nama.toLowerCase().includes(q) || d.lokasi.toLowerCase().includes(q));
  }, [devices, search]);

  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedDevices = filteredDevices.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const devicePlaylists = (deviceId: string) =>
    playlists.filter((p) => p.device_id === deviceId);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const openAddModal = (deviceId?: string) => {
    setSelectedDevice(deviceId || '');
    setSelectedContent('');
    setModalOpen(true);
  };

  const addToPlaylist = async () => {
    if (!selectedDevice || !selectedContent) return;
    try {
      await api.addToPlaylist(selectedDevice, selectedContent);
      const updated = await api.getPlaylists();
      setPlaylists(updated);
      setModalOpen(false);
    } catch (err) { alert(err); }
  };

  const removeFromPlaylist = async (id: string) => {
    try {
      await api.removeFromPlaylist(id);
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
    } catch (err) { alert(err); }
  };

  const pushContent = async (deviceId: string, contentId: string) => {
    try {
      await api.pushContent(deviceId, contentId);
      alert('Content berhasil di-push!');
    } catch (err) { alert(err); }
  };

  return (
    <>
      <div className="page-header">
        <h2>Playlist & Push</h2>
        <p>Atur jadwal konten per device dan push secara real-time</p>
      </div>

      <div className="card">
        <div className="devices-toolbar">
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input placeholder="Cari device..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="toolbar-actions">
            <button className="btn btn-primary" onClick={() => openAddModal()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}>
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Tambah ke Playlist
            </button>
          </div>
        </div>
      </div>

      {filteredDevices.length === 0 ? (
        <div className="card"><div className="empty-state"><p>{devices.length === 0 ? 'Belum ada device. Buat device terlebih dahulu.' : 'Device tidak ditemukan.'}</p></div></div>
      ) : (
        paginatedDevices.map((d) => {
          const items = devicePlaylists(d.id);
          const isExpanded = expandedId === d.id;
          return (
            <div className={`card accordion-card ${isExpanded ? 'accordion-expanded' : ''}`} key={d.id}>
              <div className="accordion-header" onClick={() => toggleExpand(d.id)}>
                <div className="accordion-info">
                  <div className="accordion-title-row">
                    <span className="fw-600">{d.nama}</span>
                    <span className={`badge ${d.status === 'online' ? 'badge-online' : 'badge-offline'}`}>{d.status}</span>
                  </div>
                  <span className="accordion-subtitle">{d.lokasi} · {items.length} konten</span>
                </div>
                <div className="accordion-right">
                  <button className="btn-icon btn-icon-primary" onClick={(e) => { e.stopPropagation(); openAddModal(d.id); }} title="Tambah konten">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                  <svg className={`accordion-chevron ${isExpanded ? 'chevron-open' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>
              {isExpanded && (
                <div className="accordion-body">
                  {items.length === 0 ? (
                    <div className="empty-state"><p>Belum ada konten di playlist device ini</p></div>
                  ) : (
                    <table>
                      <thead><tr><th>#</th><th>Content</th><th>Tipe</th><th>Aksi</th></tr></thead>
                      <tbody>
                        {items.map((p, idx) => (
                          <tr key={p.id}>
                            <td className="order-num">{idx + 1}</td>
                            <td className="content-name">{p.contents?.judul || '-'}</td>
                            <td><span className="badge badge-online">{tipeLabel[p.contents?.tipe] || p.contents?.tipe || '-'}</span></td>
                            <td>
                              <div className="playlist-actions">
                                <button className="btn-icon btn-icon-primary" onClick={() => pushContent(d.id, p.content_id)} title="Push to device">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                                </button>
                                <button className="btn-icon btn-icon-danger" onClick={() => removeFromPlaylist(p.id)} title="Hapus dari playlist">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tambah ke Playlist">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="modal-field">
            <label>Device</label>
            <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}>
              <option value="">-- Pilih Device --</option>
              {devices.map((d) => <option key={d.id} value={d.id}>{d.nama} — {d.lokasi}</option>)}
            </select>
          </div>
          <div className="modal-field">
            <label>Content</label>
            <select value={selectedContent} onChange={(e) => setSelectedContent(e.target.value)}>
              <option value="">-- Pilih Content --</option>
              {contents.map((c) => <option key={c.id} value={c.id}>{c.judul} ({tipeLabel[c.tipe] || c.tipe})</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button className="btn btn-primary" onClick={addToPlaylist} disabled={!selectedDevice || !selectedContent}>Tambah</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
