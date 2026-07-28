import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import DevicesPage from './pages/DevicesPage';
import ContentsPage from './pages/ContentsPage';
import PlaylistPage from './pages/PlaylistPage';
import DeviceClient from './pages/DeviceClient';
import Login from './pages/Login';

function AdminLayout({ children }: { children: React.ReactNode }) {
  const [, setToken] = useState(localStorage.getItem('token') || '');

  return (
    <div className="layout">
      <Sidebar onLogout={() => { localStorage.removeItem('token'); setToken(''); window.location.reload(); }} />
      <main className="main-content">{children}</main>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  if (!token) return <Login onLogin={setToken} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/device" element={<DeviceClient />} />
        <Route path="/device/:id" element={<DeviceClient />} />
        <Route path="/*" element={
          <AdminLayout>
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
