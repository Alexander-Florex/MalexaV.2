export function SkeletonBlock({ height = 16, width = '100%', radius = 8 }: { height?: number; width?: string | number; radius?: number }) {
  return <div className="skeleton" style={{ height, width, borderRadius: radius }} />;
}

export function SkeletonKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="kpi-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card kpi-card" key={i}>
          <SkeletonBlock height={38} width={38} radius={12} />
          <SkeletonBlock height={26} width="60%" />
          <SkeletonBlock height={12} width="80%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card table-card">
      <SkeletonBlock height={20} width={180} />
      <div style={{ height: 18 }} />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: 16, padding: '13px 0', borderTop: r > 0 ? '1px solid var(--line)' : 'none' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBlock key={c} height={14} width={c === 0 ? '28%' : '14%'} />
          ))}
        </div>
      ))}
    </div>
  );
}


// Alias conveniente para uso en páginas
export function Skeleton({ type = 'table', rows = 5 }: { type?: 'table' | 'kpi'; rows?: number }) {
  if (type === 'kpi') return <SkeletonKpiGrid count={rows} />;
  return <SkeletonTable rows={rows} />;
}
