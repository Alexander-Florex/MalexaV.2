import { Tenant }            from './Tenant';
import { User }              from './User';
import { Category }          from './Category';
import { Product }           from './Product';
import { ProductPriceTier }  from './ProductPriceTier';
import { Sale }              from './Sale';
import { SaleItem }          from './SaleItem';
import { Expense }           from './Expense';
import { StockMovement }     from './StockMovement';
import { CashSession }       from './CashSession';
import { Supplier }          from './Supplier';
import { PurchaseOrder }     from './PurchaseOrder';
import { PurchaseOrderItem } from './PurchaseOrderItem';

Tenant.hasMany(User,     { foreignKey: 'tenant_id' });
User.belongsTo(Tenant,   { foreignKey: 'tenant_id' });
Tenant.hasMany(Category, { foreignKey: 'tenant_id' });
Category.belongsTo(Tenant, { foreignKey: 'tenant_id' });

Tenant.hasMany(Product,   { foreignKey: 'tenant_id' });
Product.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Category.hasMany(Product,  { foreignKey: 'category_id' });
Product.belongsTo(Category,{ foreignKey: 'category_id' });

Product.hasMany(ProductPriceTier, { foreignKey: 'product_id', as: 'tiers' });
ProductPriceTier.belongsTo(Product, { foreignKey: 'product_id' });

Tenant.hasMany(Sale,  { foreignKey: 'tenant_id' });
Sale.belongsTo(Tenant,{ foreignKey: 'tenant_id' });
User.hasMany(Sale,    { foreignKey: 'user_id' });
Sale.belongsTo(User,  { foreignKey: 'user_id' });
CashSession.hasMany(Sale,  { foreignKey: 'cash_session_id' });
Sale.belongsTo(CashSession,{ foreignKey: 'cash_session_id' });

Sale.hasMany(SaleItem,   { foreignKey: 'sale_id', as: 'items' });
SaleItem.belongsTo(Sale, { foreignKey: 'sale_id' });
Product.hasMany(SaleItem,   { foreignKey: 'product_id' });
SaleItem.belongsTo(Product, { foreignKey: 'product_id' });

Tenant.hasMany(Expense,   { foreignKey: 'tenant_id' });
Expense.belongsTo(Tenant, { foreignKey: 'tenant_id' });
User.hasMany(Expense,     { foreignKey: 'user_id' });
Expense.belongsTo(User,   { foreignKey: 'user_id' });
CashSession.hasMany(Expense,  { foreignKey: 'cash_session_id' });
Expense.belongsTo(CashSession,{ foreignKey: 'cash_session_id' });

Tenant.hasMany(StockMovement,   { foreignKey: 'tenant_id' });
StockMovement.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Product.hasMany(StockMovement,   { foreignKey: 'product_id' });
StockMovement.belongsTo(Product, { foreignKey: 'product_id' });
User.hasMany(StockMovement,    { foreignKey: 'user_id' });
StockMovement.belongsTo(User,  { foreignKey: 'user_id' });

Tenant.hasMany(CashSession,   { foreignKey: 'tenant_id' });
CashSession.belongsTo(Tenant, { foreignKey: 'tenant_id' });
User.hasMany(CashSession, { foreignKey: 'opened_by' });
CashSession.belongsTo(User, { foreignKey: 'opened_by', as: 'OpenedBy' });
CashSession.belongsTo(User, { foreignKey: 'closed_by', as: 'ClosedBy' });

Tenant.hasMany(Supplier,   { foreignKey: 'tenant_id' });
Supplier.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Supplier.hasMany(PurchaseOrder,   { foreignKey: 'supplier_id' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id' });
Tenant.hasMany(PurchaseOrder,   { foreignKey: 'tenant_id' });
PurchaseOrder.belongsTo(Tenant, { foreignKey: 'tenant_id' });
User.hasMany(PurchaseOrder,     { foreignKey: 'user_id' });
PurchaseOrder.belongsTo(User,   { foreignKey: 'user_id' });

PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchase_order_id', as: 'items' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id' });
Product.hasMany(PurchaseOrderItem,   { foreignKey: 'product_id' });
PurchaseOrderItem.belongsTo(Product, { foreignKey: 'product_id' });

export {
  Tenant, User, Category, Product, ProductPriceTier,
  Sale, SaleItem, Expense, StockMovement,
  CashSession, Supplier, PurchaseOrder, PurchaseOrderItem,
};
