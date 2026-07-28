import { useState, useEffect, useRef } from 'react';
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#007aff' }}>{devices.length}</div>
          <div style={{ fontSize: 13, color: '#86868b', marginTop: 4 }}>Total Devices</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#2e7d32' }}>{online}</div>
          <div style={{ fontSize: 13, color: '#86868b', marginTop: 4 }}>Online</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#c62828' }}>{offline}</div>
          <div style={{ fontSize: 13, color: '#86868b', marginTop: 4 }}>Offline</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#007aff' }}>{contents.length}</div>
          <div style={{ fontSize: 13, color: '#86868b', marginTop: 4 }}>Total Contents</div>
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
                  <td style={{ fontWeight: 600 }}>{d.nama}</td>
                  <td>{d.lokasi}</td>
                  <td><span className={`badge ${d.status === 'online' ? 'badge-online' : 'badge-offline'}`}>{d.status}</span></td>
                  <td style={{ color: '#86868b' }}>{d.last_seen ? new Date(d.last_seen).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
