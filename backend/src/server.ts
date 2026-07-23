import express from 'express';
import http from 'http';
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
