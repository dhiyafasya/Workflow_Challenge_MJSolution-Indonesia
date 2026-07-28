import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Monitor } from 'lucide-react';

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
        return <iframe src={currentContent.payload} className="dc-content-frame" title={currentContent.judul} />;
      case 'image':
        return <img src={currentContent.payload} alt={currentContent.judul} className="dc-content-img" />;
      case 'text':
        return <div className="dc-content-text">{currentContent.payload}</div>;
      default:
        return <p>Unknown content type: {currentContent.tipe}</p>;
    }
  };

  return (
    <div className="dc-fullscreen">
      {currentContent ? (
        <div className="dc-center">{renderContent()}</div>
      ) : (
        <div className="dc-centered-col">
          <div className="dc-icon-box">
            <Monitor size={36} strokeWidth={1.5} />
          </div>
          <h1 className="dc-device-id">{deviceId}</h1>
          <div className={`dc-status-badge ${wsStatus === 'connected' ? 'connected' : 'disconnected'}`}>
            <span className="dc-status-dot" />
            {wsStatus === 'connected' ? 'Connected' : wsStatus}
          </div>
          {wsStatus === 'connected' && <p className="dc-waiting">Menunggu konten dari server...</p>}
        </div>
      )}
      {wsStatus !== 'connected' && wsStatus !== 'connecting' && (
        <div className="dc-disconnected-bar">WebSocket disconnected — mencoba reconnect...</div>
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
    <div className="dc-picker">
      <h1 className="dc-picker-title">Device Client</h1>
      <p className="dc-picker-desc">Pilih device yang akan menampilkan konten:</p>

      <div className="dc-input-row">
        <input value={inputId} onChange={(e) => setInputId(e.target.value)}
          placeholder="Atau masukkan Device ID manual" />
        <button onClick={() => inputId && navigate(`/device/${inputId}`)}>Connect</button>
      </div>

      {!token ? (
        <p className="dc-muted">Login dulu di dashboard untuk lihat daftar device</p>
      ) : loading ? (
        <p className="dc-muted">Loading...</p>
      ) : devices.length === 0 ? (
        <p className="dc-muted">Belum ada device. Buat device di dashboard dulu.</p>
      ) : (
        <div className="dc-device-list">
          {devices.map((d) => (
            <button key={d.id} onClick={() => navigate(`/device/${d.id}`)} className="dc-device-btn">
              <span className="dc-device-name"><strong>{d.nama}</strong> <span className="dc-device-loc">— {d.lokasi}</span></span>
              <span className={d.status === 'online' ? 'dc-status-dot-online' : 'dc-status-dot-offline'} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
