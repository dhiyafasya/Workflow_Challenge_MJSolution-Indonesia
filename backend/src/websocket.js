import { WebSocketServer } from 'ws';

let wss = null;
const clients = new Map();

export function initWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const deviceId = url.searchParams.get('deviceId');

    if (deviceId) {
      clients.set(deviceId, ws);
      ws.deviceId = deviceId;
      console.log(`Device connected: ${deviceId}`);
    }

    ws.on('close', () => {
      if (ws.deviceId) {
        clients.delete(ws.deviceId);
        broadcast({ type: 'device_offline', deviceId: ws.deviceId });
        console.log(`Device disconnected: ${ws.deviceId}`);
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
    });
  });

  return wss;
}

export function broadcast(data) {
  if (!wss) return;
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
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
