import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDashboardSummary, useProducts } from '../../api/hooks';
import { useToast } from '../../context/ToastContext';
import { SkeletonKpiGrid, SkeletonTable } from '../../components/Skeleton';
import { CountUp } from '../../components/CountUp';

const money = (n: number) => '$' + n.toLocaleString('es-AR');

export function Resumen() {
  const { data: summary, isLoading: loadingSum } = useDashboardSummary();
  const { data: products = [], isLoading: loadingProd } = useProducts();
  const { toast } = useToast();
  const [prevVentas, setPrevVentas] = useState(0);

  const ventasHoy = summary?.ventasHoy ?? 0;
  useEffect(() => {
    if (ventasHoy > prevVentas && prevVentas > 0) toast(`Nueva venta registrada 🎉`, 'success');
    setPrevVentas(ventasHoy);
  }, [ventasHoy]);

  const lowStock = products.filter(p => p.stock <= 5);

  return (
    <div>
      <div className="topbar">
        <div><h1>Resumen</h1><p className="topbar-sub">Vista general del comercio hoy</p></div>
      </div>

      {loadingSum ? <SkeletonKpiGrid count={4} /> : (
        <div className="kpi-grid">
          {[
            { label: 'Ventas hoy', value: summary?.ventasHoy ?? 0, formatter: money, icon: '💰', cls: 'kpi-sales' },
            { label: 'Gastos del mes', value: summary?.gastosMes ?? 0, formatter: money, icon: '💸', cls: 'kpi-expenses' },
            { label: 'Stock bajo', value: summary?.stockBajo ?? 0, formatter: (n: number) => String(Math.round(n)), icon: '⚠️', cls: 'kpi-low' },
            { label: 'Productos activos', value: summary?.productosActivos ?? 0, formatter: (n: number) => String(Math.round(n)), icon: '📦', cls: 'kpi-products' },
          ].map((k, i) => (
            <motion.div key={k.label} className={`card kpi-card ${k.cls}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <div className="kpi-icon">{k.icon}</div>
              <div className="kpi-value"><CountUp value={k.value} formatter={k.formatter} /></div>
              <div className="kpi-label">{k.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="content-grid">
        <div className="card">
          <div className="card-header"><h3>Productos con stock bajo</h3></div>
          {loadingProd ? <SkeletonTable rows={4} /> : lowStock.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">✅</div><p>Todo el stock está OK.</p></div>
          ) : (
            <div className="table-card">
              <table>
                <thead><tr><th>Producto</th><th>Categoría</th><th>Stock</th><th>Estado</th></tr></thead>
                <tbody>
                  {lowStock.map(p => {
                    const st = p.stock === 0
                      ? { label: 'Sin stock', cls: 'status-out' }
                      : { label: 'Stock bajo', cls: 'status-low' };
                    return (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td>
                        <td data-label="Categoría"><span className="cat-pill">{p.Category?.name ?? '—'}</span></td>
                        <td data-label="Stock" style={{ fontFamily: 'var(--f-mono)', fontWeight: 700 }}>{p.stock}</td>
                        <td data-label="Estado"><span className={`status-pill tag-shape ${st.cls}`}>{st.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><h3>Actividad reciente</h3></div>
          {loadingSum ? <SkeletonTable rows={5} cols={1} /> :
            summary?.actividadReciente?.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🔔</div><p>Sin actividad todavía.</p></div>
            ) : (
              <div className="activity-list">
                {summary?.actividadReciente?.map((ev, i) => (
                  <motion.div key={i} className="activity-item"
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <div className="activity-dot" />
                    <div>
                      <p dangerouslySetInnerHTML={{ __html: ev.message }} />
                      <span className="activity-time">{new Date(ev.at).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
