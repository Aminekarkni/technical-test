import { Sequelize } from 'sequelize-typescript';

console.log('🔧 Creating Test Auction...');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'mysql',
  port: 3306,
  username: 'milagro_user',
  password: 'milagro_password',
  database: 'milagro',
  logging: false,
});

async function createTestAuction() {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected!');

    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

    console.log('📝 Creating test auction with end time in the past...');
    
    const [result] = await sequelize.query(`
      INSERT INTO products (
        name, description, type, startingPrice, currentHighestBid, 
        auctionEndTime, images, coverImage, categoryId, isRecommended, 
        isTopSeller, position, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, {
      replacements: [
        'Test Auction - Ended Yesterday',
        'This is a test auction that ended yesterday for testing purposes',
        'auction',
        100.00,
        150.00,
        pastDate,
        JSON.stringify(['test-auction-1.jpg']),
        'test-auction-1.jpg',
        6, // Collectibles category
        false,
        false,
        999,
        true
      ]
    });

    console.log('✅ Test auction created successfully!');
    console.log('📅 End time set to:', pastDate.toISOString());
    console.log('🎯 This auction should be processed when you run auction processing');

    const [auctions] = await sequelize.query('SELECT id, name, auctionEndTime, isActive FROM products WHERE type="auction" ORDER BY id DESC LIMIT 3') as any;
    console.log('\n📋 Recent auctions:');
    auctions.forEach((auction: any) => {
      console.log(`  - ID: ${auction.id} | ${auction.name} | Ends: ${auction.auctionEndTime} | Active: ${auction.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

createTestAuction(); 