import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PRIMARY = [
  { to: '/admin', label: 'Resumen', end: true, icon: 'M4 12 12 4l8 8M6 10v10h12V10' },
  { to: '/admin/ventas', label: 'Ventas', icon: 'M3 9l9-6 9 6-9 6-9-6Z M3 9v6l9 6 9-6V9' },
  { to: '/admin/stock', label: 'Stock', icon: 'M12 4a2 2 0 1 1 2 2v1l8 5a2 2 0 0 1-1 3.7H3A2 2 0 0 1 2 12l8-5V6a2 2 0 0 1 2-2Z' },
  { to: '/admin/reportes', label: 'Reportes', icon: 'M4 20V10M11 20V4M18 20v-7' },
];
const MORE = [
  { to: '/admin/gastos', label: 'Gastos', icon: 'M3 6h18v13H3zM3 10h18M7 14h2' },
  { to: '/admin/empleados', label: 'Empleados', icon: 'M9 8a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 8ZM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6' },
];

export function MobileNav() {
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <header className="mobile-topbar">
        <div className="mobile-brand">
          <div className="brand-mark" style={{ width: 28, height: 28, borderRadius: 9 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4a2 2 0 1 1 2 2v1l8 5a2 2 0 0 1-1 3.7H3A2 2 0 0 1 2 12l8-5V6a2 2 0 0 1 2-2Z" />
            </svg>
          </div>
          <span>{user?.tenantName}</span>
        </div>
        <button className="mobile-logout" onClick={logout} aria-label="Cerrar sesion">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </header>

      <nav className="mobile-tabbar">
        {PRIMARY.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`} onClick={() => setMoreOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button className={`tab-item${moreOpen ? ' active' : ''}`} onClick={() => setMoreOpen((o) => !o)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
          </svg>
          <span>Mas</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="mobile-more-sheet" onClick={() => setMoreOpen(false)}>
          <div className="mobile-more-card" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-more-handle" />
            {MORE.map((item) => (
              <NavLink key={item.to} to={item.to} className="mobile-more-link" onClick={() => setMoreOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
                {item.label}
              </NavLink>
            ))}
            <button className="mobile-more-link danger" onClick={logout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M16 17l5-5-5-5M21 12H9" /></svg>
              Cerrar sesion
            </button>
          </div>
        </div>
      )}
    </>
  );
}
