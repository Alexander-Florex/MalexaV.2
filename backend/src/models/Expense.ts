import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

interface ExpenseAttrs {
  id: number;
  tenant_id: number;
  user_id: number;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string;
  created_at?: Date;
}
type ExpenseCreation = Optional<ExpenseAttrs, 'id' | 'description' | 'created_at'>;

export class Expense extends Model<ExpenseAttrs, ExpenseCreation> implements ExpenseAttrs {
  public id!: number;
  public tenant_id!: number;
  public user_id!: number;
  public category!: string;
  public description!: string | null;
  public amount!: number;
  public expense_date!: string;
  public created_at!: Date;
}

Expense.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.STRING(60), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    expense_date: { type: DataTypes.DATEONLY, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'expenses' }
);
