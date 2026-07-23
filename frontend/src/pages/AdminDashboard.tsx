import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getSocket } from '../api/socket';
import { Sidebar } from '../components/Sidebar';
import { ActivityRail } from '../components/ActivityRail';
import { useAuth } from '../context/AuthContext';
import type { DashboardSummary, Product, ActivityEvent } from '../types';

function money(n: number) {
  return '$' + Math.round(n).toLocaleString('es-AR');
}

function stockStatus(stock: number, threshold: number) {
  if (stock === 0) return { label: 'Agotado', cls: 'status-out' };
  if (stock <= threshold) return { label: 'Stock bajo', cls: 'status-low' };
  return { label: 'En stock', cls: 'status-instock' };
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [summaryRes, productsRes] = await Promise.all([
        api.get<DashboardSummary>('/dashboard/summary'),
        api.get<Product[]>('/products'),
      ]);
      setSummary(summaryRes.data);
      setActivity(summaryRes.data.actividadReciente);
      setProducts(productsRes.data);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onActivity = (evt: ActivityEvent) => setActivity((prev) => [evt, ...prev].slice(0, 8));
    const onStockUpdated = (payload: { productId: number; stock: number }) => {
      setProducts((prev) => prev.map((p) => (p.id === payload.productId ? { ...p, stock: payload.stock } : p)));
    };
    socket.on('activity', onActivity);
    socket.on('stock:updated', onStockUpdated);
    return () => {
      socket.off('activity', onActivity);
      socket.off('stock:updated', onStockUpdated);
    };
  }, []);

  if (loading || !summary) return <div className="loading-screen">Cargando tu tienda...</div>;

  const maxVenta = Math.max(1, ...summary.ventasUltimos7Dias.map((d) => Number(d.total)));

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <header className="topbar">
          <div>
            <h1>Hola, {user?.name} 👋</h1>
            <p>{user?.tenantName} · {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </header>

        <div className="kpi-grid">
          <div className="card kpi-card">
            <div className="kpi-icon" style={{ background: 'var(--blush)' }}>💰</div>
            <div className="kpi-value">{money(summary.ventasHoy)}</div>
            <div className="kpi-label">Ventas de hoy</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-icon" style={{ background: '#FBE4D8' }}>⚠️</div>
            <div className="kpi-value">{summary.stockBajo}</div>
            <div className="kpi-label">Productos con stock bajo</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-icon" style={{ background: '#FDE3EA' }}>🧾</div>
            <div className="kpi-value">{money(summary.gastosMes)}</div>
            <div className="kpi-label">Gastos del mes</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-icon" style={{ background: '#E3F3EB' }}>🏷️</div>
            <div className="kpi-value">{summary.productosActivos}</div>
            <div className="kpi-label">Productos activos</div>
          </div>
        </div>

        <div className="content-grid">
          <div className="card">
            <h3>Ventas — ultimos 7 dias</h3>
            <div className="bar-chart">
              {summary.ventasUltimos7Dias.length === 0 && <p className="rail-empty">Todavia no hay ventas registradas.</p>}
              {summary.ventasUltimos7Dias.map((d) => (
                <div className="bar-col" key={d.day}>
                  <div className="bar" style={{ height: `${(Number(d.total) / maxVenta) * 100}%` }} />
                  <span>{new Date(d.day).toLocaleDateString('es-AR', { weekday: 'short' })}</span>
                </div>
              ))}
            </div>
          </div>
          <ActivityRail title="Actividad en tiempo real" items={activity} />
        </div>

        <div className="card table-card">
          <h3>Stock por producto</h3>
          <table>
            <thead>
              <tr><th>Producto</th><th>Categoria</th><th>Stock</th><th>Precio</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const st = stockStatus(p.stock, p.low_stock_threshold);
                const pct = Math.min(100, (p.stock / 45) * 100);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="prod-cell">
                        <div className="swatch" style={{ background: p.color_hex }} />
                        <div><p>{p.name}</p><p>{p.sku}</p></div>
                      </div>
                    </td>
                    <td><span className="cat-pill">{p.Category?.name ?? 'Sin categoria'}</span></td>
                    <td>
                      <div className="stock-bar-wrap">
                        <div className="stock-bar-track">
                          <div className="stock-bar-fill" style={{ width: `${pct}%`, background: st.cls === 'status-out' ? 'var(--coral)' : st.cls === 'status-low' ? 'var(--peach)' : 'var(--mint)' }} />
                        </div>
                        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 12 }}>{p.stock}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--f-mono)', fontWeight: 700 }}>{money(Number(p.price))}</td>
                    <td><span className={`status-pill tag-shape ${st.cls}`}>{st.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
