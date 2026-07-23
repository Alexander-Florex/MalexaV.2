import { io, Socket } from 'socket.io-client';

// Igual que en client.ts: en producción, sin VITE_API_URL definida,
// se conecta al mismo origen (io(undefined) => usa location actual).
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:4000');
let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket) socket.disconnect();
  socket = io(API_URL || undefined, { auth: { token } });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}