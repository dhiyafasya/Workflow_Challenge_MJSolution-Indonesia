import { useState } from 'react';

interface Props {
  onLogin: (token: string) => void;
}

export default function Login({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const regRes = await fetch('http://localhost:3001/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error);
      }

      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem('token', data.token);
      onLogin(data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 40, width: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, color: '#1a1a2e', marginBottom: 4 }}>Signage Control Panel</h1>
          <p style={{ color: '#666', fontSize: 14 }}>MJ Solution Indonesia</p>
        </div>

        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderRadius: 8, overflow: 'hidden', border: '1px solid #ddd' }}>
          <button onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1, padding: '10px 0', cursor: 'pointer', border: 'none', fontWeight: 600,
              background: mode === 'login' ? '#1a1a2e' : '#f5f5f5',
              color: mode === 'login' ? '#fff' : '#666',
              transition: 'all 0.2s',
            }}>Login</button>
          <button onClick={() => { setMode('register'); setError(''); }}
            style={{
              flex: 1, padding: '10px 0', cursor: 'pointer', border: 'none', fontWeight: 600,
              background: mode === 'register' ? '#1a1a2e' : '#f5f5f5',
              color: mode === 'register' ? '#fff' : '#666',
              transition: 'all 0.2s',
            }}>Register</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: '#555', fontWeight: 500, fontSize: 14 }}>Email</label>
            <input type="email" placeholder="admin@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required
              style={{
                width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: 8,
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: '#555', fontWeight: 500, fontSize: 14 }}>Password</label>
            <input type="password" placeholder="Min 6 karakter" value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={6}
              style={{
                width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: 8,
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }} />
          </div>

          {error && <p style={{ color: '#e74c3c', fontSize: 14, textAlign: 'center' }}>{error}</p>}

          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 16, fontWeight: 600, color: '#fff',
              background: loading ? '#999' : '#1a1a2e',
              transition: 'all 0.2s',
            }}>
            {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
