import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
export type PaymentMethod = 'efectivo'|'debito'|'credito'|'transferencia'|'mercadopago'|'otro';
export type SaleChannel = 'local'|'live';

interface SaleAttrs {
  id: number; tenant_id: number; user_id: number; cash_session_id: number|null;
  channel: SaleChannel; payment_method: PaymentMethod;
  buyer_name: string|null; buyer_contact: string|null;
  total: number; created_at?: Date;
}
type SaleCreation = Optional<SaleAttrs,'id'|'cash_session_id'|'channel'|'payment_method'|'buyer_name'|'buyer_contact'|'total'|'created_at'>;

export class Sale extends Model<SaleAttrs, SaleCreation> implements SaleAttrs {
  public id!: number; public tenant_id!: number; public user_id!: number;
  public cash_session_id!: number|null; public channel!: SaleChannel;
  public payment_method!: PaymentMethod; public buyer_name!: string|null;
  public buyer_contact!: string|null; public total!: number; public created_at!: Date;
}
Sale.init({
  id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  tenant_id:       { type: DataTypes.INTEGER, allowNull: false },
  user_id:         { type: DataTypes.INTEGER, allowNull: false },
  cash_session_id: { type: DataTypes.INTEGER, allowNull: true },
  channel:         { type: DataTypes.ENUM('local','live'), allowNull: false, defaultValue: 'local' },
  payment_method:  { type: DataTypes.ENUM('efectivo','debito','credito','transferencia','mercadopago','otro'), allowNull: false, defaultValue: 'efectivo' },
  buyer_name:      { type: DataTypes.STRING(120), allowNull: true },
  buyer_contact:   { type: DataTypes.STRING(120), allowNull: true },
  total:           { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
  created_at:      { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { sequelize, tableName: 'sales' });
