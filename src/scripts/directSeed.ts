import { Sequelize } from 'sequelize-typescript';
import { config } from 'dotenv';

// Load environment variables
config();

console.log('Starting direct seeding...');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'milagro_user',
  password: process.env.DB_PASSWORD || 'milagro_password',
  database: process.env.DB_NAME || 'milagro',
  logging: false,
});

const products = [
  {
    name: 'iPhone 15 Pro Max',
    description: 'Latest iPhone with advanced camera system and A17 Pro chip',
    type: 'fixed_price',
    price: 1199.99,
    stockQuantity: 50,
    startingPrice: null,
    currentHighestBid: null,
    auctionEndTime: null,
    images: JSON.stringify(['iphone15-1.jpg', 'iphone15-2.jpg', 'iphone15-3.jpg']),
    coverImage: 'iphone15-1.jpg',
    categoryId: 1,
    isRecommended: true,
    isTopSeller: true,
    position: 1,
    isActive: true,
  },
  {
    name: 'MacBook Pro 16"',
    description: 'Powerful laptop with M3 Pro chip for professionals',
    type: 'fixed_price',
    price: 2499.99,
    stockQuantity: 25,
    startingPrice: null,
    currentHighestBid: null,
    auctionEndTime: null,
    images: JSON.stringify(['macbook-1.jpg', 'macbook-2.jpg']),
    coverImage: 'macbook-1.jpg',
    categoryId: 1,
    isRecommended: true,
    isTopSeller: false,
    position: 2,
    isActive: true,
  },
  {
    name: 'AirPods Pro',
    description: 'Wireless earbuds with active noise cancellation',
    type: 'fixed_price',
    price: 249.99,
    stockQuantity: 100,
    startingPrice: null,
    currentHighestBid: null,
    auctionEndTime: null,
    images: JSON.stringify(['airpods-1.jpg', 'airpods-2.jpg']),
    coverImage: 'airpods-1.jpg',
    categoryId: 1,
    isRecommended: false,
    isTopSeller: true,
    position: 3,
    isActive: true,
  },
  {
    name: 'Vintage Watch Collection',
    description: 'Rare vintage watch collection from the 1960s',
    type: 'auction',
    price: null,
    stockQuantity: null,
    startingPrice: 5000.00,
    currentHighestBid: 5500.00,
    auctionEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    images: JSON.stringify(['watch-1.jpg', 'watch-2.jpg']),
    coverImage: 'watch-1.jpg',
    categoryId: 6,
    isRecommended: true,
    isTopSeller: false,
    position: 4,
    isActive: true,
  },
  {
    name: 'Gaming Laptop',
    description: 'High-performance gaming laptop with RTX 4080',
    type: 'fixed_price',
    price: 1899.99,
    stockQuantity: 15,
    startingPrice: null,
    currentHighestBid: null,
    auctionEndTime: null,
    images: JSON.stringify(['gaming-laptop-1.jpg']),
    coverImage: 'gaming-laptop-1.jpg',
    categoryId: 1,
    isRecommended: false,
    isTopSeller: false,
    position: 5,
    isActive: true,
  },
  {
    name: 'Designer Handbag',
    description: 'Luxury designer handbag in limited edition',
    type: 'fixed_price',
    price: 899.99,
    stockQuantity: 10,
    startingPrice: null,
    currentHighestBid: null,
    auctionEndTime: null,
    images: JSON.stringify(['handbag-1.jpg', 'handbag-2.jpg']),
    coverImage: 'handbag-1.jpg',
    categoryId: 2,
    isRecommended: true,
    isTopSeller: false,
    position: 6,
    isActive: true,
  },
  {
    name: 'Smart Home Bundle',
    description: 'Complete smart home automation system',
    type: 'fixed_price',
    price: 599.99,
    stockQuantity: 30,
    startingPrice: null,
    currentHighestBid: null,
    auctionEndTime: null,
    images: JSON.stringify(['smart-home-1.jpg']),
    coverImage: 'smart-home-1.jpg',
    categoryId: 3,
    isRecommended: false,
    isTopSeller: true,
    position: 7,
    isActive: true,
  },
  {
    name: 'Fitness Tracker',
    description: 'Advanced fitness tracker with health monitoring',
    type: 'fixed_price',
    price: 199.99,
    stockQuantity: 75,
    startingPrice: null,
    currentHighestBid: null,
    auctionEndTime: null,
    images: JSON.stringify(['fitness-tracker-1.jpg']),
    coverImage: 'fitness-tracker-1.jpg',
    categoryId: 4,
    isRecommended: false,
    isTopSeller: false,
    position: 8,
    isActive: true,
  },
  {
    name: 'Rare Book Collection',
    description: 'First edition books from famous authors',
    type: 'auction',
    price: null,
    stockQuantity: null,
    startingPrice: 2000.00,
    currentHighestBid: 2200.00,
    auctionEndTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    images: JSON.stringify(['books-1.jpg']),
    coverImage: 'books-1.jpg',
    categoryId: 5,
    isRecommended: true,
    isTopSeller: false,
    position: 9,
    isActive: true,
  },
  {
    name: 'Wireless Headphones',
    description: 'Premium wireless headphones with noise cancellation',
    type: 'fixed_price',
    price: 349.99,
    stockQuantity: 40,
    startingPrice: null,
    currentHighestBid: null,
    auctionEndTime: null,
    images: JSON.stringify(['headphones-1.jpg', 'headphones-2.jpg']),
    coverImage: 'headphones-1.jpg',
    categoryId: 1,
    isRecommended: false,
    isTopSeller: true,
    position: 10,
    isActive: true,
  },
];

async function seedProducts() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected!');
    
    console.log('Checking categories...');
    const [categories] = await sequelize.query('SELECT COUNT(*) as count FROM categories') as any;
    console.log(`Found ${categories[0].count} categories`);
    
    console.log('Inserting products...');
    for (const product of products) {
      const [result] = await sequelize.query(`
        INSERT IGNORE INTO products (
          name, description, type, price, stockQuantity, startingPrice, 
          currentHighestBid, auctionEndTime, images, coverImage, categoryId,
          isRecommended, isTopSeller, position, isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          product.name, product.description, product.type, product.price,
          product.stockQuantity, product.startingPrice, product.currentHighestBid,
          product.auctionEndTime, product.images, product.coverImage, product.categoryId,
          product.isRecommended, product.isTopSeller, product.position, product.isActive
        ]
      });
      console.log(`Inserted: ${product.name}`);
    }
    
    console.log('Checking products...');
    const [productCount] = await sequelize.query('SELECT COUNT(*) as count FROM products') as any;
    console.log(`Total products: ${productCount[0].count}`);
    
    console.log('Seeding completed!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

seedProducts(); 