import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Monitor, FileText, List, Menu, X, LogOut } from 'lucide-react';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

const iconProps = { className: 'sidebar-icon-wrap', strokeWidth: 1.5, size: 22 };

const icons = {
  overview: <LayoutDashboard {...iconProps} />,
  devices: <Monitor {...iconProps} />,
  contents: <FileText {...iconProps} />,
  playlist: <List {...iconProps} />,
};

const links = [
  { to: '/', end: true, icon: icons.overview, label: 'Overview' },
  { to: '/devices', icon: icons.devices, label: 'Devices' },
  { to: '/contents', icon: icons.contents, label: 'Contents' },
  { to: '/playlist', icon: icons.playlist, label: 'Playlist' },
];

export default function Sidebar({ collapsed, onToggle, onLogout }: Props) {
  const Hamburger = collapsed ? Menu : X;
  return (
    <>
      {!collapsed && <div className="sidebar-overlay" onClick={onToggle} />}
      <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className={`sidebar-header-inner ${collapsed ? 'center' : 'start'}`}>
            <button className="hamburger-btn" onClick={onToggle} title={collapsed ? 'Buka menu' : 'Tutup menu'}>
              <Hamburger size={20} strokeWidth={2} />
            </button>
            {!collapsed && (
              <div>
                <h1>Signage Panel</h1>
                <p>MJ Solution</p>
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => isActive ? 'active' : ''} title={collapsed ? link.label : undefined}>
              <span className="icon">{link.icon}</span>
              {!collapsed && <span className="nav-label">{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={onLogout} title="Logout">
            <LogOut size={16} strokeWidth={2} className="logout-btn-icon" />
            {!collapsed && <span className="logout-btn-text">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}
