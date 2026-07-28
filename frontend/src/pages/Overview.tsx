import { useState, useEffect } from 'react';
import { api } from '../api';
import DonutChart from '../components/DonutChart';

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
  const onlinePct = devices.length ? Math.round((online / devices.length) * 100) : 0;
  const offlinePct = devices.length ? Math.round((offline / devices.length) * 100) : 0;

  const contentTypes = ['url', 'text', 'image'];
  const typeCounts = contentTypes.map((t) => contents.filter((c) => c.tipe === t).length);
  const maxType = Math.max(...typeCounts, 1);
  const typeLabel: Record<string, string> = { url: 'URL', text: 'Teks', image: 'Gambar' };

  return (
    <>
      <div className="page-header">
        <h2>Overview</h2>
        <p>Ringkasan sistem signage Anda</p>
      </div>

      <div className="stats-grid">
        <div className="metric-card">
          <div className="metric-chart">
            <DonutChart percentage={devices.length ? 100 : 0} color="#007aff" />
          </div>
          <div className="metric-info">
            <span className="metric-value">{devices.length}</span>
            <span className="metric-label">Total Devices</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-chart">
            <DonutChart percentage={onlinePct} color="#34c759" />
          </div>
          <div className="metric-info">
            <span className="metric-value">{online}</span>
            <span className="metric-label">Online</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-chart">
            <DonutChart percentage={offlinePct} color="#ff3b30" />
          </div>
          <div className="metric-info">
            <span className="metric-value">{offline}</span>
            <span className="metric-label">Offline</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-chart">
            <DonutChart percentage={contents.length ? 100 : 0} color="#007aff" />
          </div>
          <div className="metric-info">
            <span className="metric-value">{contents.length}</span>
            <span className="metric-label">Total Contents</span>
          </div>
        </div>
      </div>

      {devices.length > 0 && (
        <div className="overview-row">
          <div className="card overview-card">
            <h3>Device Status</h3>
            <div className="status-bar-wrap">
              <div className="status-bar">
                <div className="status-bar-fill online" style={{ width: `${onlinePct}%` }} />
                <div className="status-bar-fill offline" style={{ width: `${offlinePct}%` }} />
              </div>
              <div className="status-bar-legend">
                <span><span className="legend-dot" style={{ background: '#34c759' }} /> Online ({online})</span>
                <span><span className="legend-dot" style={{ background: '#ff3b30' }} /> Offline ({offline})</span>
              </div>
            </div>
          </div>

          {contents.length > 0 && (
            <div className="card overview-card">
              <h3>Content Types</h3>
              <div className="bar-chart">
                {contentTypes.map((t, i) => (
                  <div key={t} className="bar-row">
                    <span className="bar-label">{typeLabel[t]}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(typeCounts[i] / maxType) * 100}%` }} />
                    </div>
                    <span className="bar-value">{typeCounts[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
