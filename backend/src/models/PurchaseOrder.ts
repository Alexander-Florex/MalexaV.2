import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
export type PurchaseOrderStatus = 'pendiente'|'recibida'|'cancelada';
interface Attrs { id:number; tenant_id:number; supplier_id:number; user_id:number; status:PurchaseOrderStatus; total:number; created_at?:Date; received_at:Date|null; }
type Creation = Optional<Attrs,'id'|'status'|'total'|'created_at'|'received_at'>;
export class PurchaseOrder extends Model<Attrs,Creation> implements Attrs {
  public id!:number; public tenant_id!:number; public supplier_id!:number; public user_id!:number;
  public status!:PurchaseOrderStatus; public total!:number; public created_at!:Date; public received_at!:Date|null;
}
PurchaseOrder.init({
  id:{type:DataTypes.INTEGER,autoIncrement:true,primaryKey:true},
  tenant_id:{type:DataTypes.INTEGER,allowNull:false},
  supplier_id:{type:DataTypes.INTEGER,allowNull:false},
  user_id:{type:DataTypes.INTEGER,allowNull:false},
  status:{type:DataTypes.ENUM('pendiente','recibida','cancelada'),allowNull:false,defaultValue:'pendiente'},
  total:{type:DataTypes.DECIMAL(12,2),allowNull:false,defaultValue:0},
  created_at:{type:DataTypes.DATE,defaultValue:DataTypes.NOW},
  received_at:{type:DataTypes.DATE,allowNull:true},
},{sequelize,tableName:'purchase_orders'});
