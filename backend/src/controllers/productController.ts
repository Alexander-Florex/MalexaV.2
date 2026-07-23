import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthedRequest } from '../middleware/auth';
import { sequelize } from '../config/db';
import { Product, ProductPriceTier, Category, StockMovement } from '../models';
import { emitToTenant } from '../sockets/socket';
import { escapeHtml } from '../utils/html';

export async function listProducts(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const products = await Product.findAll({
      where: { tenant_id: req.auth!.tenantId, active: true },
      include: [
        { model: Category, attributes: ['id', 'name'] },
        { model: ProductPriceTier, as: 'tiers', attributes: ['id','type','quantity','price'] },
      ],
      order: [['name', 'ASC']],
    });
    res.json(products);
  } catch (err) { next(err); }
}

const tierSchema = z.object({
  type:     z.enum(['minorista','mayorista']),
  quantity: z.number().int().positive(),
  price:    z.number().nonnegative(),
});

const createProductSchema = z.object({
  name:       z.string().min(2),
  categoryId: z.number().int().optional().nullable(),
  stock:      z.number().int().nonnegative().default(0),
  tiers:      z.array(tierSchema).optional().default([]),
});

export async function createProduct(req: AuthedRequest, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const tenantId = req.auth!.tenantId;
    const data = createProductSchema.parse(req.body);

    const product = await Product.create(
      { tenant_id: tenantId, category_id: data.categoryId ?? null, name: data.name, stock: data.stock },
      { transaction: t }
    );
    for (const tier of data.tiers) {
      await ProductPriceTier.create({ product_id: product.id, ...tier }, { transaction: t });
    }
    await t.commit();

    emitToTenant(tenantId, 'activity', {
      message: `Se agrego el producto <strong>${escapeHtml(product.name)}</strong>`,
      at: new Date().toISOString(),
    });

    const full = await Product.findByPk(product.id, {
      include: [{ model: Category }, { model: ProductPriceTier, as: 'tiers' }],
    });
    res.status(201).json(full);
  } catch (err) { await t.rollback(); next(err); }
}

const updateProductSchema = z.object({
  name:       z.string().min(2).optional(),
  categoryId: z.number().int().optional().nullable(),
  stock:      z.number().int().nonnegative().optional(),
  tiers:      z.array(tierSchema).optional(),
});

export async function updateProduct(req: AuthedRequest, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const tenantId = req.auth!.tenantId;
    const id = Number(req.params.id);
    const data = updateProductSchema.parse(req.body);

    const product = await Product.findOne({ where: { id, tenant_id: tenantId }, transaction: t });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    await product.update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.categoryId !== undefined && { category_id: data.categoryId }),
      ...(data.stock !== undefined && { stock: data.stock }),
    }, { transaction: t });

    if (data.tiers !== undefined) {
      await ProductPriceTier.destroy({ where: { product_id: id }, transaction: t });
      for (const tier of data.tiers) {
        await ProductPriceTier.create({ product_id: id, ...tier }, { transaction: t });
      }
    }
    await t.commit();

    const full = await Product.findByPk(id, {
      include: [{ model: Category }, { model: ProductPriceTier, as: 'tiers' }],
    });
    res.json(full);
  } catch (err) { await t.rollback(); next(err); }
}

export async function deleteProduct(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const tenantId = req.auth!.tenantId;
    const id = Number(req.params.id);
    const product = await Product.findOne({ where: { id, tenant_id: tenantId } });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    await product.update({ active: false });
    emitToTenant(tenantId, 'activity', {
      message: `Se dio de baja el producto <strong>${escapeHtml(product.name)}</strong>`,
      at: new Date().toISOString(),
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

export async function listCategories(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const cats = await Category.findAll({
      where: { tenant_id: req.auth!.tenantId }, order: [['name','ASC']],
    });
    res.json(cats);
  } catch (err) { next(err); }
}

export async function createCategory(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const tenantId = req.auth!.tenantId;
    const { name } = z.object({ name: z.string().min(2) }).parse(req.body);
    const [cat] = await Category.findOrCreate({
      where: { tenant_id: tenantId, name },
      defaults: { tenant_id: tenantId, name },
    });
    res.status(201).json(cat);
  } catch (err) { next(err); }
}

const adjustSchema = z.object({
  quantity: z.number().int(),
  type: z.enum(['entrada','salida','ajuste']),
  reason: z.string().optional(),
});

export async function adjustStock(req: AuthedRequest, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const tenantId = req.auth!.tenantId;
    const id = Number(req.params.id);
    const data = adjustSchema.parse(req.body);

    const product = await Product.findOne({
      where: { id, tenant_id: tenantId },
      transaction: t, lock: t.LOCK.UPDATE,
    });
    if (!product) { await t.rollback(); return res.status(404).json({ error: 'Producto no encontrado' }); }

    const newStock = product.stock + data.quantity;
    if (newStock < 0) { await t.rollback(); return res.status(400).json({ error: 'El stock no puede quedar negativo' }); }

    await product.update({ stock: newStock }, { transaction: t });
    await StockMovement.create({
      tenant_id: tenantId, product_id: id,
      user_id: req.auth!.userId, type: data.type,
      quantity: data.quantity, reason: data.reason ?? null,
    }, { transaction: t });

    await t.commit();

    emitToTenant(tenantId, 'stock:updated', { productId: id, stock: newStock });
    emitToTenant(tenantId, 'activity', {
      message: `Stock de <strong>${escapeHtml(product.name)}</strong>: ${data.quantity > 0 ? '+' : ''}${data.quantity}`,
      at: new Date().toISOString(),
    });
    res.json(product);
  } catch (err) { await t.rollback(); next(err); }
}
