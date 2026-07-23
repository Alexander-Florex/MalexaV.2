import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
export type StockMovementType = 'entrada'|'salida'|'ajuste'|'venta'|'compra';

interface StockMovementAttrs {
  id: number; tenant_id: number; product_id: number; user_id: number;
  type: StockMovementType; quantity: number; reason: string|null; created_at?: Date;
}
type Creation = Optional<StockMovementAttrs,'id'|'reason'|'created_at'>;

export class StockMovement extends Model<StockMovementAttrs,Creation> implements StockMovementAttrs {
  public id!: number; public tenant_id!: number; public product_id!: number;
  public user_id!: number; public type!: StockMovementType;
  public quantity!: number; public reason!: string|null; public created_at!: Date;
}
StockMovement.init({
  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  tenant_id:  { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id:    { type: DataTypes.INTEGER, allowNull: false },
  type:       { type: DataTypes.ENUM('entrada','salida','ajuste','venta','compra'), allowNull: false },
  quantity:   { type: DataTypes.INTEGER, allowNull: false },
  reason:     { type: DataTypes.STRING(255), allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { sequelize, tableName: 'stock_movements' });
