import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

interface Device {
  id: string;
  nama: string;
  lokasi: string;
  status: 'online' | 'offline';
  last_seen: string | null;
}

interface Content {
  id: string;
  judul: string;
  tipe: string;
  payload: string;
  created_at: string;
}

interface PlaylistItem {
  id: string;
  device_id: string;
  content_id: string;
  urutan: number;
  contents: Content;
}

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [deviceForm, setDeviceForm] = useState({ nama: '', lokasi: '' });
  const [contentForm, setContentForm] = useState({ judul: '', tipe: 'url', payload: '' });
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedContent, setSelectedContent] = useState('');

  useEffect(() => {
    api.getDevices().then(setDevices).catch(console.error);
    api.getContents().then(setContents).catch(console.error);
    api.getPlaylists().then(setPlaylists).catch(console.error);
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      switch (msg.type) {
        case 'device_online':
        case 'device_updated':
          setDevices((prev) => prev.map((d) => (d.id === msg.device?.id || d.id === msg.deviceId ? { ...d, ...msg.device, status: msg.type === 'device_online' ? 'online' : d.status } : d)));
          break;
        case 'device_offline':
          setDevices((prev) => prev.map((d) => (d.id === msg.deviceId ? { ...d, status: 'offline' } : d)));
          break;
        case 'device_deleted':
          setDevices((prev) => prev.filter((d) => d.id !== msg.deviceId));
          break;
      }
    };
    return () => ws.close();
  }, []);

  const addDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDevice(deviceForm);
      const updated = await api.getDevices();
      setDevices(updated);
      setDeviceForm({ nama: '', lokasi: '' });
    } catch (err) { alert(err); }
  };

  const deleteDevice = async (id: string) => {
    if (!confirm('Hapus device ini?')) return;
    try {
      await api.deleteDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (err) { alert(err); }
  };

  const addContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createContent(contentForm);
      const updated = await api.getContents();
      setContents(updated);
      setContentForm({ judul: '', tipe: 'url', payload: '' });
    } catch (err) { alert(err); }
  };

  const deleteContent = async (id: string) => {
    if (!confirm('Hapus content ini?')) return;
    try {
      await api.deleteContent(id);
      setContents((prev) => prev.filter((c) => c.id !== id));
    } catch (err) { alert(err); }
  };

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
      await api.pushContent(deviceId, contentId);
      alert('Content pushed to device!');
    } catch (err) { alert(err); }
  };

  const devicePlaylists = (deviceId: string) =>
    playlists.filter((p) => p.device_id === deviceId);

  return (
    <div className="container">
      <h1>Dashboard Admin</h1>

      <section>
        <h2>Devices</h2>
        <form onSubmit={addDevice} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input placeholder="Nama device" value={deviceForm.nama}
            onChange={(e) => setDeviceForm({ ...deviceForm, nama: e.target.value })} required />
          <input placeholder="Lokasi" value={deviceForm.lokasi}
            onChange={(e) => setDeviceForm({ ...deviceForm, lokasi: e.target.value })} />
          <button type="submit">Tambah</button>
        </form>
        <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th>Nama</th><th>Lokasi</th><th>Status</th><th>Last Seen</th><th>Aksi</th></tr></thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td><strong>{d.nama}</strong></td>
                <td>{d.lokasi}</td>
                <td style={{ color: d.status === 'online' ? 'green' : 'red', fontWeight: 'bold' }}>{d.status}</td>
                <td>{d.last_seen ? new Date(d.last_seen).toLocaleString() : '-'}</td>
                <td><button onClick={() => deleteDevice(d.id)}>Hapus</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Contents</h2>
        <form onSubmit={addContent} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input placeholder="Judul" value={contentForm.judul}
            onChange={(e) => setContentForm({ ...contentForm, judul: e.target.value })} required />
          <select value={contentForm.tipe}
            onChange={(e) => setContentForm({ ...contentForm, tipe: e.target.value })}>
            <option value="url">URL</option>
            <option value="text">Teks</option>
            <option value="image">Gambar</option>
          </select>
          <input placeholder="Payload / URL" value={contentForm.payload}
            onChange={(e) => setContentForm({ ...contentForm, payload: e.target.value })} style={{ flex: 1 }} />
          <button type="submit">Tambah</button>
        </form>
        <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th>Judul</th><th>Tipe</th><th>Payload</th><th>Dibuat</th><th>Aksi</th></tr></thead>
          <tbody>
            {contents.map((c) => (
              <tr key={c.id}>
                <td>{c.judul}</td>
                <td>{c.tipe}</td>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.payload}</td>
                <td>{new Date(c.created_at).toLocaleDateString()}</td>
                <td><button onClick={() => deleteContent(c.id)}>Hapus</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Playlist & Push Content</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'end' }}>
          <div>
            <label>Device</label>
            <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}>
              <option value="">-- Pilih Device --</option>
              {devices.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
            </select>
          </div>
          <div>
            <label>Content</label>
            <select value={selectedContent} onChange={(e) => setSelectedContent(e.target.value)}>
              <option value="">-- Pilih Content --</option>
              {contents.map((c) => <option key={c.id} value={c.id}>{c.judul}</option>)}
            </select>
          </div>
          <button onClick={addToPlaylist} disabled={!selectedDevice || !selectedContent}>Tambah ke Playlist</button>
        </div>

        {devices.map((d) => {
          const items = devicePlaylists(d.id);
          if (items.length === 0) return null;
          return (
            <div key={d.id} style={{ marginBottom: 16, padding: 12, background: '#fff', borderRadius: 8 }}>
              <h3>{d.nama} <span style={{ color: d.status === 'online' ? 'green' : 'red' }}>({d.status})</span></h3>
              <table border={1} cellPadding={6} style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                <thead><tr><th>#</th><th>Content</th><th>Tipe</th><th>Aksi</th></tr></thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id}>
                      <td>{p.urutan + 1}</td>
                      <td>{p.contents?.judul || '-'}</td>
                      <td>{p.contents?.tipe || '-'}</td>
                      <td>
                        <button onClick={() => pushContent(d.id, p.content_id)} style={{ marginRight: 4 }}>Push</button>
                        <button onClick={() => removeFromPlaylist(p.id)}>Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </section>
    </div>
  );
}
