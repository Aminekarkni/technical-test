import Role from '../models/Role';
import Permission from '../models/Permission';
import RolePermission from '../models/RolePermission';
import Logger from '../../core/Logger';

export async function seedRolePermissions() {
  try {
    // Get all roles and permissions
    const roles = await Role.findAll();
    const permissions = await Permission.findAll();

    if (roles.length === 0 || permissions.length === 0) {
      Logger.warn('Roles or permissions not found. Please ensure they are seeded first.');
      return;
    }

    const adminRole = roles.find(role => role.code === 'admin');
    const userRole = roles.find(role => role.code === 'user');

    if (!adminRole || !userRole) {
      Logger.warn('Admin or user role not found.');
      return;
    }

    // Admin gets all permissions
    for (const permission of permissions) {
      await RolePermission.findOrCreate({
        where: { roleId: adminRole.id, permissionId: permission.id },
        defaults: { roleId: adminRole.id, permissionId: permission.id },
      });
    }

    // User gets limited permissions
    const userPermissions = [
      'product.read',
      'order.create',
      'order.read',
      'bid.create',
      'bid.read',
      'user.read',
      'user.update',
    ];

    for (const permissionCode of userPermissions) {
      const permission = permissions.find(p => p.code === permissionCode);
      if (permission) {
        await RolePermission.findOrCreate({
          where: { roleId: userRole.id, permissionId: permission.id },
          defaults: { roleId: userRole.id, permissionId: permission.id },
        });
      }
    }

    Logger.info('Role permissions seeded successfully');
  } catch (error) {
    Logger.error('Error seeding role permissions:', error);
  }
} 