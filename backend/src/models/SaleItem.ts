import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
export type PriceType = 'minorista' | 'mayorista';

interface SaleItemAttrs {
  id: number; sale_id: number; product_id: number;
  quantity: number; price_type: PriceType; unit_price: number; subtotal: number;
}
type SaleItemCreation = Optional<SaleItemAttrs, 'id' | 'price_type'>;

export class SaleItem extends Model<SaleItemAttrs, SaleItemCreation> implements SaleItemAttrs {
  public id!: number; public sale_id!: number; public product_id!: number;
  public quantity!: number; public price_type!: PriceType;
  public unit_price!: number; public subtotal!: number;
}
SaleItem.init({
  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  sale_id:    { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity:   { type: DataTypes.INTEGER, allowNull: false },
  price_type: { type: DataTypes.ENUM('minorista','mayorista'), allowNull: false, defaultValue: 'minorista' },
  unit_price: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  subtotal:   { type: DataTypes.DECIMAL(12,2), allowNull: false },
}, { sequelize, tableName: 'sale_items' });
