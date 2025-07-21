import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import User from './User';

export enum NotificationType {
  ORDER_STATUS = 'ORDER_STATUS',
  PAYMENT = 'PAYMENT',
  PROMOTION = 'PROMOTION',
  SYSTEM = 'SYSTEM',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

@Table({
  tableName: 'notifications',
  timestamps: true,
  paranoid: true,
})
export default class Notification extends Model {
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
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  body!: string;

  @Column({
    type: DataType.ENUM(...Object.values(NotificationType)),
    allowNull: false,
  })
  type!: NotificationType;

  @Column({
    type: DataType.ENUM(...Object.values(NotificationStatus)),
    allowNull: false,
    defaultValue: NotificationStatus.PENDING,
  })
  status!: NotificationStatus;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  data!: {
    orderId?: number;
    paymentId?: string;
    redirectUrl?: string;
    [key: string]: any;
  };

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  fcmToken!: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  fcmMessageId!: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  errorMessage!: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  sentAt!: Date | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isRead!: boolean;

  @BelongsTo(() => User)
  user!: User;
} 