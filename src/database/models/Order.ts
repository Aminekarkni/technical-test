import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import User from './User';
import OrderItem from './OrderItem';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum PaymentStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum OrderType {
  FIXED_PRICE = 'fixed_price',
  AUCTION = 'auction',
}

@Table({
  tableName: 'orders',
  timestamps: true,
  paranoid: true,
})
export default class Order extends Model {
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
  orderNumber!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId!: number;

  @Column({
    type: DataType.ENUM(...Object.values(OrderStatus)),
    allowNull: false,
    defaultValue: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentStatus)),
    allowNull: false,
    defaultValue: PaymentStatus.PENDING_PAYMENT,
  })
  paymentStatus!: PaymentStatus;

  @Column({
    type: DataType.ENUM(...Object.values(OrderType)),
    allowNull: false,
  })
  orderType!: OrderType;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  subtotal!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  taxAmount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  shippingAmount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  totalAmount!: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  shippingAddress!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  billingAddress!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  trackingNumber!: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  shippedAt!: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deliveredAt!: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  cancelledAt!: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  reservationDate!: Date | null;

  // MyFatoorah payment fields
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  invoiceId!: number | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  invoiceUrl!: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  paymentMethod!: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  paymentId!: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  paymentData!: any;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  note!: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  giftMsg!: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  firstName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  lastName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  phoneNumber!: string;

  @BelongsTo(() => User)
  user!: User;

  @HasMany(() => OrderItem)
  items!: OrderItem[];

  get isPaid(): boolean {
    return this.paymentStatus === PaymentStatus.PAID;
  }

  get isPending(): boolean {
    return this.status === OrderStatus.PENDING;
  }

  get isConfirmed(): boolean {
    return this.status === OrderStatus.CONFIRMED;
  }

  get isProcessing(): boolean {
    return this.status === OrderStatus.PROCESSING;
  }

  get isShipped(): boolean {
    return this.status === OrderStatus.SHIPPED;
  }

  get isDelivered(): boolean {
    return this.status === OrderStatus.DELIVERED;
  }

  get isCancelled(): boolean {
    return this.status === OrderStatus.CANCELLED;
  }

  get isFixedPriceOrder(): boolean {
    return this.orderType === OrderType.FIXED_PRICE;
  }

  get isAuctionOrder(): boolean {
    return this.orderType === OrderType.AUCTION;
  }
} 