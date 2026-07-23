import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AuthedRequest } from '../middleware/auth';
import { User } from '../models';

export async function listEmployees(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const tenantId = req.auth!.tenantId;
    const employees = await User.findAll({
      where: { tenant_id: tenantId },
      attributes: ['id', 'name', 'email', 'role', 'active', 'created_at'],
      order: [['name', 'ASC']],
    });
    res.json(employees);
  } catch (err) {
    next(err);
  }
}

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'employee']).default('employee'),
});

export async function createEmployee(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const tenantId = req.auth!.tenantId;
    const data = createSchema.parse(req.body);

    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) return res.status(409).json({ error: 'Ese email ya esta en uso' });

    const password_hash = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      tenant_id: tenantId,
      name: data.name,
      email: data.email,
      password_hash,
      role: data.role,
    });

    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, active: user.active });
  } catch (err) {
    next(err);
  }
}

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['admin', 'employee']).optional(),
  active: z.boolean().optional(),
});

export async function updateEmployee(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const tenantId = req.auth!.tenantId;
    const id = Number(req.params.id);
    const data = updateSchema.parse(req.body);

    const employee = await User.findOne({ where: { id, tenant_id: tenantId } });
    if (!employee) return res.status(404).json({ error: 'Empleado no encontrado' });

    if (employee.id === req.auth!.userId && data.active === false) {
      return res.status(400).json({ error: 'No podes desactivar tu propio usuario' });
    }

    await employee.update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.role !== undefined && { role: data.role }),
      ...(data.active !== undefined && { active: data.active }),
    });

    res.json({ id: employee.id, name: employee.name, email: employee.email, role: employee.role, active: employee.active });
  } catch (err) {
    next(err);
  }
}
