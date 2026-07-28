import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

interface Device { id: string; nama: string; lokasi: string; status: string; last_seen: string | null; }

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [form, setForm] = useState({ nama: '', lokasi: '' });

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
            <thead><tr><th>Nama</th><th>Lokasi</th><th>Status</th><th>Last Seen</th><th>Aksi</th></tr></thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.nama}</td>
                  <td>{d.lokasi}</td>
                  <td><span className={`badge ${d.status === 'online' ? 'badge-online' : 'badge-offline'}`}>{d.status}</span></td>
                  <td style={{ color: '#86868b' }}>{d.last_seen ? new Date(d.last_seen).toLocaleString() : '-'}</td>
                  <td><button className="btn btn-danger btn-small" onClick={() => handleDelete(d.id)}>Hapus</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
