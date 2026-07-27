import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';

export default function DeviceClient() {
  const { id } = useParams();
  const deviceId = id || 'device-' + Math.random().toString(36).slice(2, 8);
  const [wsStatus, setWsStatus] = useState('connecting');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3001?deviceId=${deviceId}`);

    ws.onopen = () => {
      setWsStatus('connected');
      api.updateDevice(deviceId, {}).catch(() => {});
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    };

    ws.onerror = () => setWsStatus('error');
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      console.log('Message from server:', msg);
    };

    wsRef.current = ws;
    return () => ws.close();
  }, [deviceId]);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#111',
      color: '#fff',
    }}>
      <h1>Device Client</h1>
      <p>Device ID: <strong>{deviceId}</strong></p>
      <p>WebSocket: <span style={{ color: wsStatus === 'connected' ? '#0f0' : '#f00' }}>{wsStatus}</span></p>
      <p style={{ marginTop: 24, opacity: 0.5 }}>Menunggu konten dari server...</p>
    </div>
  );
}
