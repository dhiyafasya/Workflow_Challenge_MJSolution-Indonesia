import { useState, useEffect } from 'react';
import { api } from '../api';

interface Device { id: string; nama: string; lokasi: string; status: string; last_seen: string | null; }
interface Content { id: string; judul: string; tipe: string; payload: string; created_at: string; }

const icons = {
  devices: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  online: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/>
    </svg>
  ),
  offline: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/>
    </svg>
  ),
  contents: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
};

const cards = [
  { key: 'total', icon: icons.devices, gradient: 'linear-gradient(135deg, #007aff, #5856d6)', label: 'Total Devices' },
  { key: 'online', icon: icons.online, gradient: 'linear-gradient(135deg, #34c759, #30d158)', label: 'Online' },
  { key: 'offline', icon: icons.offline, gradient: 'linear-gradient(135deg, #ff3b30, #ff453a)', label: 'Offline' },
  { key: 'contents', icon: icons.contents, gradient: 'linear-gradient(135deg, #007aff, #5856d6)', label: 'Total Contents' },
];

export default function Overview() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedYear, setSelectedYear] = useState('');

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

  const getValue = (key: string) => {
    switch (key) {
      case 'total': return devices.length;
      case 'online': return online;
      case 'offline': return offline;
      case 'contents': return contents.length;
      default: return 0;
    }
  };

  const contentTypes = ['url', 'text', 'image'];
  const typeCounts = contentTypes.map((t) => contents.filter((c) => c.tipe === t).length);
  const maxType = Math.max(...typeCounts, 1);
  const typeLabel: Record<string, string> = { url: 'URL', text: 'Teks', image: 'Gambar' };

  const availableYears = [...new Set(contents.map((c) => new Date(c.created_at).getFullYear()))].sort();
  const yearFilter = selectedYear || (availableYears.length > 0 ? String(availableYears[availableYears.length - 1]) : String(new Date().getFullYear()));

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyData = (() => {
    const year = Number(yearFilter);
    const months: { label: string; count: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(year, i, 1);
      const label = monthNames[i];
      const count = contents.filter((c) => {
        const cd = new Date(c.created_at);
        return cd.getFullYear() === year && cd.getMonth() === i;
      }).length;
      months.push({ label, count });
    }
    return months;
  })();
  const maxMonthly = Math.max(...monthlyData.map((m) => m.count), 1);

  return (
    <>
      <div className="page-header">
        <h2>Overview</h2>
        <p>Ringkasan sistem signage Anda</p>
      </div>

      <div className="stats-grid">
        {cards.map((card) => (
          <div key={card.key} className="metric-card-icon">
            <div className="metric-icon-box" style={{ background: card.gradient }}>
              {card.icon}
            </div>
            <div className="metric-value-icon">{getValue(card.key)}</div>
            <div className="metric-label-icon">{card.label}</div>
          </div>
        ))}
      </div>

      {(devices.length > 0 || contents.length > 0) && (
        <div className="overview-row">
          {devices.length > 0 && (
            <div className="card overview-card">
              <h3>Device Status</h3>
              <StatusBar online={online} offline={offline} total={devices.length} />
            </div>
          )}
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

      <div className="card">
        <div className="trend-header">
          <h3>Monthly Trend</h3>
          <select className="trend-year" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <LineChart data={monthlyData} max={maxMonthly} />
      </div>
    </>
  );
}

function LineChart({ data, max }: { data: { label: string; count: number }[]; max: number }) {
  const w = 600;
  const h = 150;
  const pad = { top: 20, right: 20, bottom: 30, left: 30 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const stepX = innerW / (data.length - 1);

  const points = data.map((d, i) => ({
    x: pad.left + i * stepX,
    y: pad.top + innerH - (d.count / max) * innerH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${pad.top + innerH} L${points[0].x},${pad.top + innerH} Z`;

  return (
    <div className="line-chart-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} className="line-chart-svg">
        <line className="grid-base" x1={pad.left} y1={pad.top + innerH} x2={pad.left + innerW} y2={pad.top + innerH} strokeWidth="1" />
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <line key={r} className="grid-line" x1={pad.left} y1={pad.top + innerH * (1 - r)} x2={pad.left + innerW} y2={pad.top + innerH * (1 - r)} strokeWidth="1" />
        ))}
        <path d={areaPath} fill="rgba(52,199,89,0.12)" />
        <path d={linePath} fill="none" stroke="rgba(52,199,89,0.6)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle className="chart-dot" cx={p.x} cy={p.y} r="3" fill="rgba(52,199,89,0.6)" strokeWidth="2" />
            <text className="chart-label" x={p.x} y={pad.top + innerH + 16} textAnchor="middle" fontSize="9">{data[i].label}</text>
            <text className="chart-value" x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" fontWeight="600">{data[i].count}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function StatusBar({ online, offline, total }: { online: number; offline: number; total: number }) {
  const onlinePct = Math.round((online / total) * 100);
  const offlinePct = Math.round((offline / total) * 100);
  return (
    <div className="status-bar-wrap">
      <div className="status-bar">
        <div className="status-bar-fill online" style={{ width: `${onlinePct}%` }} />
        <div className="status-bar-fill offline" style={{ width: `${offlinePct}%` }} />
      </div>
      <div className="status-bar-legend">
        <span><span className="legend-dot dot-online" /> Online ({online})</span>
        <span><span className="legend-dot dot-offline" /> Offline ({offline})</span>
      </div>
    </div>
  );
}
