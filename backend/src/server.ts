import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './config/db';
import './models'; // registra las asociaciones
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { initSocket } from './sockets/socket';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'percha-backend' }));
app.use('/api', routes);

app.use(errorHandler);

// ── Sirve el frontend (React) compilado, si existe backend/public ──
// Esto permite desplegar UN solo proceso Node (API + Socket.IO + frontend)
// en hosting compartido/managed, donde solo hace falta un Web App de Node.js.
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // Catch-all para las rutas de React Router (que no empiecen con /api)
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = Number(process.env.PORT) || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Conexion a MySQL OK');
  } catch (err) {
    console.error('No se pudo conectar a MySQL. Revisa tu .env y que MySQL este corriendo.', err);
    process.exit(1);
  }

  httpServer.listen(PORT, () => {
    console.log(`Percha API escuchando en http://localhost:${PORT}`);
  });
}

start();