import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
interface PurchaseOrderItemAttrs {
  id: number; purchase_order_id: number; product_id: number;
  quantity: number; unit_cost: number; subtotal: number;
}
type Creation = Optional<PurchaseOrderItemAttrs,'id'>;
export class PurchaseOrderItem extends Model<PurchaseOrderItemAttrs,Creation> implements PurchaseOrderItemAttrs {
  public id!: number; public purchase_order_id!: number; public product_id!: number;
  public quantity!: number; public unit_cost!: number; public subtotal!: number;
}
PurchaseOrderItem.init({
  id:                { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  purchase_order_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id:        { type: DataTypes.INTEGER, allowNull: false },
  quantity:          { type: DataTypes.INTEGER, allowNull: false },
  unit_cost:         { type: DataTypes.DECIMAL(12,2), allowNull: false },
  subtotal:          { type: DataTypes.DECIMAL(12,2), allowNull: false },
}, { sequelize, tableName: 'purchase_order_items' });
