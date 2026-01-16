const db = require('../db');

class LawyerRoleService {
  async assignRoleBasedOnStatus(lawyerId) {
    try {
      const lawyer = await db('lawyers').where('id', lawyerId).first();
      
      if (!lawyer) {
        throw new Error('Lawyer not found');
      }

      // Determine appropriate role
      let roleName = 'lawyer'; // Base role
      
      const isVerified = lawyer.is_verified || lawyer.verification_status === 'approved';
      const tier = lawyer.subscription_tier?.toLowerCase();
      
      if (isVerified) {
        if (tier === 'premium') {
          roleName = 'premium_lawyer';
        } else {
          roleName = 'verified_lawyer';
        }
      }

      await this.assignRole(lawyerId, roleName);
      return roleName;
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  }

  async assignRole(lawyerId, roleName) {
    const role = await db('roles').where('name', roleName).first();
    
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    // Remove old roles
    await db('user_roles')
      .where({ user_id: lawyerId, user_type: 'lawyer' })
      .del();

    // Assign new role
    await db('user_roles').insert({
      user_id: lawyerId,
      user_type: 'lawyer',
      role_id: role.id
    });

    console.log(`✅ Assigned ${roleName} role to lawyer ${lawyerId}`);
  }

  async upgradeOnVerification(lawyerId) {
    const lawyer = await db('lawyers').where('id', lawyerId).first();
    const tier = lawyer.subscription_tier?.toLowerCase();
    const newRole = tier === 'premium' ? 'premium_lawyer' : 'verified_lawyer';
    await this.assignRole(lawyerId, newRole);
    return newRole;
  }

  async upgradeOnSubscription(lawyerId, subscriptionTier) {
    const lawyer = await db('lawyers').where('id', lawyerId).first();
    const isVerified = lawyer.is_verified || lawyer.verification_status === 'approved';
    
    if (!isVerified) {
      return 'lawyer'; // Can't upgrade if not verified
    }

    const tier = subscriptionTier.toLowerCase();
    const newRole = tier === 'premium' ? 'premium_lawyer' : 'verified_lawyer';
    await this.assignRole(lawyerId, newRole);
    return newRole;
  }

  async downgradeOnExpiry(lawyerId) {
    const lawyer = await db('lawyers').where('id', lawyerId).first();
    const isVerified = lawyer.is_verified || lawyer.verification_status === 'approved';
    const newRole = isVerified ? 'verified_lawyer' : 'lawyer';
    await this.assignRole(lawyerId, newRole);
    return newRole;
  }
}

module.exports = new LawyerRoleService();
