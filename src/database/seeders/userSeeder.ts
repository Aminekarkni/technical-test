import User from '../models/User';
import Role from '../models/Role';
import UserRole from '../models/UserRole';
import bcrypt from 'bcryptjs';
import Logger from '../../core/Logger';

export async function seedUsers() {
  try {
    // Get roles
    const adminRole = await Role.findOne({ where: { code: 'admin' } });
    const userRole = await Role.findOne({ where: { code: 'user' } });

    if (!adminRole || !userRole) {
      Logger.warn('Roles not found. Please ensure roles are seeded first.');
      return;
    }

          const users = [
        {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@milagro.com',
          password: 'admin123456',
          phoneNumber: '+1234567890',
          verified: true,
          emailIsVerified: true,
          roleCode: 'admin',
        },
        {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'password',
          phoneNumber: '+1234567891',
          verified: true,
          emailIsVerified: true,
          roleCode: 'user',
        },
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password',
          phoneNumber: '+1234567892',
          verified: true,
          emailIsVerified: true,
          roleCode: 'user',
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          password: 'password',
          phoneNumber: '+1234567893',
          verified: true,
          emailIsVerified: true,
          roleCode: 'user',
        },
      ];

    for (const userData of users) {
      const { roleCode, ...userFields } = userData;
      
      const [user, created] = await User.findOrCreate({
        where: { email: userFields.email },
        defaults: {
          ...userFields,
        },
      });

      if (created) {
        // Assign role
        const role = roleCode === 'admin' ? adminRole : userRole;
        await UserRole.findOrCreate({
          where: { userId: user.id, roleId: role.id },
          defaults: { userId: user.id, roleId: role.id },
        });

        Logger.info(`User created: ${user.email} with role: ${roleCode}`);
      }
    }

    Logger.info('Users seeded successfully');
  } catch (error) {
    Logger.error('Error seeding users:', error);
  }
} 