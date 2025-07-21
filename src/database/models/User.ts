import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  BelongsToMany,
  BeforeCreate,
  BeforeUpdate,
  Scopes,
} from 'sequelize-typescript';
import bcrypt from 'bcryptjs';
import Role from './Role';
import UserRole from './UserRole';
import Order from './Order';
import Notification from './Notification';
import Bid from './Bid';

@Table({
  tableName: 'users',
  timestamps: true,
  paranoid: true,
})
@Scopes(() => ({
  withoutPassword: {
    attributes: { exclude: ['password', 'registerConfirmationCode', 'forgetConfirmationCode'] },
  },
}))
export default class User extends Model {
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
  firstName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  lastName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  })
  email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  phoneNumber!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: 'public/avatar-default-icon.png',
  })
  avatar!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  password!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  verified!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  emailIsVerified!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  registerConfirmationCode!: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  forgetConfirmationCode!: number | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lastLogin!: Date | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    defaultValue: [],
  })
  fcmTokens!: string[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  googleId!: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  googleAccessToken!: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  googleRefreshToken!: string | null;

  @BelongsToMany(() => Role, () => UserRole)
  roles!: Role[];

  @HasMany(() => Order)
  orders!: Order[];

  @HasMany(() => Notification)
  notifications!: Notification[];

  @HasMany(() => Bid)
  bids!: Bid[];

  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: User) {
    if (instance.changed('password') && instance.password) {
      instance.password = await bcrypt.hash(instance.password, 12);
    }
    if (instance.changed('email')) {
      instance.email = instance.email.toLowerCase();
    }
  }

  async comparePassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
  }

  async addFcmToken(token: string): Promise<void> {
    const tokens = this.fcmTokens || [];
    if (!tokens.includes(token)) {
      tokens.push(token);
      this.fcmTokens = tokens;
      await this.save();
    }
  }

  async removeFcmToken(token: string): Promise<void> {
    const tokens = this.fcmTokens || [];
    this.fcmTokens = tokens.filter(t => t !== token);
    await this.save();
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get hasGoogleAccount(): boolean {
    return !!this.googleId;
  }
} 