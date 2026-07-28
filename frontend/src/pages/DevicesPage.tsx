import { useState, useEffect } from 'react';
import { api } from '../api';

interface Device { id: string; nama: string; lokasi: string; status: string; last_seen: string | null; }

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [form, setForm] = useState({ nama: '', lokasi: '' });
  const [copiedId, setCopiedId] = useState('');

  useEffect(() => {
    api.getDevices().then(setDevices).catch(console.error);
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'device_online')
        setDevices((prev) => prev.map((d) => d.id === msg.deviceId ? { ...d, status: 'online' } : d));
      else if (msg.type === 'device_offline')
        setDevices((prev) => prev.map((d) => d.id === msg.deviceId ? { ...d, status: 'offline' } : d));
      else if (msg.type === 'device_deleted')
        setDevices((prev) => prev.filter((d) => d.id !== msg.deviceId));
    };
    return () => ws.close();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDevice(form);
      const updated = await api.getDevices();
      setDevices(updated);
      setForm({ nama: '', lokasi: '' });
    } catch (err) { alert(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus device ini?')) return;
    try {
      await api.deleteDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
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

  return (
    <>
      <div className="page-header">
        <h2>Devices</h2>
        <p>Kelola semua device signage</p>
      </div>

      <div className="card">
        <h3>Tambah Device</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input placeholder="Nama device" value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
            <input placeholder="Lokasi" value={form.lokasi}
              onChange={(e) => setForm({ ...form, lokasi: e.target.value })} />
            <button type="submit" className="btn btn-primary">Tambah</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Daftar Device</h3>
        {devices.length === 0 ? (
          <div className="empty-state"><p>Belum ada device. Tambahkan device baru di atas.</p></div>
        ) : (
          <table>
            <thead><tr><th>Nama</th><th>Lokasi</th><th>Status</th><th>Device URL</th><th>Aksi</th></tr></thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id}>
                  <td className="fw-600">{d.nama}</td>
                  <td>{d.lokasi}</td>
                  <td><span className={`badge ${d.status === 'online' ? 'badge-online' : 'badge-offline'}`}>{d.status}</span></td>
                  <td>
                    <button className="btn-icon" onClick={() => copyUrl(d.id)} title="Copy device URL">
                      {copiedId === d.id ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      )}
                    </button>
                  </td>
                  <td>
                    <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(d.id)} title="Hapus">
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
