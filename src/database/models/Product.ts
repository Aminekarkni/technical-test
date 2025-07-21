import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import Category from './Category';
import OrderItem from './OrderItem';
import Bid from './Bid';

export enum ProductType {
  FIXED_PRICE = 'fixed_price',
  AUCTION = 'auction',
}

@Table({
  tableName: 'products',
  timestamps: true,
  paranoid: true,
})
export default class Product extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description!: string;

  @Column({
    type: DataType.ENUM(...Object.values(ProductType)),
    allowNull: false,
  })
  type!: ProductType;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  price!: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  stockQuantity!: number | null;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  startingPrice!: number | null;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  currentHighestBid!: number | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  auctionEndTime!: Date | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  images!: string[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  coverImage!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isRecommended!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isTopSeller!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  position!: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive!: boolean;

  @ForeignKey(() => Category)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  categoryId!: number;

  @BelongsTo(() => Category)
  category!: Category;

  @HasMany(() => OrderItem)
  orderItems!: OrderItem[];

  @HasMany(() => Bid)
  bids!: Bid[];

  get isAuction(): boolean {
    return this.type === ProductType.AUCTION;
  }

  get isFixedPrice(): boolean {
    return this.type === ProductType.FIXED_PRICE;
  }

  get isAuctionActive(): boolean {
    if (!this.isAuction || !this.auctionEndTime) return false;
    return new Date() < this.auctionEndTime;
  }

  get isAuctionEnded(): boolean {
    if (!this.isAuction || !this.auctionEndTime) return false;
    return new Date() >= this.auctionEndTime;
  }
} 