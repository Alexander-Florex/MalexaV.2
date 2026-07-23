import { QueryClient } from '@tanstack/react-query';

/**
 * Estrategia de caché agresiva para que TODO se sienta instantáneo:
 *
 * staleTime por tipo de dato:
 *  - Catálogos estáticos (categorías, empleados): 10 minutos → nunca se refetcha solo
 *  - Productos / stock: 2 minutos → se actualiza en background sin bloquear la UI
 *  - Ventas / resumen: 60 seg → balance entre frescura y velocidad
 *  - Caja actual: 15 seg → necesita ser fresco (lo maneja el hook con refetchInterval)
 *
 * gcTime 30 min → los datos persisten en memoria aunque la pantalla no esté montada,
 * así al volver a entrar ya están ahí sin un solo fetch.
 *
 * refetchOnWindowFocus false → no re-fetcha cada vez que el usuario alt-tabea.
 * refetchOnMount 'always' false → si ya hay datos en cache, los muestra YA.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            60_000,      // 1 min por defecto
      gcTime:               30 * 60_000, // 30 min en memoria
      refetchOnWindowFocus: false,
      refetchOnMount:       false,       // usa cache existente al montar
      retry:                1,
    },
  },
});

/** staleTime customizados por queryKey (se aplican en los hooks individuales) */
export const STALE = {
  static:   10 * 60_000, // categorías, empleados, proveedores
  products:  2 * 60_000, // stock (se actualiza via socket de todos modos)
  sales:         60_000, // ventas
  dashboard:     30_000, // resumen del día
  cashSession:   15_000, // caja (tiene refetchInterval propio)
} as const;
