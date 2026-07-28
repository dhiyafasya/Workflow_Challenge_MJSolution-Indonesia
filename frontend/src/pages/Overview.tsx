import { useState, useEffect } from 'react';
import { api } from '../api';

interface Device { id: string; nama: string; lokasi: string; status: string; last_seen: string | null; }
interface Content { id: string; judul: string; tipe: string; payload: string; created_at: string; }

export default function Overview() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [contents, setContents] = useState<Content[]>([]);

  useEffect(() => {
    api.getDevices().then(setDevices).catch(console.error);
    api.getContents().then(setContents).catch(console.error);
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'device_online')
        setDevices((prev) => prev.map((d) => d.id === msg.deviceId ? { ...d, status: 'online' } : d));
      else if (msg.type === 'device_offline')
        setDevices((prev) => prev.map((d) => d.id === msg.deviceId ? { ...d, status: 'offline' } : d));
    };
    return () => ws.close();
  }, []);

  const online = devices.filter((d) => d.status === 'online').length;
  const offline = devices.filter((d) => d.status === 'offline').length;

  return (
    <>
      <div className="page-header">
        <h2>Overview</h2>
        <p>Ringkasan sistem signage Anda</p>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-value blue">{devices.length}</div>
          <div className="stat-label">Total Devices</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value green">{online}</div>
          <div className="stat-label">Online</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value red">{offline}</div>
          <div className="stat-label">Offline</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value blue">{contents.length}</div>
          <div className="stat-label">Total Contents</div>
        </div>
      </div>

      <div className="card">
        <h3>Recent Devices</h3>
        {devices.length === 0 ? (
          <div className="empty-state"><p>Belum ada device terdaftar</p></div>
        ) : (
          <table>
            <thead><tr><th>Nama</th><th>Lokasi</th><th>Status</th><th>Last Seen</th></tr></thead>
            <tbody>
              {devices.slice(0, 5).map((d) => (
                <tr key={d.id}>
                  <td className="table-name">{d.nama}</td>
                  <td>{d.lokasi}</td>
                  <td><span className={`badge ${d.status === 'online' ? 'badge-online' : 'badge-offline'}`}>{d.status}</span></td>
                  <td className="table-muted">{d.last_seen ? new Date(d.last_seen).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
