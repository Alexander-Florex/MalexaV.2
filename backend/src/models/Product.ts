import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

interface ProductAttrs {
  id: number; tenant_id: number; category_id: number | null;
  name: string; stock: number; active: boolean; created_at?: Date;
}
type ProductCreation = Optional<ProductAttrs, 'id' | 'category_id' | 'stock' | 'active' | 'created_at'>;

export class Product extends Model<ProductAttrs, ProductCreation> implements ProductAttrs {
  public id!: number; public tenant_id!: number; public category_id!: number | null;
  public name!: string; public stock!: number; public active!: boolean; public created_at!: Date;
}
Product.init({
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  tenant_id:   { type: DataTypes.INTEGER, allowNull: false },
  category_id: { type: DataTypes.INTEGER, allowNull: true },
  name:        { type: DataTypes.STRING(150), allowNull: false },
  stock:       { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  active:      { type: DataTypes.BOOLEAN, defaultValue: true },
  created_at:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { sequelize, tableName: 'products' });
