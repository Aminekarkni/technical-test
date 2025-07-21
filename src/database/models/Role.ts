import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import User from './User';
import UserRole from './UserRole';
import Permission from './Permission';
import RolePermission from './RolePermission';

@Table({
  tableName: 'roles',
  timestamps: true,
  paranoid: true,
})
export default class Role extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  code!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive!: boolean;

  @BelongsToMany(() => User, () => UserRole)
  users!: User[];

  @BelongsToMany(() => Permission, () => RolePermission)
  permissions!: Permission[];
} 