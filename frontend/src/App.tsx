import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DeviceClient from './pages/DeviceClient';
import Login from './pages/Login';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  if (!token) return <Login onLogin={setToken} />;

  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Dashboard Admin</Link>
        <Link to="/device">Device Client</Link>
        <button onClick={() => { localStorage.removeItem('token'); setToken(''); }}
          style={{ marginLeft: 'auto', background: 'none', color: '#fff', border: '1px solid #fff', padding: '4px 12px', cursor: 'pointer' }}>
          Logout
        </button>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/device" element={<DeviceClient />} />
        <Route path="/device/:id" element={<DeviceClient />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
