import { connect } from '../database';
import { runProductionSeeds } from '../database/seeders/productionSeeder';
import Logger from '../core/Logger';

async function runSeeds() {
  try {
    Logger.info('🌱 Starting database seeding...');
    
    // Connect to database
    await connect();
    Logger.info('✅ Database connected');
    
    // Run production seeds
    await runProductionSeeds();
    Logger.info('✅ Production seeding completed');
    
    Logger.info('🎉 All seeds completed successfully!');
    process.exit(0);
  } catch (error) {
    Logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeeds(); 