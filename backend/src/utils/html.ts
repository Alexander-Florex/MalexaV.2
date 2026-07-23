/**
 * Escapa caracteres HTML especiales. Se usa SIEMPRE que se interpola un
 * valor ingresado por el usuario (nombre de producto, categoria, etc.)
 * dentro de un string que despues se renderiza con dangerouslySetInnerHTML
 * en el frontend (el feed de "Actividad reciente"). Sin esto, cualquier
 * usuario autenticado (incluso un empleado) podria inyectar HTML/JS que se
 * ejecute en el navegador de un admin que mire el dashboard.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
