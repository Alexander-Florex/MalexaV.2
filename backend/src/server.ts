import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { sequelize } from './config/db';
import './models'; // registra las asociaciones
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { initSocket } from './sockets/socket';

dotenv.config();

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error(
    '❌ Falta la variable de entorno JWT_SECRET en produccion. ' +
    'Sin esto, los tokens de sesion se firman con un secreto de desarrollo conocido ' +
    'y cualquiera podria falsificar una sesion. Definila en el panel de Hostinger (Variables de entorno) y volve a desplegar.'
  );
  process.exit(1);
}

const app = express();
app.use(compression()); // comprime todas las respuestas (JS, CSS, JSON) antes de enviarlas
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
  app.use(express.static(publicDir, {
    // Los archivos dentro de /assets tienen hash en el nombre (lo pone Vite),
    // asi que cambian de nombre en cada build: se pueden cachear "para siempre".
    // index.html NUNCA se cachea porque apunta a esos nombres con hash.
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }));
  // Catch-all para las rutas de React Router (que no empiecen con /api)
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.set('Cache-Control', 'no-cache');
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