import { useState, useEffect } from 'react';
import { api } from '../api';

interface Device { id: string; nama: string; lokasi: string; status: string; last_seen: string | null; }
interface Content { id: string; judul: string; tipe: string; payload: string; }
interface PlaylistItem { id: string; device_id: string; content_id: string; urutan: number; contents: Content; }

export default function PlaylistPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedContent, setSelectedContent] = useState('');

  useEffect(() => {
    api.getDevices().then(setDevices).catch(console.error);
    api.getContents().then(setContents).catch(console.error);
    api.getPlaylists().then(setPlaylists).catch(console.error);
  }, []);

  const addToPlaylist = async () => {
    if (!selectedDevice || !selectedContent) return;
    try {
      await api.addToPlaylist(selectedDevice, selectedContent);
      const updated = await api.getPlaylists();
      setPlaylists(updated);
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
      const res = await api.pushContent(deviceId, contentId);
      alert('Content berhasil di-push!');
    } catch (err) { alert(err); }
  };

  const devicePlaylists = (deviceId: string) =>
    playlists.filter((p) => p.device_id === deviceId);

  return (
    <>
      <div className="page-header">
        <h2>Playlist & Push</h2>
        <p>Atur jadwal konten per device dan push secara real-time</p>
      </div>

      <div className="card">
        <h3>Tambah ke Playlist</h3>
        <div className="form-row">
          <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}>
            <option value="">-- Pilih Device --</option>
            {devices.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
          </select>
          <select value={selectedContent} onChange={(e) => setSelectedContent(e.target.value)}>
            <option value="">-- Pilih Content --</option>
            {contents.map((c) => <option key={c.id} value={c.id}>{c.judul}</option>)}
          </select>
          <button className="btn btn-primary" onClick={addToPlaylist} disabled={!selectedDevice || !selectedContent}>
            Tambah
          </button>
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="card">
          <div className="empty-state"><p>Belum ada device. Buat device terlebih dahulu.</p></div>
        </div>
      ) : (
        devices.map((d) => {
          const items = devicePlaylists(d.id);
          return (
            <div className="card" key={d.id}>
              <h3>
                {d.nama}
                <span className={`badge ${d.status === 'online' ? 'badge-online' : 'badge-offline'}`} style={{ marginLeft: 8 }}>
                  {d.status}
                </span>
              </h3>
              {items.length === 0 ? (
                <div className="empty-state"><p>Belum ada konten di playlist device ini</p></div>
              ) : (
                <table>
                  <thead><tr><th>#</th><th>Content</th><th>Tipe</th><th>Aksi</th></tr></thead>
                  <tbody>
                    {items.map((p) => (
                      <tr key={p.id}>
                        <td style={{ color: '#86868b' }}>{p.urutan + 1}</td>
                        <td style={{ fontWeight: 600 }}>{p.contents?.judul || '-'}</td>
                        <td>{p.contents?.tipe || '-'}</td>
                        <td>
                          <button className="btn-icon btn-icon-primary" onClick={() => pushContent(d.id, p.content_id)} title="Push to device" style={{ marginRight: 6 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                          </button>
                          <button className="btn-icon btn-icon-danger" onClick={() => removeFromPlaylist(p.id)} title="Hapus dari playlist">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })
      )}
    </>
  );
}
