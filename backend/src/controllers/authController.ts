import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User, Tenant } from '../models';
import { signToken } from '../utils/jwt';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ where: { email, active: true } });
    if (!user) return res.status(401).json({ error: 'Credenciales invalidas' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales invalidas' });

    const tenant = await Tenant.findByPk(user.tenant_id);

    const token = signToken({ userId: user.id, tenantId: user.tenant_id, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        tenantName: tenant?.name ?? '',
      },
    });
  } catch (err) {
    next(err);
  }
}

// Alta de un nuevo comercio (tenant) junto con su usuario administrador.
// Es el punto de entrada "SaaS": cualquier comercio nuevo se registra solo.
const registerSchema = z.object({
  tenantName: z.string().min(2),
  adminName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function registerTenant(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) return res.status(409).json({ error: 'Ese email ya esta registrado' });

    let baseSlug = slugify(data.tenantName) || 'comercio';
    let slug = baseSlug;
    let i = 1;
    while (await Tenant.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    const tenant = await Tenant.create({ name: data.tenantName, slug, plan: 'free' });
    const password_hash = await bcrypt.hash(data.password, 10);
    const admin = await User.create({
      tenant_id: tenant.id,
      name: data.adminName,
      email: data.email,
      password_hash,
      role: 'admin',
    });

    const token = signToken({ userId: admin.id, tenantId: tenant.id, role: 'admin' });

    res.status(201).json({
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        tenantId: tenant.id,
        tenantName: tenant.name,
      },
    });
  } catch (err) {
    next(err);
  }
}
