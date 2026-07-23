import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { sequelize } from '../config/db';
import { AuthedRequest } from '../middleware/auth';
import { Sale, SaleItem, Product, ProductPriceTier, StockMovement, User, CashSession } from '../models';
import { emitToTenant } from '../sockets/socket';
import { escapeHtml } from '../utils/html';

/**
 * Recalcula el subtotal esperado para una cantidad/tipo de precio dados,
 * usando la misma lógica de "mejor tier" que el POS (frontend). Sirve para
 * validar que el subtotal que manda el cliente coincide con la lista de
 * precios real guardada en el servidor, y así evitar que una venta se
 * registre con un monto manipulado o desactualizado.
 */
function calcExpectedSubtotal(tiers: ProductPriceTier[], priceType: string, qty: number): number {
  const relevant = tiers.filter((t) => t.type === priceType).sort((a, b) => b.quantity - a.quantity);
  const best = relevant.find((t) => t.quantity <= qty);
  if (!best) return 0;
  const blocks = Math.floor(qty / best.quantity);
  const remainder = qty % best.quantity;
  const unit1 = relevant.find((t) => t.quantity === 1);
  return blocks * Number(best.price) + remainder * (unit1 ? Number(unit1.price) : 0);
}

const itemSchema = z.object({
  productId: z.number().int(),
  quantity:  z.number().int().positive(),
  priceType: z.enum(['minorista','mayorista']).default('minorista'),
  subtotal:  z.number().nonnegative(), // total enviado desde el POS (del tier seleccionado)
});

const createSaleSchema = z.object({
  channel:       z.enum(['local','live']).default('local'),
  paymentMethod: z.enum(['efectivo','mercadopago','debito']).default('efectivo'),
  buyerName:     z.string().optional(),    // solo para live
  buyerContact:  z.string().optional(),    // solo para live (IG, WhatsApp)
  items:         z.array(itemSchema).min(1),
});

export async function createSale(req: AuthedRequest, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const tenantId = req.auth!.tenantId;
    const userId   = req.auth!.userId;
    const body = createSaleSchema.parse(req.body);

    const openSession = await CashSession.findOne({
      where: { tenant_id: tenantId, status: 'abierta' }, transaction: t,
    });

    let total = 0;
    const resolved: { product: Product; quantity: number; priceType: 'minorista'|'mayorista'; subtotal: number }[] = [];

    for (const item of body.items) {
      const product = await Product.findOne({
        where: { id: item.productId, tenant_id: tenantId },
        transaction: t, lock: t.LOCK.UPDATE,
      });
      if (!product) throw Object.assign(new Error(`Producto ${item.productId} no encontrado`), { status: 404 });
      if (product.stock < item.quantity) {
        throw Object.assign(
          new Error(`Stock insuficiente de "${product.name}" (disponible: ${product.stock})`),
          { status: 400 }
        );
      }

      const tiers = await ProductPriceTier.findAll({ where: { product_id: product.id }, transaction: t });
      const expected = calcExpectedSubtotal(tiers, item.priceType, item.quantity);
      if (Math.abs(expected - item.subtotal) > 0.5) {
        throw Object.assign(
          new Error(`El precio de "${product.name}" no coincide con la lista de precios actual. Actualizá la pantalla e intentá de nuevo.`),
          { status: 400 }
        );
      }

      total += item.subtotal;
      resolved.push({ product, quantity: item.quantity, priceType: item.priceType, subtotal: item.subtotal });
    }

    const sale = await Sale.create({
      tenant_id:       tenantId,
      user_id:         userId,
      channel:         body.channel,
      payment_method:  body.paymentMethod,
      buyer_name:      body.buyerName ?? null,
      buyer_contact:   body.buyerContact ?? null,
      total,
      cash_session_id: openSession?.id ?? null,
    }, { transaction: t });

    for (const r of resolved) {
      const unitPrice = r.quantity > 0 ? r.subtotal / r.quantity : 0;
      await SaleItem.create({
        sale_id:    sale.id,
        product_id: r.product.id,
        quantity:   r.quantity,
        price_type: r.priceType,
        unit_price: unitPrice,
        subtotal:   r.subtotal,
      }, { transaction: t });

      await r.product.update({ stock: r.product.stock - r.quantity }, { transaction: t });
      await StockMovement.create({
        tenant_id: tenantId, product_id: r.product.id, user_id: userId,
        type: 'venta', quantity: -r.quantity, reason: `Venta #${sale.id}`,
      }, { transaction: t });
    }

    await t.commit();

    const seller = await User.findByPk(userId);
    const canalLabel = body.channel === 'live' ? '📱 Live' : '🏪 Local';
    emitToTenant(tenantId, 'activity', {
      message: `${canalLabel} <strong>${escapeHtml(seller?.name)}</strong> registró venta de <strong>$${total.toLocaleString('es-AR')}</strong>`,
      at: new Date().toISOString(),
    });
    emitToTenant(tenantId, 'sale:created', { id: sale.id, total, channel: body.channel, sellerName: seller?.name });
    resolved.forEach((r) => {
      emitToTenant(tenantId, 'stock:updated', { productId: r.product.id, stock: r.product.stock - r.quantity });
    });

    res.status(201).json({ id: sale.id, total, channel: body.channel });
  } catch (err) { await t.rollback(); next(err); }
}

export async function listSales(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const tenantId = req.auth!.tenantId;
    const { channel } = req.query;
    const where: Record<string,unknown> = { tenant_id: tenantId };
    if (channel === 'local' || channel === 'live') where.channel = channel;

    const sales = await Sale.findAll({
      where,
      include: [
        { model: User, attributes: ['id','name'] },
        { model: SaleItem, as: 'items', attributes: ['id','quantity','price_type','subtotal'] },
      ],
      order: [['created_at','DESC']],
      limit: 200,
    });
    res.json(sales);
  } catch (err) { next(err); }
}

export async function getSale(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const tenantId = req.auth!.tenantId;
    const id = Number(req.params.id);
    const sale = await Sale.findOne({
      where: { id, tenant_id: tenantId },
      include: [
        { model: User, attributes: ['id','name'] },
        {
          model: SaleItem, as: 'items',
          include: [{ model: Product, attributes: ['id','name'] }],
        },
      ],
    });
    if (!sale) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json(sale);
  } catch (err) { next(err); }
}
