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
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
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
        setSuccessMsg('Akun berhasil dibuat! Silakan login.');
        setMode('login');
        setPassword('');
        setLoading(false);
        return;
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
      background: 'linear-gradient(135deg, #0f3460 0%, #16213e 50%, #1a1a2e 100%)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 40, width: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: '#16213e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, color: '#16213e', marginBottom: 4, fontWeight: 700 }}>Signage Panel</h1>
          <p style={{ color: '#86868b', fontSize: 13 }}>MJ Solution Indonesia</p>
        </div>

        <div style={{
          display: 'flex', gap: 0, marginBottom: 24, borderRadius: 10, overflow: 'hidden',
          border: '1px solid #e8e8ed', background: '#f5f5f7',
        }}>
          <button onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1, padding: '10px 0', cursor: 'pointer', border: 'none', fontWeight: 600, fontSize: 14,
              background: mode === 'login' ? '#16213e' : 'transparent',
              color: mode === 'login' ? '#fff' : '#86868b',
              transition: 'all 0.2s', borderRadius: mode === 'login' ? '9px' : 0,
            }}>Login</button>
          <button onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1, padding: '10px 0', cursor: 'pointer', border: 'none', fontWeight: 600, fontSize: 14,
              background: mode === 'register' ? '#16213e' : 'transparent',
              color: mode === 'register' ? '#fff' : '#86868b',
              transition: 'all 0.2s', borderRadius: mode === 'register' ? '9px' : 0,
            }}>Register</button>
        </div>

        {successMsg && (
          <div style={{
            background: '#e8f5e9', color: '#2e7d32', padding: '12px 16px', borderRadius: 10,
            marginBottom: 16, fontSize: 14, fontWeight: 500, textAlign: 'center',
          }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: '#555', fontWeight: 500, fontSize: 13 }}>Email</label>
            <input type="email" placeholder="admin@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required
              style={{
                width: '100%', padding: '12px 14px', border: '1px solid #d2d2d7', borderRadius: 10,
                fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#007aff'}
              onBlur={(e) => e.target.style.borderColor = '#d2d2d7'} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: '#555', fontWeight: 500, fontSize: 13 }}>Password</label>
            <input type="password" placeholder="Min 6 karakter" value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={6}
              style={{
                width: '100%', padding: '12px 14px', border: '1px solid #d2d2d7', borderRadius: 10,
                fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#007aff'}
              onBlur={(e) => e.target.style.borderColor = '#d2d2d7'} />
          </div>

          {error && <p style={{ color: '#ff3b30', fontSize: 14, textAlign: 'center', fontWeight: 500 }}>{error}</p>}

          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 15, fontWeight: 600, color: '#fff',
              background: loading ? '#a0a0a0' : '#16213e',
              transition: 'all 0.2s',
            }}>
            {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
