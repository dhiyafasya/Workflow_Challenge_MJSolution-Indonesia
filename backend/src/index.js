import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { initWebSocket } from './websocket.js';
import devicesRouter from './routes/devices.js';
import contentsRouter from './routes/contents.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use('/api/devices', devicesRouter);
app.use('/api/contents', contentsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

initWebSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
