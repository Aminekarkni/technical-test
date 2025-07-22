import { Sequelize } from 'sequelize-typescript';

// Override environment for testing
process.env.NODE_ENV = 'test';

// Set required environment variables for testing
process.env.JWT_ACCESS_SECRET = 'test_jwt_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret';

// Set database configuration for testing
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_NAME = 'milagro_test';
process.env.DB_USER = 'milagro_user';
process.env.DB_PASSWORD = 'milagro_password';
process.env.DB_DIALECT = 'mysql';

// Import models
import User from '../database/models/User';
import Role from '../database/models/Role';
import Permission from '../database/models/Permission';
import Keystore from '../database/models/Keystore';
import Product from '../database/models/Product';
import Category from '../database/models/Category';
import Order from '../database/models/Order';
import OrderItem from '../database/models/OrderItem';
import Notification from '../database/models/Notification';
import Bid from '../database/models/Bid';
import UserRole from '../database/models/UserRole';
import RolePermission from '../database/models/RolePermission';

// Create test sequelize instance
const testSequelize = new Sequelize({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'milagro_test',
  username: 'milagro_user',
  password: 'milagro_password',
  logging: false,
  models: [
    User,
    Role,
    Permission,
    Keystore,
    Product,
    Category,
    Order,
    OrderItem,
    Notification,
    Bid,
    UserRole,
    RolePermission,
  ],
});

beforeAll(async () => {
  // Create test database if it doesn't exist
  const rootSequelize = new Sequelize({
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'rootpassword',
    logging: false,
  });

  try {
    await rootSequelize.query('CREATE DATABASE IF NOT EXISTS milagro_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  } catch (error) {
    console.log('Database already exists or connection failed');
  } finally {
    await rootSequelize.close();
  }

  // Test the connection
  await testSequelize.authenticate();
  console.log('Test database connection established');

  // Sync all models to create tables
  await testSequelize.sync({ force: true });
  console.log('Test database tables created');
}, 30000);

afterAll(async () => {
  await testSequelize.close();
}, 10000);

afterEach(async () => {
  // Simple approach: just delete all data from main tables
  try {
    await testSequelize.query('DELETE FROM user_roles');
    await testSequelize.query('DELETE FROM role_permissions');
    await testSequelize.query('DELETE FROM keystores');
    await testSequelize.query('DELETE FROM bids');
    await testSequelize.query('DELETE FROM order_items');
    await testSequelize.query('DELETE FROM orders');
    await testSequelize.query('DELETE FROM notifications');
    await testSequelize.query('DELETE FROM products');
    await testSequelize.query('DELETE FROM categories');
    await testSequelize.query('DELETE FROM users');
    await testSequelize.query('DELETE FROM roles');
    await testSequelize.query('DELETE FROM permissions');
  } catch (error: any) {
    console.log('Error clearing test data:', error?.message || 'Unknown error');
  }
}, 10000);

// Export for use in tests
export { testSequelize }; 