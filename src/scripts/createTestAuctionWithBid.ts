import { Sequelize } from 'sequelize-typescript';

console.log('🔧 Creating Test Auction with Winning Bid...');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'mysql',
  port: 3306,
  username: 'milagro_user',
  password: 'milagro_password',
  database: 'milagro',
  logging: false,
});

async function createTestAuctionWithBid() {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected!');

    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

    console.log('📝 Creating test auction with end time in the past...');
    
    const [auctionResult] = await sequelize.query(`
      INSERT INTO products (
        name, description, type, startingPrice, currentHighestBid, 
        auctionEndTime, images, coverImage, categoryId, isRecommended, 
        isTopSeller, position, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, {
      replacements: [
        'Test Auction with Winner',
        'This is a test auction that ended yesterday and has a winning bid',
        'auction',
        100.00,
        250.00,
        pastDate,
        JSON.stringify(['test-auction-winner-1.jpg']),
        'test-auction-winner-1.jpg',
        6, // Collectibles category
        false,
        false,
        998,
        true
      ]
    }) as any;

    const auctionId = auctionResult.insertId;
    console.log(`✅ Test auction created with ID: ${auctionId}`);

    if (auctionId) {
      console.log('📝 Creating winning bid...');
      
      const [bidResult] = await sequelize.query(`
        INSERT INTO bids (
          userId, productId, bidAmount, isWinningBid, note, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          1, // Test User ID
          auctionId,
          250.00,
          true,
          'Winning bid for test auction'
        ]
      }) as any;

      console.log(`✅ Winning bid created with ID: ${bidResult.insertId}`);
      console.log(`📅 Auction end time: ${pastDate.toISOString()}`);
      console.log(`💰 Winning bid amount: $250.00`);
      console.log(`👤 Winner: Test User (ID: 1)`);

      console.log('\n🎯 This auction should now be processed and create an order!');
      console.log('📋 Run the auction processing test to see the complete flow.');
    } else {
      console.log('❌ Failed to create auction - no ID returned');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

createTestAuctionWithBid(); 