import { WebSocketServer } from 'ws';
import { supabase } from './db.js';

let wss = null;
const clients = new Map();

export function initWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const deviceId = url.searchParams.get('deviceId');

      if (deviceId) {
        clients.set(deviceId, ws);
        ws.deviceId = deviceId;
        console.log(`Device connected: ${deviceId}`);

        supabase
          .from('devices')
          .update({ status: 'online', last_seen: new Date().toISOString() })
          .eq('id', deviceId)
          .then(({ error }) => {
            if (error) console.error('Update device online error:', error.message);
          });

        supabase
          .from('playlists')
          .select('content_id, contents(*)')
          .eq('device_id', deviceId)
          .order('urutan', { ascending: true })
          .limit(1)
          .single()
          .then(({ data, error }) => {
            if (!error && data?.contents) {
              ws.send(JSON.stringify({ type: 'push_content', content: data.contents }));
              console.log(`Sent current content to device ${deviceId}: ${data.contents.judul}`);
            }
          });

        broadcast({ type: 'device_online', deviceId });
      }

      ws.on('close', () => {
        if (ws.deviceId) {
          clients.delete(ws.deviceId);
          console.log(`Device disconnected: ${ws.deviceId}`);

          supabase
            .from('devices')
            .update({ status: 'offline' })
            .eq('id', ws.deviceId)
            .then(({ error }) => {
              if (error) console.error('Update device offline error:', error.message);
            });

          broadcast({ type: 'device_offline', deviceId: ws.deviceId });
        }
      });

      ws.on('error', (err) => {
        console.error('WebSocket error:', err.message);
      });
    } catch (err) {
      console.error('WebSocket connection handler error:', err.message);
      ws.close();
    }
  });

  return wss;
}

export function broadcast(data) {
  if (!wss) return;
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      try { client.send(message); } catch (err) {
        console.error('Broadcast send error:', err.message);
      }
    }
  });
}

export function sendToDevice(deviceId, data) {
  const ws = clients.get(deviceId);
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(data));
    return true;
  }
  return false;
}
