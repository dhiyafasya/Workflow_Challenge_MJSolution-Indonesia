import { supabase } from '../db.js';

export async function logActivity(req, action, targetType = null, targetId = null, details = null) {
  try {
    const user = req.user || null;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null;
    await supabase.from('logs').insert({
      user_id: user?.id || null,
      email: user?.email || null,
      action,
      target_type: targetType,
      target_id: targetId,
      details: details ? JSON.stringify(details) : null,
      ip,
    });
  } catch (err) {
    console.error('Log error:', err.message);
  }
}
