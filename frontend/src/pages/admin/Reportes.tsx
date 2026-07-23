import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useReports } from '../../api/hooks';
import { SkeletonTable } from '../../components/Skeleton';

function money(n: number) {
  return '$' + Math.round(n).toLocaleString('es-AR');
}

const PALETTE = ['#DD6E9C', '#F1A8C7', '#F6C39A', '#A9DDC7', '#C9A8C2', '#7B93AD'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <p className="ct-label">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey} className="ct-row"><span style={{ background: p.color || p.fill }} />{p.name}: <strong>{money(p.value)}</strong></p>
      ))}
    </div>
  );
}

export function Reportes() {
  const { data, isLoading } = useReports();

  if (isLoading || !data) {
    return (
      <>
        <header className="topbar"><div><h1>Reportes</h1></div></header>
        <SkeletonTable rows={6} />
      </>
    );
  }

  const monthlyData = data.ingresosVsGastos.map((m) => ({
    mes: new Date(m.month + '-02').toLocaleDateString('es-AR', { month: 'short' }),
    Ingresos: m.ingresos,
    Gastos: m.gastos,
  }));
  const categoriaData = data.ventasPorCategoria.map((c) => ({ name: c.categoria, value: Number(c.total) }));
  const gastosData = data.gastosPorCategoria.map((g) => ({ name: g.categoria, value: Number(g.total) }));

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Reportes</h1>
          <p>Ultimos 30 dias de actividad del comercio</p>
        </div>
      </header>

      <div className="card">
        <h3>Ingresos vs. gastos — ultimos 6 meses</h3>
        {monthlyData.every((m) => m.Ingresos === 0 && m.Gastos === 0) ? (
          <p className="rail-empty">Todavia no hay suficiente historial para graficar esta tendencia.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData} margin={{ left: -10, right: 10 }}>
              <defs>
                <linearGradient id="gIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#DD6E9C" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#DD6E9C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gGastos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F0917E" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#F0917E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F2D7E3" strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#8A6B82' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8A6B82' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12.5 }} />
              <Area type="monotone" dataKey="Ingresos" stroke="#DD6E9C" strokeWidth={2.5} fill="url(#gIngresos)" animationDuration={700} />
              <Area type="monotone" dataKey="Gastos" stroke="#D9614C" strokeWidth={2.5} fill="url(#gGastos)" animationDuration={700} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="content-grid">
        <div className="card">
          <h3>Ventas por categoria</h3>
          {categoriaData.length === 0 ? (
            <p className="rail-empty">Sin ventas en los ultimos 30 dias.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoriaData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid stroke="#F2D7E3" strokeDasharray="4 6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#8A6B82' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12, fill: '#3F2A3A' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241,168,199,.12)' }} />
                <Bar dataKey="value" name="Ventas" radius={[0, 8, 8, 0]} animationDuration={700}>
                  {categoriaData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3>Gastos por categoria</h3>
          {gastosData.length === 0 ? (
            <p className="rail-empty">Sin gastos cargados en los ultimos 30 dias.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={gastosData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={86} paddingAngle={3} animationDuration={700}>
                  {gastosData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11.5 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="content-grid">
        <div className="card">
          <h3>Productos mas vendidos</h3>
          {data.topProductos.length === 0 ? (
            <p className="rail-empty">Todavia no hay ventas para rankear productos.</p>
          ) : (
            <ul className="ranking-list">
              {data.topProductos.map((p, i) => (
                <li key={p.id} className="ranking-row">
                  <span className="ranking-num">{i + 1}</span>
                  <div className="swatch" style={{ background: "#F1A8C7", width: 26, height: 26 }} />
                  <div className="ranking-info"><p>{p.name}</p><p>{p.cantidad} unidades vendidas</p></div>
                  <span className="ranking-total">{money(Number(p.total))}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3>Ranking por empleado</h3>
          {data.ventasPorEmpleado.length === 0 ? (
            <p className="rail-empty">Todavia no hay ventas registradas por empleados.</p>
          ) : (
            <ul className="ranking-list">
              {data.ventasPorEmpleado.map((e, i) => (
                <li key={e.empleado} className="ranking-row">
                  <span className="ranking-num">{i + 1}</span>
                  <div className="avatar" style={{ width: 26, height: 26, fontSize: 11 }}>{e.empleado[0]}</div>
                  <div className="ranking-info"><p>{e.empleado}</p><p>{e.cantidad} ventas</p></div>
                  <span className="ranking-total">{money(Number(e.total))}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
