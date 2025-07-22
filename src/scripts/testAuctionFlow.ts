import { Sequelize } from 'sequelize-typescript';
import Product, { ProductType } from '../database/models/Product';
import Bid from '../database/models/Bid';
import User from '../database/models/User';
import Order from '../database/models/Order';
import { AuctionProcessorService } from '../services/cron/auctionProcessor.service';

console.log('🧪 Starting Auction Flow Test...');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'mysql',
  port: 3306,
  username: 'milagro_user',
  password: 'milagro_password',
  database: 'milagro',
  logging: false,
  models: [Product, Bid, User, Order],
});

async function testAuctionFlow() {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected!');

    console.log('\n📋 Step 1: Checking existing auctions...');
    const auctions = await Product.findAll({
      where: { type: ProductType.AUCTION },
      include: [{ model: Bid }]
    });
    console.log(`Found ${auctions.length} auctions:`);
    auctions.forEach(auction => {
      console.log(`  - ${auction.name} (ID: ${auction.id}) - Ends: ${auction.auctionEndTime} - Active: ${auction.isActive} - Bids: ${auction.bids?.length || 0}`);
    });

    console.log('\n📋 Step 2: Checking existing users...');
    const users = await User.findAll({ limit: 5 });
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (ID: ${user.id}) - Email: ${user.email}`);
    });

    if (auctions.length === 0) {
      console.log('\n❌ No auctions found. Please seed the database first with: npm run seed');
      return;
    }

    if (users.length === 0) {
      console.log('\n❌ No users found. Please create users first.');
      return;
    }

    const testAuction = auctions[0];
    const testUser = users[0];

    console.log(`\n🎯 Selected test auction: ${testAuction.name} (ID: ${testAuction.id})`);
    console.log(`👤 Selected test user: ${testUser.firstName} ${testUser.lastName} (ID: ${testUser.id})`);

    console.log('\n📋 Step 3: Checking auction status...');
    const status = await AuctionProcessorService.getAuctionStatus(testAuction.id);
    console.log('Auction Status:', JSON.stringify(status, null, 2));

    console.log('\n📋 Step 4: Checking existing bids...');
    const existingBids = await Bid.findAll({
      where: { productId: testAuction.id },
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email'] }]
    });
    console.log(`Found ${existingBids.length} bids for auction ${testAuction.id}:`);
    existingBids.forEach(bid => {
      console.log(`  - User: ${bid.user?.firstName} ${bid.user?.lastName} - Amount: $${bid.bidAmount} - Winning: ${bid.isWinningBid}`);
    });

    console.log('\n📋 Step 5: Checking existing orders...');
    const existingOrders = await Order.findAll({
      where: { 
        orderType: 'auction',
        status: 'pending'
      },
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email'] }]
    });
    console.log(`Found ${existingOrders.length} pending auction orders:`);
    existingOrders.forEach(order => {
      console.log(`  - Order: ${order.orderNumber} - User: ${order.user?.firstName} ${order.user?.lastName} - Amount: $${order.totalAmount}`);
    });

    console.log('\n📋 Step 6: Manual auction processing test...');
    const summary = await AuctionProcessorService.processEndedAuctions();
    console.log('Processing Summary:', JSON.stringify(summary, null, 2));

    console.log('\n📋 Step 7: Final auction status check...');
    const finalStatus = await AuctionProcessorService.getAuctionStatus(testAuction.id);
    console.log('Final Auction Status:', JSON.stringify(finalStatus, null, 2));

    console.log('\n✅ Auction flow test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. If auction has ended and has a winner, check the created order');
    console.log('2. Test payment flow for the auction order');
    console.log('3. Use the API endpoints to interact with the system');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

testAuctionFlow(); 