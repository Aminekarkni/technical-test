import { Sequelize } from 'sequelize-typescript';

console.log('🧪 Simple Auction Processing Test...');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'mysql',
  port: 3306,
  username: 'milagro_user',
  password: 'milagro_password',
  database: 'milagro',
  logging: false,
});

async function simpleAuctionTest() {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected!');

    console.log('\n📋 Step 1: Check ended auctions...');
    const [endedAuctions] = await sequelize.query(`
      SELECT id, name, auctionEndTime, isActive, currentHighestBid 
      FROM products 
      WHERE type='auction' AND auctionEndTime < NOW()
      ORDER BY auctionEndTime ASC
    `) as any;
    
    console.log(`Found ${endedAuctions.length} ended auctions:`);
    endedAuctions.forEach((auction: any) => {
      console.log(`  - ID: ${auction.id} | ${auction.name} | Active: ${auction.isActive} | Highest Bid: $${auction.currentHighestBid}`);
    });

    if (endedAuctions.length === 0) {
      console.log('\n❌ No ended auctions found. Creating a test auction...');
      
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await sequelize.query(`
        INSERT INTO products (
          name, description, type, startingPrice, currentHighestBid, 
          auctionEndTime, images, coverImage, categoryId, isRecommended, 
          isTopSeller, position, isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          'Test Auction - Ended Yesterday',
          'This is a test auction that ended yesterday',
          'auction',
          100.00,
          150.00,
          pastDate,
          JSON.stringify(['test-auction-1.jpg']),
          'test-auction-1.jpg',
          6,
          false,
          false,
          999,
          true
        ]
      });
      
      console.log('✅ Test auction created!');
    }

    console.log('\n📋 Step 2: Check for winning bids...');
    const [winningBids] = await sequelize.query(`
      SELECT b.id, b.productId, b.userId, b.bidAmount, b.isWinningBid,
             p.name as productName, u.email as userEmail
      FROM bids b
      JOIN products p ON b.productId = p.id
      JOIN users u ON b.userId = u.id
      WHERE b.isWinningBid = true AND p.type = 'auction'
    `) as any;
    
    console.log(`Found ${winningBids.length} winning bids:`);
    winningBids.forEach((bid: any) => {
      console.log(`  - Product: ${bid.productName} | User: ${bid.userEmail} | Amount: $${bid.bidAmount}`);
    });

    console.log('\n📋 Step 3: Check existing auction orders...');
    const [existingOrders] = await sequelize.query(`
      SELECT id, orderNumber, userId, totalAmount, status, paymentStatus, orderType
      FROM orders 
      WHERE orderType='auction'
      ORDER BY createdAt DESC
    `) as any;
    
    console.log(`Found ${existingOrders.length} existing auction orders:`);
    existingOrders.forEach((order: any) => {
      console.log(`  - Order: ${order.orderNumber} | User: ${order.userId} | Amount: $${order.totalAmount} | Status: ${order.status}`);
    });

    console.log('\n📋 Step 4: Simulate auction processing...');
    
    for (const auction of endedAuctions) {
      console.log(`\n🔄 Processing auction: ${auction.name} (ID: ${auction.id})`);
      
      if (!auction.isActive) {
        console.log(`  - Auction ${auction.id} is already inactive`);
        continue;
      }

      const [winningBid] = await sequelize.query(`
        SELECT b.id, b.userId, b.bidAmount, u.email, u.firstName, u.lastName
        FROM bids b
        JOIN users u ON b.userId = u.id
        WHERE b.productId = ? AND b.isWinningBid = true
        LIMIT 1
      `, {
        replacements: [auction.id]
      }) as any;

      if (winningBid.length === 0) {
        console.log(`  - No winning bid found for auction ${auction.id}, marking as inactive`);
        await sequelize.query(`
          UPDATE products SET isActive = false WHERE id = ?
        `, {
          replacements: [auction.id]
        });
        continue;
      }

      const bid = winningBid[0];
      console.log(`  - Found winning bid: User ${bid.email} with amount $${bid.bidAmount}`);

      const [existingOrder] = await sequelize.query(`
        SELECT id FROM orders 
        WHERE userId = ? AND orderType = 'auction' AND status = 'pending'
      `, {
        replacements: [bid.userId]
      }) as any;

      if (existingOrder.length > 0) {
        console.log(`  - Order already exists for user ${bid.userId}`);
        continue;
      }

      const orderNumber = `AUCTION-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      console.log(`  - Creating order: ${orderNumber}`);
      
      const [orderResult] = await sequelize.query(`
        INSERT INTO orders (
          userId, orderNumber, status, paymentStatus, orderType,
          subtotal, taxAmount, shippingAmount, totalAmount,
          firstName, lastName, email, phoneNumber, note, reservationDate,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          bid.userId,
          orderNumber,
          'pending',
          'pending_payment',
          'auction',
          bid.bidAmount,
          0,
          0,
          bid.bidAmount,
          bid.firstName,
          bid.lastName,
          bid.email,
          '',
          `Auction winner for: ${auction.name}`,
          new Date()
        ]
      }) as any;

      const orderId = orderResult.insertId;
      
      await sequelize.query(`
        INSERT INTO order_items (
          orderId, productId, productName, quantity, unitPrice, totalPrice,
          productData, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          orderId,
          auction.id,
          auction.name,
          1,
          bid.bidAmount,
          bid.bidAmount,
          JSON.stringify({
            id: auction.id,
            name: auction.name,
            type: 'auction',
            winningBidId: bid.id
          })
        ]
      });

      await sequelize.query(`
        UPDATE products SET isActive = false, currentHighestBid = ? WHERE id = ?
      `, {
        replacements: [bid.bidAmount, auction.id]
      });

      console.log(`  ✅ Order created successfully: ${orderNumber}`);
    }

    console.log('\n📋 Step 5: Final check...');
    const [finalOrders] = await sequelize.query(`
      SELECT id, orderNumber, userId, totalAmount, status, paymentStatus, orderType
      FROM orders 
      WHERE orderType='auction'
      ORDER BY createdAt DESC
    `) as any;
    
    console.log(`Total auction orders: ${finalOrders.length}`);
    finalOrders.forEach((order: any) => {
      console.log(`  - Order: ${order.orderNumber} | User: ${order.userId} | Amount: $${order.totalAmount} | Status: ${order.status}`);
    });

    console.log('\n✅ Auction processing simulation completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

simpleAuctionTest(); 