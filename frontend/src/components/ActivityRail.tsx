import type { ActivityEvent } from '../types';

interface Props {
  title: string;
  items: ActivityEvent[];
}

export function ActivityRail({ title, items }: Props) {
  return (
    <div className="card rail-card">
      <div className="rail-header">
        <h3>{title}</h3>
        <span className="live-label"><span className="live-dot" />en vivo</span>
      </div>
      {items.length === 0 ? (
        <p className="rail-empty">Todavia no hay actividad. Las acciones del equipo van a aparecer aca al instante.</p>
      ) : (
        <ul className="rail">
          {items.map((item, i) => (
            <li className="rail-item" key={`${item.at}-${i}`}>
              <div className="rail-card-inner tag-shape">
                {/* el mensaje viene formateado desde el backend (negritas simples) */}
                <p dangerouslySetInnerHTML={{ __html: item.message }} />
                <time>{new Date(item.at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
