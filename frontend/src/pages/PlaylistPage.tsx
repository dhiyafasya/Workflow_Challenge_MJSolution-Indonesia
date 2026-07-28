import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';
import { Search, Plus, ChevronLeft, ChevronRight, ChevronDown, Copy, Check, Send, Trash2 } from 'lucide-react';

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
  const [copiedId, setCopiedId] = useState('');
  const [notif, setNotif] = useState('');

  useEffect(() => {
    api.getDevices().then(setDevices).catch(console.error);
    api.getContents().then(setContents).catch(console.error);
    api.getPlaylists().then(setPlaylists).catch(console.error);
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;

    const connect = () => {
      ws = new WebSocket('ws://localhost:3001');

      ws.onopen = () => { retryCount = 0; };

      ws.onclose = () => {
        ws = null;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        retryCount++;
        retryTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => { ws?.close(); };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'device_online' || msg.type === 'device_offline' || msg.type === 'device_deleted') {
            api.getDevices().then(setDevices).catch(console.error);
          } else if (msg.type === 'content_pushed') {
            api.getPlaylists().then(setPlaylists).catch(console.error);
          }
        } catch {}
      };
    };

    connect();
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      if (ws) { ws.onclose = null; ws.close(); ws = null; }
    };
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
      const res = await api.addToPlaylist(selectedDevice, selectedContent);
      const updated = await api.getPlaylists();
      setPlaylists(updated);
      setModalOpen(false);
      const msg = res.pushed ? 'Content berhasil di-push ke device!' : 'Device offline. Content tersimpan & akan tampil saat online.';
      setNotif(msg);
      setTimeout(() => setNotif(''), 3000);
    } catch (err) { alert(err); }
  };

  const removeFromPlaylist = async (id: string) => {
    try {
      await api.removeFromPlaylist(id);
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
    } catch (err) { alert(err); }
  };

  const copyUrl = (id: string) => {
    const url = `http://localhost:5173/device/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 2000);
    }).catch(() => {
      prompt('Copy URL ini:', url);
    });
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

      {notif && <div className={`playlist-notif ${notif.includes('berhasil') ? 'notif-success' : 'notif-warn'}`}>{notif}</div>}

      <div className="card">
        <div className="devices-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input placeholder="Cari device..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="toolbar-actions">
            <button className="btn btn-primary" onClick={() => openAddModal()}>
              <Plus size={16} />
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
                    <button className="btn-icon btn-icon-copy" onClick={(e) => { e.stopPropagation(); copyUrl(d.id); }} title="Copy device URL">
                      {copiedId === d.id ? (
                        <Check size={14} className="icon-check" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                    <span className={`badge ${d.status === 'online' ? 'badge-online' : 'badge-offline'}`}>{d.status}</span>
                  </div>
                  <span className="accordion-subtitle">{d.lokasi} · {items.length} konten</span>
                </div>
                <div className="accordion-right">
                  <button className="btn-icon btn-icon-primary" onClick={(e) => { e.stopPropagation(); openAddModal(d.id); }} title="Tambah konten">
                    <Plus size={16} />
                  </button>
                  <ChevronDown size={20} className={`accordion-chevron ${isExpanded ? 'chevron-open' : ''}`} />
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
                                <button className="btn-icon btn-icon-primary" onClick={() => pushContent(d.id, p.content_id)} title="Push Ulang">
                                  <Send size={16} />
                                </button>
                                <button className="btn-icon btn-icon-danger" onClick={() => removeFromPlaylist(p.id)} title="Hapus dari playlist">
                                  <Trash2 size={16} />
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tambah ke Playlist">
        <div className="modal-form">
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
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button className="btn btn-primary" onClick={addToPlaylist} disabled={!selectedDevice || !selectedContent}>Tambah</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
