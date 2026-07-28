import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import DevicesPage from './pages/DevicesPage';
import ContentsPage from './pages/ContentsPage';
import PlaylistPage from './pages/PlaylistPage';
import DeviceClient from './pages/DeviceClient';
import Login from './pages/Login';

function AdminLayout({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="layout">
      <Sidebar
        collapsed={!sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        onLogout={onLogout}
      />
      <main className="main-content">{children}</main>
    </div>
  );
}

function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/auth/me', { credentials: 'include' })
      .then((res) => setAuthenticated(res.ok))
      .catch(() => setAuthenticated(false));
  }, []);

  if (authenticated === null) return null;

  if (!authenticated) return <Login onLogin={() => setAuthenticated(true)} />;

  const handleLogout = async () => {
    await fetch('http://localhost:3001/api/auth/logout', { method: 'POST', credentials: 'include' });
    setAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/device" element={<DeviceClient />} />
        <Route path="/device/:id" element={<DeviceClient />} />
        <Route path="/*" element={
          <AdminLayout onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/contents" element={<ContentsPage />} />
              <Route path="/playlist" element={<PlaylistPage />} />
            </Routes>
          </AdminLayout>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
