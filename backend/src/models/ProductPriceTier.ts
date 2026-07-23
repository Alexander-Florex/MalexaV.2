import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

export type PriceType = 'minorista' | 'mayorista';

interface ProductPriceTierAttrs {
  id: number; product_id: number; type: PriceType; quantity: number; price: number;
}
type Creation = Optional<ProductPriceTierAttrs, 'id'>;

export class ProductPriceTier extends Model<ProductPriceTierAttrs, Creation> implements ProductPriceTierAttrs {
  public id!: number; public product_id!: number; public type!: PriceType;
  public quantity!: number; public price!: number;
}
ProductPriceTier.init({
  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  type:       { type: DataTypes.ENUM('minorista','mayorista'), allowNull: false },
  quantity:   { type: DataTypes.INTEGER, allowNull: false },
  price:      { type: DataTypes.DECIMAL(12,2), allowNull: false },
}, { sequelize, tableName: 'product_price_tiers' });
