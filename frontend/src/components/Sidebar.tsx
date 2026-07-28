import { NavLink } from 'react-router-dom';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

const icons = {
  overview: (
    <svg className="sidebar-icon-wrap" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  devices: (
    <svg className="sidebar-icon-wrap" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  contents: (
    <svg className="sidebar-icon-wrap" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  playlist: (
    <svg className="sidebar-icon-wrap" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
};

const hamburgerIcon = (open: boolean) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
    ) : (
      <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
    )}
  </svg>
);

const links = [
  { to: '/', end: true, icon: icons.overview, label: 'Overview' },
  { to: '/devices', icon: icons.devices, label: 'Devices' },
  { to: '/contents', icon: icons.contents, label: 'Contents' },
  { to: '/playlist', icon: icons.playlist, label: 'Playlist' },
];

export default function Sidebar({ collapsed, onToggle, onLogout }: Props) {
  return (
    <>
      {!collapsed && <div className="sidebar-overlay" onClick={onToggle} />}
      <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className={`sidebar-header-inner ${collapsed ? 'center' : 'start'}`}>
            <button className="hamburger-btn" onClick={onToggle} title={collapsed ? 'Buka menu' : 'Tutup menu'}>
              {hamburgerIcon(!collapsed)}
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="logout-btn-icon">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {!collapsed && <span className="logout-btn-text">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}
