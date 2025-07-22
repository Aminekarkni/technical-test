#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { Sequelize } from 'sequelize-typescript';

console.log('🧪 Setting up test environment...');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_jwt_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_NAME = 'milagro_test';
process.env.DB_USER = 'milagro_user';
process.env.DB_PASSWORD = 'milagro_password';
process.env.DB_DIALECT = 'mysql';

async function setupTestDatabase() {
  console.log('📊 Setting up test database...');
  
  try {
    // Create test database if it doesn't exist
    const rootSequelize = new Sequelize({
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'rootpassword',
      logging: false,
    });

    await rootSequelize.query('CREATE DATABASE IF NOT EXISTS milagro_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ Test database created/verified');
    
    await rootSequelize.close();
  } catch (error) {
    console.log('⚠️  Database setup warning:', error as Error  );
  }
}

async function runTests() {
  try {
    console.log('🚀 Running tests...');
    
    // Run Jest tests
    execSync('npx jest --verbose --detectOpenHandles --forceExit', {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test',
      }
    });
    
    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Tests failed:', error as Error);
    process.exit(1);
  }
}

async function main() {
  try {
    await setupTestDatabase();
    await runTests();
  } catch (error) {
    console.error('❌ Test setup failed:', error as Error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 