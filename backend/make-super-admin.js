require('dotenv').config();
const db = require('./db');

async function makeSuperAdmin() {
  try {
    const superAdminRole = await db('roles').where('name', 'super_admin').first();
    if (!superAdminRole) {
      console.log('❌ super_admin role not found!');
      return;
    }

    const admins = await db('users').where('is_admin', 1).select('id', 'name', 'email');

    for (const admin of admins) {
      const existing = await db('user_roles')
        .where({ user_id: admin.id, user_type: 'user', role_id: superAdminRole.id })
        .first();

      if (!existing) {
        await db('user_roles').insert({
          user_id: admin.id,
          user_type: 'user',
          role_id: superAdminRole.id
        });
        console.log(`✅ ${admin.name} is now super admin`);
      } else {
        console.log(`⚠️  ${admin.name} already super admin`);
      }
    }

    console.log('\n✅ Done! Admin users now have full access.');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.destroy();
  }
}

makeSuperAdmin();
