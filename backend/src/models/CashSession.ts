import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
export type CashSessionStatus = 'abierta'|'cerrada';
interface Attrs {
  id:number; tenant_id:number; opened_by:number; opening_amount:number; opened_at?:Date;
  closed_by:number|null; closing_amount:number|null; expected_amount:number|null;
  difference_amount:number|null; closed_at:Date|null; status:CashSessionStatus; notes:string|null;
}
type Creation = Optional<Attrs,'id'|'opened_at'|'closed_by'|'closing_amount'|'expected_amount'|'difference_amount'|'closed_at'|'status'|'notes'>;
export class CashSession extends Model<Attrs,Creation> implements Attrs {
  public id!:number; public tenant_id!:number; public opened_by!:number; public opening_amount!:number;
  public opened_at!:Date; public closed_by!:number|null; public closing_amount!:number|null;
  public expected_amount!:number|null; public difference_amount!:number|null;
  public closed_at!:Date|null; public status!:CashSessionStatus; public notes!:string|null;
}
CashSession.init({
  id:               {type:DataTypes.INTEGER,autoIncrement:true,primaryKey:true},
  tenant_id:        {type:DataTypes.INTEGER,allowNull:false},
  opened_by:        {type:DataTypes.INTEGER,allowNull:false},
  opening_amount:   {type:DataTypes.DECIMAL(12,2),allowNull:false,defaultValue:0},
  opened_at:        {type:DataTypes.DATE,defaultValue:DataTypes.NOW},
  closed_by:        {type:DataTypes.INTEGER,allowNull:true},
  closing_amount:   {type:DataTypes.DECIMAL(12,2),allowNull:true},
  expected_amount:  {type:DataTypes.DECIMAL(12,2),allowNull:true},
  difference_amount:{type:DataTypes.DECIMAL(12,2),allowNull:true},
  closed_at:        {type:DataTypes.DATE,allowNull:true},
  status:           {type:DataTypes.ENUM('abierta','cerrada'),allowNull:false,defaultValue:'abierta'},
  notes:            {type:DataTypes.STRING(255),allowNull:true},
},{sequelize,tableName:'cash_sessions'});
