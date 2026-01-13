const { AbilityBuilder, Ability } = require('@casl/ability');
const db = require('../db');

class RBACService {
  constructor() {
    this.cache = new Map();
  }

  async getUserAbilities(userId, userType, context = {}) {
    const cacheKey = `${userId}-${userType}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const { can, cannot, build } = new AbilityBuilder(Ability);

    const userRoles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .join('role_permissions', 'roles.id', 'role_permissions.role_id')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('user_roles.user_id', userId)
      .where('user_roles.user_type', userType)
      .select(
        'permissions.action',
        'permissions.resource',
        'permissions.name',
        'roles.name as role_name'
      );

    userRoles.forEach(permission => {
      const conditions = this.buildConditions(permission, userId);
      can(permission.action, permission.resource, conditions);
    });

    const roles = [...new Set(userRoles.map(r => r.role_name))];
    
    if (roles.includes('super_admin')) {
      can('manage', 'all');
    }
    
    if (roles.includes('admin')) {
      can('read', 'users');
      can('manage', 'lawyers');
      can('read', 'payments');
    }

    const ability = build();
    this.cache.set(cacheKey, ability);
    
    return ability;
  }

  buildConditions(permission, userId) {
    const conditions = {};

    if (permission.resource === 'cases' || permission.resource === 'documents') {
      conditions.lawyer_id = userId;
    }
    
    if (permission.resource === 'payments' && permission.role_name === 'user') {
      conditions.user_id = userId;
    }

    return Object.keys(conditions).length > 0 ? conditions : undefined;
  }

  async assignRole(userId, userType, roleName) {
    const role = await db('roles').where('name', roleName).first();
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    await db('user_roles').insert({
      user_id: userId,
      user_type: userType,
      role_id: role.id
    });

    this.clearUserCache(userId, userType);
  }

  async can(userId, userType, action, resource) {
    const ability = await this.getUserAbilities(userId, userType);
    return ability.can(action, resource);
  }

  async getUserRoles(userId, userType) {
    return await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', userId)
      .where('user_roles.user_type', userType)
      .select('roles.name', 'roles.description', 'roles.level');
  }

  clearUserCache(userId, userType) {
    this.cache.delete(`${userId}-${userType}`);
  }

  async migrateExistingUsers() {
    const users = await db('users').select('id', 'role', 'is_admin');
    for (const user of users) {
      let roleName = 'user';
      if (user.is_admin || user.role === 'admin') {
        roleName = 'admin';
      }
      
      try {
        await this.assignRole(user.id, 'user', roleName);
      } catch (error) {
        // Ignore duplicate entries
      }
    }

    const lawyers = await db('lawyers').select('id', 'is_verified');
    for (const lawyer of lawyers) {
      const roleName = lawyer.is_verified ? 'verified_lawyer' : 'lawyer';
      
      try {
        await this.assignRole(lawyer.id, 'lawyer', roleName);
      } catch (error) {
        // Ignore duplicate entries
      }
    }
  }
}

module.exports = new RBACService();