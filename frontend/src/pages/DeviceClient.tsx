import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';

interface Content {
  id: string;
  judul: string;
  tipe: string;
  payload: string;
}

export default function DeviceClient() {
  const { id } = useParams();
  const deviceId = id || 'device-' + Math.random().toString(36).slice(2, 8);
  const [wsStatus, setWsStatus] = useState('connecting');
  const [currentContent, setCurrentContent] = useState<Content | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);

  const connect = useCallback(() => {
    const ws = new WebSocket(`ws://localhost:3001?deviceId=${deviceId}`);

    ws.onopen = () => {
      setWsStatus('connected');
      retryRef.current = 0;
      fetch('http://localhost:3001/api/devices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: deviceId, lokasi: 'Device Client' }),
      }).catch(() => {});
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
        return (
          <iframe src={currentContent.payload} style={{ width: '100%', height: '100%', border: 'none' }} title={currentContent.judul} />
        );
      case 'image':
        return (
          <img src={currentContent.payload} alt={currentContent.judul}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        );
      case 'text':
        return (
          <div style={{ fontSize: '3rem', textAlign: 'center', padding: 40 }}>{currentContent.payload}</div>
        );
      default:
        return <p>Unknown content type: {currentContent.tipe}</p>;
    }
  };

  return (
    <div style={{
      height: '100vh', width: '100vw', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: '#111', color: '#fff', position: 'relative',
    }}>
      {currentContent ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {renderContent()}
        </div>
      ) : (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <h1>Device Client</h1>
          <p>Device ID: <strong>{deviceId}</strong></p>
          <p>WebSocket: <span style={{ color: wsStatus === 'connected' ? '#0f0' : '#f00' }}>{wsStatus}</span></p>
          <p style={{ marginTop: 24, opacity: 0.5 }}>Menunggu konten dari server...</p>
        </div>
      )}

      {wsStatus !== 'connected' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          background: '#e74c3c', color: '#fff',
          textAlign: 'center', padding: 8, fontSize: 14, zIndex: 9999,
        }}>
          WebSocket {wsStatus} — mencoba reconnect...
        </div>
      )}
    </div>
  );
}
