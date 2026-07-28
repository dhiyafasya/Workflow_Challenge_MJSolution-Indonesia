import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../db.js';
import { logActivity } from '../logActivity.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_me';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000,
};

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });
  if (!/[a-z]/.test(password)) return res.status(400).json({ error: 'Password harus ada huruf kecil' });
  if (!/[A-Z]/.test(password)) return res.status(400).json({ error: 'Password harus ada huruf besar' });
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return res.status(400).json({ error: 'Password harus ada karakter spesial (#, *, dll)' });

  const hashed = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('users')
    .insert({ email, password: hashed })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  logActivity(req, 'register', 'user', data.id, { email }, email);
  res.status(201).json({ message: 'User registered' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  res.cookie('token', token, COOKIE_OPTIONS);
  logActivity(req, 'login', 'user', user.id, { email }, email);
  res.json({ user: { id: user.id, email: user.email } });
});

router.get('/me', (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: { id: decoded.id, email: decoded.email } });
  } catch {
    res.clearCookie('token');
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  logActivity(req, 'logout', 'user');
  res.json({ message: 'Logged out' });
});

export function authenticate(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.clearCookie('token');
    res.status(401).json({ error: 'Invalid token' });
  }
}

export default router;
