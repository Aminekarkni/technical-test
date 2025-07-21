import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import Role from './Role';
import Permission from './Permission';

@Table({
  tableName: 'role_permissions',
  timestamps: true,
})
export default class RolePermission extends Model {
  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  roleId!: number;

  @ForeignKey(() => Permission)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  permissionId!: number;
} 