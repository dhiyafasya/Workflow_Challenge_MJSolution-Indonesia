import { Router } from 'express';
import { supabase } from '../db.js';
import { broadcast } from '../websocket.js';

const router = Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('contents').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('contents').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Content not found' });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { judul, tipe, payload } = req.body;
  if (!judul || !tipe) return res.status(400).json({ error: 'judul and tipe are required' });

  const { data, error } = await supabase
    .from('contents')
    .insert({ judul, tipe, payload })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  broadcast({ type: 'content_added', content: data });
  res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
  const { judul, tipe, payload } = req.body;
  const { data, error } = await supabase
    .from('contents')
    .update({ judul, tipe, payload })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  broadcast({ type: 'content_updated', content: data });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('contents').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  broadcast({ type: 'content_deleted', contentId: req.params.id });
  res.json({ message: 'Content deleted' });
});

export default router;
