import { seedBasicData } from './basicDataSeeder';
import { seedUsers } from './userSeeder';
import { seedProducts } from './productSeeder';
import { seedRolePermissions } from './rolePermissionSeeder';
import Logger from '../../core/Logger';

export async function runProductionSeeds() {
  try {
    Logger.info('🌱 Starting production seeding...');
    
    // Seed in order of dependencies
    Logger.info('1️⃣ Seeding basic data (roles, permissions, categories)...');
    await seedBasicData();
    
    Logger.info('2️⃣ Seeding role permissions...');
    await seedRolePermissions();
    
    Logger.info('3️⃣ Seeding users...');
    await seedUsers();
    
    Logger.info('4️⃣ Seeding products...');
    await seedProducts();
    
    Logger.info('🎉 Production seeding completed successfully!');
  } catch (error) {
    Logger.error('❌ Production seeding failed:', error);
    throw error;
  }
} 