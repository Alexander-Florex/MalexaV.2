import bcrypt from 'bcryptjs';
import { sequelize } from './config/db';
import { Tenant, User, Category, Product, ProductPriceTier, Supplier } from './models';

async function seed() {
  await sequelize.authenticate();
  console.log('Conectado. Sembrando datos demo...');

  let tenant = await Tenant.findOne({ where: { slug: 'boutique-luna' } });
  if (!tenant) tenant = await Tenant.create({ name: 'Boutique Luna', slug: 'boutique-luna', plan: 'pro' });

  const hash = await bcrypt.hash('percha123', 10);
  const users = [
    { name: 'Valentina', email: 'valentina@boutiqueluna.com', role: 'admin' as const },
    { name: 'Sofia',     email: 'sofia@boutiqueluna.com',     role: 'employee' as const },
    { name: 'Mateo',     email: 'mateo@boutiqueluna.com',     role: 'employee' as const },
  ];
  for (const u of users) {
    if (!await User.findOne({ where: { email: u.email } }))
      await User.create({ tenant_id: tenant.id, ...u, password_hash: hash });
  }

  const catNames = ['Indumentaria', 'Lencería', 'Ropa de bebé', 'Accesorios'];
  const cats: Record<string, Category> = {};
  for (const name of catNames) {
    let c = await Category.findOne({ where: { tenant_id: tenant.id, name } });
    if (!c) c = await Category.create({ tenant_id: tenant.id, name });
    cats[name] = c;
  }

  // Productos con tiers demo
  const productsData = [
    {
      name: 'Pantalón palazzo', cat: 'Indumentaria', stock: 24,
      tiers: [
        { type: 'minorista', quantity: 1, price: 15000 },
        { type: 'minorista', quantity: 2, price: 20000 },
        { type: 'minorista', quantity: 3, price: 30000 },
        { type: 'mayorista', quantity: 3, price: 24000 },
        { type: 'mayorista', quantity: 6, price: 44000 },
      ],
    },
    {
      name: 'Remera básica', cat: 'Indumentaria', stock: 40,
      tiers: [
        { type: 'minorista', quantity: 1, price: 8500 },
        { type: 'minorista', quantity: 3, price: 22000 },
        { type: 'mayorista', quantity: 6, price: 38000 },
      ],
    },
    {
      name: 'Conjunto encaje', cat: 'Lencería', stock: 8,
      tiers: [
        { type: 'minorista', quantity: 1, price: 14300 },
        { type: 'mayorista', quantity: 3, price: 36000 },
      ],
    },
    {
      name: 'Body bebé', cat: 'Ropa de bebé', stock: 30,
      tiers: [
        { type: 'minorista', quantity: 1, price: 6200 },
        { type: 'minorista', quantity: 2, price: 10000 },
        { type: 'mayorista', quantity: 6, price: 28000 },
      ],
    },
    {
      name: 'Buzo oversize', cat: 'Indumentaria', stock: 0,
      tiers: [
        { type: 'minorista', quantity: 1, price: 17900 },
        { type: 'mayorista', quantity: 3, price: 45000 },
      ],
    },
  ];

  for (const p of productsData) {
    let prod = await Product.findOne({ where: { tenant_id: tenant.id, name: p.name } });
    if (!prod) {
      prod = await Product.create({
        tenant_id: tenant.id, category_id: cats[p.cat].id, name: p.name, stock: p.stock,
      });
      for (const tier of p.tiers) {
        await ProductPriceTier.create({
          product_id: prod.id,
          type: tier.type as 'minorista'|'mayorista',
          quantity: tier.quantity,
          price: tier.price,
        });
      }
    }
  }

  const supData = [
    { name: 'Textiles del Sur', contact_name: 'Roberto Díaz', phone: '11-4555-2233' },
    { name: 'Importadora Luna', contact_name: 'Carla Funes',  phone: '11-3344-1122' },
  ];
  for (const s of supData) {
    if (!await Supplier.findOne({ where: { tenant_id: tenant.id, name: s.name } }))
      await Supplier.create({ tenant_id: tenant.id, ...s });
  }

  console.log('✅ Demo listo. Password: percha123');
  console.log('   Admin: valentina@boutiqueluna.com');
  console.log('   Empleados: sofia | mateo @boutiqueluna.com');
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });
