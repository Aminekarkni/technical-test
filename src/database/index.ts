import { Sequelize } from 'sequelize-typescript';
import Logger from '../core/Logger';
import { db, environment } from '../configVars';

// Import all models
import User from './models/User';
import Role from './models/Role';
import Permission from './models/Permission';
import Keystore from './models/Keystore';
import Product from './models/Product';
import Category from './models/Category';
import Order from './models/Order';
import OrderItem from './models/OrderItem';
import Notification from './models/Notification';
import Bid from './models/Bid';

// Import junction tables
import UserRole from './models/UserRole';
import RolePermission from './models/RolePermission';

// Create Sequelize instance based on environment
const sequelize = new Sequelize({
  dialect: db.dialect as any,
  host: db.host,
  port: db.port,
  database: db.name,
  username: db.user,
  password: db.password,
  logging: environment === 'development' ? console.log : false,
  pool: db.pool,
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

// Test the connection
export async function connect() {
  try {
    await sequelize.authenticate();
    Logger.info('MySQL connection has been established successfully 👍');
    
    // Sync database (create tables if they don't exist)
    if (environment === 'development') {
      await sequelize.sync({ alter: true });
      Logger.info('Database synchronized');
    }
    
    // Run production seeds on startup
    if (environment === 'production' || environment === 'development') {
      try {
        const { runProductionSeeds } = await import('./seeders/productionSeeder');
        await runProductionSeeds();
      } catch (seedError) {
        Logger.warn('Production seeding failed, continuing without seeds:', seedError);
      }
    }
  } catch (error) {
    Logger.error('Unable to connect to the database:', error);
    throw error;
  }
}

// Only connect if not in test mode
if (environment !== 'test') {
  connect();
}

// Export sequelize instance for use in repositories
export { sequelize };

// Export models for direct access if needed
export {
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
};
