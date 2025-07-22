import { connect } from '../database';
import { AuctionProcessorService } from '../services/cron/auctionProcessor.service';
import Product from '../database/models/Product';
import Order from '../database/models/Order';

console.log('🧪 Testing Auction Processing...');

async function testAuctionProcessing() {
  try {
    console.log('🔌 Connecting to database...');
    await connect();
    console.log('✅ Connected!');

    console.log('\n📋 Step 1: Check auctions before processing...');
    
    const auctionsBefore = await Product.findAll({
      where: {
        type: 'auction',
        auctionEndTime: {
          $lt: new Date()
        }
      },
      order: [['auctionEndTime', 'ASC']]
    });
    
    console.log(`Found ${auctionsBefore.length} ended auctions:`);
    auctionsBefore.forEach((auction: any) => {
      console.log(`  - ID: ${auction.id} | ${auction.name} | Active: ${auction.isActive} | Highest Bid: $${auction.currentHighestBid}`);
    });

    console.log('\n🔄 Step 2: Processing ended auctions...');
    const summary = await AuctionProcessorService.processEndedAuctions();
    
    console.log('Processing Summary:');
    console.log(`  - Processed: ${summary.processed}`);
    console.log(`  - Results: ${summary.results.length}`);
    console.log(`  - Errors: ${summary.errors.length}`);
    
    if (summary.results.length > 0) {
      console.log('\n✅ Results:');
      summary.results.forEach(result => {
        console.log(`  - Auction: ${result.productName} | Winner: ${result.winnerEmail} | Amount: $${result.winningBidAmount} | Order: ${result.orderNumber}`);
      });
    }
    
    if (summary.errors.length > 0) {
      console.log('\n❌ Errors:');
      summary.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }

    console.log('\n📋 Step 3: Check auctions after processing...');
    const auctionsAfter = await Product.findAll({
      where: {
        type: 'auction',
        auctionEndTime: {
          $lt: new Date()
        }
      },
      order: [['auctionEndTime', 'ASC']]
    });
    
    console.log(`Found ${auctionsAfter.length} ended auctions after processing:`);
    auctionsAfter.forEach((auction: any) => {
      console.log(`  - ID: ${auction.id} | ${auction.name} | Active: ${auction.isActive} | Highest Bid: $${auction.currentHighestBid}`);
    });

    console.log('\n📋 Step 4: Check if orders were created...');
    const orders = await Order.findAll({
      where: { orderType: 'auction' },
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`Found ${orders.length} auction orders:`);
    orders.forEach((order: any) => {
      console.log(`  - Order: ${order.orderNumber} | User: ${order.userId} | Amount: $${order.totalAmount} | Status: ${order.status} | Payment: ${order.paymentStatus}`);
    });

    console.log('\n✅ Auction processing test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuctionProcessing(); 