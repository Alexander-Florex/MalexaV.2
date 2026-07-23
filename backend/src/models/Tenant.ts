import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

interface TenantAttrs {
  id: number;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'premium';
  created_at?: Date;
}
type TenantCreation = Optional<TenantAttrs, 'id' | 'plan' | 'created_at'>;

export class Tenant extends Model<TenantAttrs, TenantCreation> implements TenantAttrs {
  public id!: number;
  public name!: string;
  public slug!: string;
  public plan!: 'free' | 'pro' | 'premium';
  public created_at!: Date;
}

Tenant.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    plan: { type: DataTypes.ENUM('free', 'pro', 'premium'), defaultValue: 'free' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'tenants' }
);
