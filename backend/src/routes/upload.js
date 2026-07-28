import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../db.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const BUCKET = 'content-images';

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File required' });

    const ext = req.file.originalname.split('.').pop() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

    if (error) {
      if (error.message.includes('bucket')) {
        const { error: createErr } = await supabase.storage.createBucket(BUCKET, { public: true });
        if (createErr) return res.status(500).json({ error: createErr.message });
        const { data: retryData, error: retryErr } = await supabase.storage
          .from(BUCKET)
          .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
        if (retryErr) return res.status(500).json({ error: retryErr.message });
        const url = supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
        return res.json({ url });
      }
      return res.status(500).json({ error: error.message });
    }

    const url = supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
