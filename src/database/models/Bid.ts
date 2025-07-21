import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import User from './User';
import Product from './Product';

@Table({
  tableName: 'bids',
  timestamps: true,
})
export default class Bid extends Model {
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

  @ForeignKey(() => Product)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  productId!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  bidAmount!: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isWinningBid!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  note!: string | null;

  @BelongsTo(() => User)
  user!: User;

  @BelongsTo(() => Product)
  product!: Product;
} 