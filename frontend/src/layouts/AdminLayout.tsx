import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import { getSocket } from '../api/socket';
import type { Product } from '../types';

export function AdminLayout() {
  const location = useLocation();
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Stock actualizado por una venta del empleado
    const onStockUpdated = (payload: { productId: number; stock: number }) => {
      qc.setQueryData<Product[]>(['products'], (old) =>
        old?.map((p) => (p.id === payload.productId ? { ...p, stock: payload.stock } : p))
      );
    };

    // Cualquier actividad (venta, gasto, ajuste) => actualiza resumen y reportes
    const onActivity = () => {
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
      qc.invalidateQueries({ queryKey: ['reports'] });
    };

    // Venta registrada => actualiza todas las listas de ventas en tiempo real
    const onSaleCreated = () => {
      qc.invalidateQueries({ queryKey: ['sales', 'all'] });
      qc.invalidateQueries({ queryKey: ['sales', 'local'] });
      qc.invalidateQueries({ queryKey: ['sales', 'live'] });
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
      qc.invalidateQueries({ queryKey: ['cash-session-current'] });
    };

    // Caja abierta/cerrada
    const onCashChanged = () => {
      qc.invalidateQueries({ queryKey: ['cash-session-current'] });
      qc.invalidateQueries({ queryKey: ['cash-sessions'] });
    };

    socket.on('stock:updated', onStockUpdated);
    socket.on('activity', onActivity);
    socket.on('sale:created', onSaleCreated);
    socket.on('cash:changed', onCashChanged);

    return () => {
      socket.off('stock:updated', onStockUpdated);
      socket.off('activity', onActivity);
      socket.off('sale:created', onSaleCreated);
      socket.off('cash:changed', onCashChanged);
    };
  }, [qc]);

  return (
    <div className="app-shell">
      <Sidebar />
      <MobileNav />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className="main-area"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
