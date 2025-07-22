import Role from '../models/Role';
import Permission from '../models/Permission';
import Category from '../models/Category';
import Logger from '../../core/Logger';

export async function seedBasicData() {
  try {
    Logger.info('Seeding basic data (roles, permissions, categories)...');

    // Seed roles
    const roles = [
      { code: 'admin', name: 'Administrator', description: 'Full system access' },
      { code: 'user', name: 'User', description: 'Standard user access' },
    ];

    for (const roleData of roles) {
      await Role.findOrCreate({
        where: { code: roleData.code },
        defaults: roleData,
      });
    }

    // Seed permissions
    const permissions = [
      { code: 'product.create', name: 'Create Product', description: 'Can create products' },
      { code: 'product.read', name: 'Read Product', description: 'Can view products' },
      { code: 'product.update', name: 'Update Product', description: 'Can update products' },
      { code: 'product.delete', name: 'Delete Product', description: 'Can delete products' },
      { code: 'order.create', name: 'Create Order', description: 'Can create orders' },
      { code: 'order.read', name: 'Read Order', description: 'Can view orders' },
      { code: 'order.update', name: 'Update Order', description: 'Can update orders' },
      { code: 'bid.create', name: 'Create Bid', description: 'Can place bids' },
      { code: 'bid.read', name: 'Read Bid', description: 'Can view bids' },
      { code: 'user.read', name: 'Read User', description: 'Can view users' },
      { code: 'user.update', name: 'Update User', description: 'Can update users' },
    ];

    for (const permissionData of permissions) {
      await Permission.findOrCreate({
        where: { code: permissionData.code },
        defaults: permissionData,
      });
    }

    // Seed categories
    const categories = [
      { name: 'Electronics', description: 'Electronic devices and gadgets', position: 1 },
      { name: 'Fashion', description: 'Clothing and accessories', position: 2 },
      { name: 'Home & Garden', description: 'Home improvement and garden items', position: 3 },
      { name: 'Sports', description: 'Sports equipment and accessories', position: 4 },
      { name: 'Books', description: 'Books and publications', position: 5 },
      { name: 'Collectibles', description: 'Collectible items and memorabilia', position: 6 },
    ];

    for (const categoryData of categories) {
      await Category.findOrCreate({
        where: { name: categoryData.name },
        defaults: categoryData,
      });
    }

    Logger.info('Basic data seeded successfully');
  } catch (error) {
    Logger.error('Error seeding basic data:', error);
  }
} 