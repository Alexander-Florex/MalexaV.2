import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

interface CategoryAttrs {
  id: number;
  tenant_id: number;
  name: string;
}
type CategoryCreation = Optional<CategoryAttrs, 'id'>;

export class Category extends Model<CategoryAttrs, CategoryCreation> implements CategoryAttrs {
  public id!: number;
  public tenant_id!: number;
  public name!: string;
}

Category.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(80), allowNull: false },
  },
  { sequelize, tableName: 'categories' }
);
