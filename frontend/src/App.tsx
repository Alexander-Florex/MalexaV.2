import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AdminLayout } from './layouts/AdminLayout';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Login } from './pages/Login';
import { Resumen } from './pages/admin/Resumen';
import { Ventas } from './pages/admin/Ventas';
import { Stock } from './pages/admin/Stock';
import { Gastos } from './pages/admin/Gastos';
import { Empleados } from './pages/admin/Empleados';
import { Reportes } from './pages/admin/Reportes';
import { EmployeePOS } from './pages/EmployeePOS';

function ProtectedRoute({ children, role }: { children: JSX.Element; role?: 'admin' | 'employee' }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/pos'} replace />;
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/pos'} replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AnimatedBackground />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/pos" element={<ProtectedRoute role="employee"><EmployeePOS /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Resumen />} />
              <Route path="ventas" element={<Ventas />} />
              <Route path="stock" element={<Stock />} />
              <Route path="gastos" element={<Gastos />} />
              <Route path="empleados" element={<Empleados />} />
              <Route path="reportes" element={<Reportes />} />
            </Route>
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
