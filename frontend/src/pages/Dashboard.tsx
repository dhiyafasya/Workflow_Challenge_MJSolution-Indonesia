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

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [deviceForm, setDeviceForm] = useState({ nama: '', lokasi: '' });
  const [contentForm, setContentForm] = useState({ judul: '', tipe: 'url', payload: '' });
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    api.getDevices().then(setDevices).catch(console.error);
    api.getContents().then(setContents).catch(console.error);
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      switch (msg.type) {
        case 'device_added':
          setDevices((prev) => [...prev, msg.device]);
          break;
        case 'device_updated':
          setDevices((prev) => prev.map((d) => (d.id === msg.device.id ? msg.device : d)));
          break;
        case 'device_deleted':
          setDevices((prev) => prev.filter((d) => d.id !== msg.deviceId));
          break;
        case 'device_online':
          setDevices((prev) => prev.map((d) => (d.id === msg.deviceId ? { ...d, status: 'online' } : d)));
          break;
        case 'device_offline':
          setDevices((prev) => prev.map((d) => (d.id === msg.deviceId ? { ...d, status: 'offline' } : d)));
          break;
      }
    };
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  const addDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const device = await api.createDevice(deviceForm);
      setDevices((prev) => [...prev, device]);
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
      const content = await api.createContent(contentForm);
      setContents((prev) => [content, ...prev]);
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
                <td>{d.nama}</td>
                <td>{d.lokasi}</td>
                <td style={{ color: d.status === 'online' ? 'green' : 'red' }}>{d.status}</td>
                <td>{d.last_seen ? new Date(d.last_seen).toLocaleString() : '-'}</td>
                <td><button onClick={() => deleteDevice(d.id)}>Hapus</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Contents</h2>
        <form onSubmit={addContent} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input placeholder="Judul" value={contentForm.judul}
            onChange={(e) => setContentForm({ ...contentForm, judul: e.target.value })} required />
          <select value={contentForm.tipe}
            onChange={(e) => setContentForm({ ...contentForm, tipe: e.target.value })}>
            <option value="url">URL</option>
            <option value="text">Teks</option>
            <option value="image">Gambar</option>
          </select>
          <input placeholder="Payload / URL" value={contentForm.payload}
            onChange={(e) => setContentForm({ ...contentForm, payload: e.target.value })} />
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
    </div>
  );
}
