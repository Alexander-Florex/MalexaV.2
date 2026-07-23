import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
interface Attrs { id:number; tenant_id:number; name:string; contact_name:string|null; phone:string|null; email:string|null; notes:string|null; active:boolean; created_at?:Date; }
type Creation = Optional<Attrs,'id'|'contact_name'|'phone'|'email'|'notes'|'active'|'created_at'>;
export class Supplier extends Model<Attrs,Creation> implements Attrs {
  public id!:number; public tenant_id!:number; public name!:string;
  public contact_name!:string|null; public phone!:string|null; public email!:string|null;
  public notes!:string|null; public active!:boolean; public created_at!:Date;
}
Supplier.init({
  id:{type:DataTypes.INTEGER,autoIncrement:true,primaryKey:true},
  tenant_id:{type:DataTypes.INTEGER,allowNull:false},
  name:{type:DataTypes.STRING(150),allowNull:false},
  contact_name:{type:DataTypes.STRING(120),allowNull:true},
  phone:{type:DataTypes.STRING(40),allowNull:true},
  email:{type:DataTypes.STRING(150),allowNull:true},
  notes:{type:DataTypes.STRING(255),allowNull:true},
  active:{type:DataTypes.BOOLEAN,defaultValue:true},
  created_at:{type:DataTypes.DATE,defaultValue:DataTypes.NOW},
},{sequelize,tableName:'suppliers'});
