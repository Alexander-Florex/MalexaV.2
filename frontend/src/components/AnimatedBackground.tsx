/**
 * Fondo animado global: malla de color en movimiento + orbes de gradiente
 * que flotan suavemente. Se renderiza una sola vez en App.tsx, detrás de
 * todo el contenido, y se mantiene igual en login, POS y panel admin.
 */
export function AnimatedBackground() {
  return (
    <div className="anim-bg" aria-hidden="true">
      {/* Malla de color de fondo, en movimiento lento */}
      <div className="anim-mesh" />

      {/* Orbes principales */}
      <div className="anim-orb orb-1" />
      <div className="anim-orb orb-2" />
      <div className="anim-orb orb-3" />
      <div className="anim-orb orb-4" />
      <div className="anim-orb orb-5" />
      <div className="anim-orb orb-6" />

      {/* Figuras geométricas flotantes */}
      <div className="anim-shape shape-circle-1" />
      <div className="anim-shape shape-circle-2" />
      <div className="anim-shape shape-ring-1" />
      <div className="anim-shape shape-ring-2" />
      <div className="anim-shape shape-dot-grid" />
    </div>
  );
}