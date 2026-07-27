import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DeviceClient from './pages/DeviceClient';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Dashboard Admin</Link>
        <Link to="/device">Device Client</Link>
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
