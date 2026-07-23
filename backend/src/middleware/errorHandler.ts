import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('[error]', err);

  // Datos invalidos enviados por el cliente (formularios, POS, etc.)
  if (err instanceof ZodError) {
    const message = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' — ');
    return res.status(400).json({ error: message || 'Datos invalidos' });
  }

  // Choques de valores unicos en MySQL (ej: email ya registrado)
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Ese valor ya esta en uso' });
  }
  // Otros errores de validacion de Sequelize
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors?.map((e: any) => e.message).join(' — ') || 'Datos invalidos';
    return res.status(400).json({ error: message });
  }

  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  res.status(status).json({ error: message });
}
