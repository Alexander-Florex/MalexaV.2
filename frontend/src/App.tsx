import { lazy, Suspense } from 'react';
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AdminLayout } from './layouts/AdminLayout';
import { AnimatedBackground } from './components/AnimatedBackground';

// Carga perezosa: cada pantalla se descarga solo cuando el usuario entra a
// ella, en vez de venir todas juntas en el primer JS que se baja al abrir
// el login. Esto achica muchisimo el bundle inicial (recharts, que solo
// usa Reportes, ya no viaja al abrir el login o el POS).
const Login     = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Resumen   = lazy(() => import('./pages/admin/Resumen').then(m => ({ default: m.Resumen })));
const Ventas    = lazy(() => import('./pages/admin/Ventas').then(m => ({ default: m.Ventas })));
const Stock     = lazy(() => import('./pages/admin/Stock').then(m => ({ default: m.Stock })));
const Gastos    = lazy(() => import('./pages/admin/Gastos').then(m => ({ default: m.Gastos })));
const Empleados = lazy(() => import('./pages/admin/Empleados').then(m => ({ default: m.Empleados })));
const Reportes  = lazy(() => import('./pages/admin/Reportes').then(m => ({ default: m.Reportes })));
const EmployeePOS = lazy(() => import('./pages/EmployeePOS').then(m => ({ default: m.EmployeePOS })));

function PageFallback() {
  return <div className="loading-screen"><div className="spinner" /></div>;
}

function ProtectedRoute({ children, role }: { children: JSX.Element; role?: 'admin' | 'employee' }) {
  const { user, loading } = useAuth();
  if (loading) return <PageFallback />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/pos'} replace />;
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <PageFallback />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/pos'} replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AnimatedBackground />
          <Suspense fallback={<PageFallback />}>
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
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}