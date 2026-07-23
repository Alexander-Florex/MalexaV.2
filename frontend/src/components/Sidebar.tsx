import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', label: 'Resumen', end: true, icon: 'M4 12 12 4l8 8M6 10v10h12V10' },
  { to: '/admin/ventas', label: 'Ventas', icon: 'M3 9l9-6 9 6-9 6-9-6Z M3 9v6l9 6 9-6V9' },
  { to: '/admin/stock', label: 'Stock', icon: 'M12 4a2 2 0 1 1 2 2v1l8 5a2 2 0 0 1-1 3.7H3A2 2 0 0 1 2 12l8-5V6a2 2 0 0 1 2-2Z' },
  { to: '/admin/gastos', label: 'Gastos', icon: 'M3 6h18v13H3zM3 10h18M7 14h2' },
  { to: '/admin/empleados', label: 'Empleados', icon: 'M9 8a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 8ZM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6' },
  { to: '/admin/reportes', label: 'Reportes', icon: 'M4 20V10M11 20V4M18 20v-7' },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="brand-mini">
        <div className="brand-mark">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4a2 2 0 1 1 2 2v1l8 5a2 2 0 0 1-1 3.7H3A2 2 0 0 1 2 12l8-5V6a2 2 0 0 1 2-2Z" />
          </svg>
        </div>
        <span>Percha</span>
      </div>

      <nav className="nav-list">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-mini">
          <div className="avatar">{user?.name?.[0] ?? '?'}</div>
          <div>
            <p>{user?.name}</p>
            <p>{user?.tenantName}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>Cerrar sesion</button>
      </div>
    </aside>
  );
}
