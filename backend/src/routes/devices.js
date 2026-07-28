import { Router } from 'express';
import { supabase } from '../db.js';
import { broadcast } from '../websocket.js';
import { logActivity } from '../logActivity.js';

const router = Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('devices').select('*').order('nama');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('devices').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Device not found' });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { nama, lokasi } = req.body;
  if (!nama) return res.status(400).json({ error: 'Nama is required' });

  const { data, error } = await supabase
    .from('devices')
    .insert({ nama, lokasi, status: 'offline' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  broadcast({ type: 'device_added', device: data });
  await logActivity(req, 'create', 'device', data.id, { nama, lokasi });
  res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
  const { nama, lokasi } = req.body;
  const { data, error } = await supabase
    .from('devices')
    .update({ nama, lokasi })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  broadcast({ type: 'device_updated', device: data });
  await logActivity(req, 'update', 'device', req.params.id, { nama, lokasi });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('devices').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  broadcast({ type: 'device_deleted', deviceId: req.params.id });
  await logActivity(req, 'delete', 'device', req.params.id);
  res.json({ message: 'Device deleted' });
});

export default router;
