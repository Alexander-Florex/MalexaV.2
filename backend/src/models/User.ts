import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

export type UserRole = 'admin' | 'employee';

interface UserAttrs {
  id: number;
  tenant_id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  active: boolean;
  created_at?: Date;
}
type UserCreation = Optional<UserAttrs, 'id' | 'active' | 'created_at'>;

export class User extends Model<UserAttrs, UserCreation> implements UserAttrs {
  public id!: number;
  public tenant_id!: number;
  public name!: string;
  public email!: string;
  public password_hash!: string;
  public role!: UserRole;
  public active!: boolean;
  public created_at!: Date;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'employee'), allowNull: false, defaultValue: 'employee' },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'users' }
);
