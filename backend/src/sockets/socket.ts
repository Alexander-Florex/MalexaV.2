import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';

let io: Server | null = null;

interface AuthedSocket extends Socket {
  tenantId?: number;
}

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket: AuthedSocket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Falta token de autenticacion'));
    try {
      const payload = verifyToken(token);
      socket.tenantId = payload.tenantId;
      next();
    } catch {
      next(new Error('Token invalido'));
    }
  });

  io.on('connection', (socket: AuthedSocket) => {
    const room = `tenant:${socket.tenantId}`;
    socket.join(room);

    socket.on('disconnect', () => {
      // no-op: el socket sale de la sala automaticamente
    });
  });

  return io;
}

/**
 * Emite un evento a todos los conectados (admin y empleados) de un mismo
 * comercio. Asi cualquier accion (venta, ajuste de stock, gasto cargado)
 * se refleja en vivo en todas las pantallas abiertas del mismo tenant.
 */
export function emitToTenant(tenantId: number, event: string, payload: unknown) {
  if (!io) return;
  io.to(`tenant:${tenantId}`).emit(event, payload);
}
