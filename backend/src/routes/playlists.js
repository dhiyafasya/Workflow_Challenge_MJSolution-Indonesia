import { Router } from 'express';
import { supabase } from '../db.js';
import { sendToDevice, broadcast } from '../websocket.js';

const router = Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('playlists')
    .select('*, contents(*)')
    .order('urutan');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/device/:deviceId', async (req, res) => {
  const { data, error } = await supabase
    .from('playlists')
    .select('*, contents(*)')
    .eq('device_id', req.params.deviceId)
    .order('urutan');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { device_id, content_id } = req.body;
  if (!device_id || !content_id) return res.status(400).json({ error: 'device_id and content_id required' });

  const { count } = await supabase
    .from('playlists')
    .select('*', { count: 'exact', head: true })
    .eq('device_id', device_id);

  const { data, error } = await supabase
    .from('playlists')
    .insert({ device_id, content_id, urutan: count })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('playlists').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Playlist item deleted' });
});

router.post('/push/:deviceId', async (req, res) => {
  const { content_id } = req.body;
  if (!content_id) return res.status(400).json({ error: 'content_id required' });

  const { data: content } = await supabase
    .from('contents')
    .select('*')
    .eq('id', content_id)
    .single();

  if (!content) return res.status(404).json({ error: 'Content not found' });

  const sent = sendToDevice(req.params.deviceId, {
    type: 'push_content',
    content,
  });

  if (!sent) {
    return res.status(404).json({ error: 'Device offline or not connected' });
  }

  broadcast({ type: 'content_pushed', deviceId: req.params.deviceId, content });
  res.json({ message: 'Content pushed to device', content });
});

export default router;
