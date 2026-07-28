import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Content {
  id: string;
  judul: string;
  tipe: string;
  payload: string;
}

interface Device {
  id: string;
  nama: string;
  lokasi: string;
  status: string;
}

function DeviceView({ deviceId }: { deviceId: string }) {
  const [wsStatus, setWsStatus] = useState('connecting');
  const [currentContent, setCurrentContent] = useState<Content | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);

  const connect = useCallback(() => {
    const ws = new WebSocket(`ws://localhost:3001?deviceId=${deviceId}`);

    ws.onopen = () => {
      setWsStatus('connected');
      retryRef.current = 0;
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
      const delay = Math.min(1000 * Math.pow(2, retryRef.current), 30000);
      retryRef.current++;
      setTimeout(connect, delay);
    };

    ws.onerror = () => {
      setWsStatus('error');
      ws.close();
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'push_content' && msg.content) {
          setCurrentContent(msg.content);
        }
      } catch {}
    };

    wsRef.current = ws;
  }, [deviceId]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const renderContent = () => {
    if (!currentContent) return null;
    switch (currentContent.tipe) {
      case 'url':
        return <iframe src={currentContent.payload} style={{ width: '100%', height: '100%', border: 'none' }} title={currentContent.judul} />;
      case 'image':
        return <img src={currentContent.payload} alt={currentContent.judul} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />;
      case 'text':
        return <div style={{ fontSize: '3rem', textAlign: 'center', padding: 40 }}>{currentContent.payload}</div>;
      default:
        return <p>Unknown content type: {currentContent.tipe}</p>;
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#111', color: '#fff', position: 'relative' }}>
      {currentContent ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{renderContent()}</div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <h1 style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>{deviceId}</h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 20, background: wsStatus === 'connected' ? 'rgba(46,125,50,0.2)' : 'rgba(198,40,40,0.2)', color: wsStatus === 'connected' ? '#81c784' : '#e57373', fontSize: 13, fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
            {wsStatus === 'connected' ? 'Connected' : wsStatus}
          </div>
          {wsStatus === 'connected' && <p style={{ marginTop: 24, opacity: 0.3, fontSize: 14 }}>Menunggu konten dari server...</p>}
        </div>
      )}
      {wsStatus !== 'connected' && wsStatus !== 'connecting' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#c62828', color: '#fff', textAlign: 'center', padding: 8, fontSize: 13, zIndex: 9999 }}>
          WebSocket disconnected — mencoba reconnect...
        </div>
      )}
    </div>
  );
}

export default function DeviceClient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [inputId, setInputId] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:3001/api/devices', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => { setDevices(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (id) {
    return <DeviceView deviceId={id} />;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#fff', gap: 20, padding: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Device Client</h1>
      <p style={{ opacity: 0.5, fontSize: 14 }}>Pilih device yang akan menampilkan konten:</p>

      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 400 }}>
        <input value={inputId} onChange={(e) => setInputId(e.target.value)}
          placeholder="Atau masukkan Device ID manual"
          style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: 'none', fontSize: 14 }} />
        <button onClick={() => inputId && navigate(`/device/${inputId}`)}
          style={{ padding: '12px 20px', borderRadius: 8, border: 'none', background: '#007aff', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
          Connect
        </button>
      </div>

      {!token ? (
        <p style={{ opacity: 0.4, fontSize: 13 }}>Login dulu di dashboard untuk lihat daftar device</p>
      ) : loading ? (
        <p style={{ opacity: 0.4, fontSize: 13 }}>Loading...</p>
      ) : devices.length === 0 ? (
        <p style={{ opacity: 0.4, fontSize: 13 }}>Belum ada device. Buat device di dashboard dulu.</p>
      ) : (
        <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {devices.map((d) => (
            <button key={d.id} onClick={() => navigate(`/device/${d.id}`)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer',
                fontSize: 14, width: '100%', textAlign: 'left', transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
              <span><strong>{d.nama}</strong> <span style={{ opacity: 0.4 }}>— {d.lokasi}</span></span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.status === 'online' ? '#4caf50' : '#666', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
