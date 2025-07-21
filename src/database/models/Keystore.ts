import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import User from './User';

@Table({
  tableName: 'keystores',
  timestamps: true,
})
export default class Keystore extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  accessTokenKey!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  refreshTokenKey!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive!: boolean;

  @BelongsTo(() => User)
  user!: User;
} 