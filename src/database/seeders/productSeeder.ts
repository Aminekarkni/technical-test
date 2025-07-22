import Product, { ProductType } from '../models/Product';
import Category from '../models/Category';
import Logger from '../../core/Logger';

export async function seedProducts() {
  try {
    const categories = await Category.findAll();
    
    if (categories.length === 0) {
      Logger.warn('No categories found. Please seed categories first.');
      return;
    }

    const products = [
      {
        name: 'iPhone 15 Pro Max',
        description: 'Latest iPhone with advanced camera system and A17 Pro chip',
        type: ProductType.FIXED_PRICE,
        price: 1199.99,
        stockQuantity: 50,
        images: ['iphone15-1.jpg', 'iphone15-2.jpg', 'iphone15-3.jpg'],
        coverImage: 'iphone15-1.jpg',
        categoryId: categories[0].id,
        isRecommended: true,
        isTopSeller: true,
        position: 1,
        isActive: true,
      },
      {
        name: 'MacBook Pro 16"',
        description: 'Powerful laptop with M3 Pro chip for professionals',
        type: ProductType.FIXED_PRICE,
        price: 2499.99,
        stockQuantity: 25,
        images: ['macbook-1.jpg', 'macbook-2.jpg'],
        coverImage: 'macbook-1.jpg',
        categoryId: categories[0].id,
        isRecommended: true,
        isTopSeller: false,
        position: 2,
        isActive: true,
      },
      {
        name: 'AirPods Pro',
        description: 'Wireless earbuds with active noise cancellation',
        type: ProductType.FIXED_PRICE,
        price: 249.99,
        stockQuantity: 100,
        images: ['airpods-1.jpg', 'airpods-2.jpg'],
        coverImage: 'airpods-1.jpg',
        categoryId: categories[0].id,
        isRecommended: false,
        isTopSeller: true,
        position: 3,
        isActive: true,
      },
      {
        name: 'Vintage Watch Collection',
        description: 'Rare vintage watch collection from the 1960s',
        type: ProductType.AUCTION,
        startingPrice: 5000.00,
        currentHighestBid: 5500.00,
        auctionEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        images: ['watch-1.jpg', 'watch-2.jpg'],
        coverImage: 'watch-1.jpg',
        categoryId: categories[5]?.id || categories[0].id,
        isRecommended: true,
        isTopSeller: false,
        position: 4,
        isActive: true,
      },
      {
        name: 'Gaming Laptop',
        description: 'High-performance gaming laptop with RTX 4080',
        type: ProductType.FIXED_PRICE,
        price: 1899.99,
        stockQuantity: 15,
        images: ['gaming-laptop-1.jpg'],
        coverImage: 'gaming-laptop-1.jpg',
        categoryId: categories[0].id,
        isRecommended: false,
        isTopSeller: false,
        position: 5,
        isActive: true,
      },
      {
        name: 'Designer Handbag',
        description: 'Luxury designer handbag in limited edition',
        type: ProductType.FIXED_PRICE,
        price: 899.99,
        stockQuantity: 10,
        images: ['handbag-1.jpg', 'handbag-2.jpg'],
        coverImage: 'handbag-1.jpg',
        categoryId: categories[1]?.id || categories[0].id,
        isRecommended: true,
        isTopSeller: false,
        position: 6,
        isActive: true,
      },
      {
        name: 'Smart Home Bundle',
        description: 'Complete smart home automation system',
        type: ProductType.FIXED_PRICE,
        price: 599.99,
        stockQuantity: 30,
        images: ['smart-home-1.jpg'],
        coverImage: 'smart-home-1.jpg',
        categoryId: categories[2]?.id || categories[0].id,
        isRecommended: false,
        isTopSeller: true,
        position: 7,
        isActive: true,
      },
      {
        name: 'Fitness Tracker',
        description: 'Advanced fitness tracker with health monitoring',
        type: ProductType.FIXED_PRICE,
        price: 199.99,
        stockQuantity: 75,
        images: ['fitness-tracker-1.jpg'],
        coverImage: 'fitness-tracker-1.jpg',
        categoryId: categories[3]?.id || categories[0].id,
        isRecommended: false,
        isTopSeller: false,
        position: 8,
        isActive: true,
      },
      {
        name: 'Rare Book Collection',
        description: 'First edition books from famous authors',
        type: ProductType.AUCTION,
        startingPrice: 2000.00,
        currentHighestBid: 2200.00,
        auctionEndTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        images: ['books-1.jpg'],
        coverImage: 'books-1.jpg',
        categoryId: categories[4]?.id || categories[0].id,
        isRecommended: true,
        isTopSeller: false,
        position: 9,
        isActive: true,
      },
      {
        name: 'Wireless Headphones',
        description: 'Premium wireless headphones with noise cancellation',
        type: ProductType.FIXED_PRICE,
        price: 349.99,
        stockQuantity: 40,
        images: ['headphones-1.jpg', 'headphones-2.jpg'],
        coverImage: 'headphones-1.jpg',
        categoryId: categories[0].id,
        isRecommended: false,
        isTopSeller: true,
        position: 10,
        isActive: true,
      },
    ];

    for (const productData of products) {
      await Product.findOrCreate({
        where: { name: productData.name },
        defaults: productData,
      });
    }

    Logger.info('Products seeded successfully');
  } catch (error) {
    Logger.error('Error seeding products:', error);
  }
} 