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
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <h1 className="login-title">Signage Panel</h1>
          <p className="login-subtitle">MJ Solution Indonesia</p>
        </div>

        <div className="login-tabs">
          <button onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            className={`login-tab ${mode === 'login' ? 'active' : 'inactive'}`}>Login</button>
          <button onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
            className={`login-tab ${mode === 'register' ? 'active' : 'inactive'}`}>Register</button>
        </div>

        {successMsg && <div className="login-success">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>Email</label>
            <input type="email" placeholder="admin@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="login-field">
            <label>Password</label>
            <input type="password" placeholder="Min 6 karakter" value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={loading}
            className={`login-submit ${loading ? 'loading' : 'active'}`}>
            {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
