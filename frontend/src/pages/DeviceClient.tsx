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
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

    const ws = new WebSocket(`ws://localhost:3001?deviceId=${deviceId}`);

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return; }
      setWsStatus('connected');
      retryRef.current = 0;
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (!mountedRef.current) return;
      setWsStatus('disconnected');
      const delay = Math.min(1000 * Math.pow(2, retryRef.current), 30000);
      retryRef.current++;
      setTimeout(() => { if (mountedRef.current) connect(); }, delay);
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setWsStatus('error');
      ws.close();
    };

    ws.onmessage = (e) => {
      if (!mountedRef.current) return;
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
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const renderContent = () => {
    if (!currentContent) return null;
    switch (currentContent.tipe) {
      case 'url':
        return <iframe src={currentContent.payload} className="dc-content-frame" title={currentContent.judul} />;
      case 'image':
        return currentContent.payload ? <img src={currentContent.payload} alt={currentContent.judul} className="dc-content-img" /> : null;
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
  const [inputId, setInputId] = useState('');

  if (id) {
    return <DeviceView deviceId={id} />;
  }

  return (
    <div className="dc-picker">
      <h1 className="dc-picker-title">Device Client</h1>
      <p className="dc-picker-desc">Masukkan Device ID untuk menampilkan konten:</p>
      <div className="dc-input-row">
        <input value={inputId} onChange={(e) => setInputId(e.target.value)}
          placeholder="Device ID (contoh: 9bb9eb03-...)" />
        <button onClick={() => inputId && navigate(`/device/${inputId}`)}>Connect</button>
      </div>
    </div>
  );
}
