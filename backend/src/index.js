import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import cookieParser from 'cookie-parser';
import { initWebSocket } from './websocket.js';
import devicesRouter from './routes/devices.js';
import contentsRouter from './routes/contents.js';
import playlistsRouter from './routes/playlists.js';
import authRouter, { authenticate } from './routes/auth.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);

app.use('/api/devices', authenticate, devicesRouter);
app.use('/api/contents', authenticate, contentsRouter);
app.use('/api/playlists', authenticate, playlistsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

initWebSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
