import { NavLink } from 'react-router-dom';

interface Props {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: Props) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Signage Panel</h1>
        <p>MJ Solution Indonesia</p>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="icon">&#9632;</span> Overview
        </NavLink>
        <NavLink to="/devices" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="icon">&#9679;</span> Devices
        </NavLink>
        <NavLink to="/contents" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="icon">&#9670;</span> Contents
        </NavLink>
        <NavLink to="/playlist" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="icon">&#9654;</span> Playlist
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <button onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}
