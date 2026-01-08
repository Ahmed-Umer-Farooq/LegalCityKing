const cron = require('node-cron');
const { checkExpiredMemberships } = require('../controllers/stripeController');

// Run every day at midnight to check for expired memberships
const startMembershipExpiryJob = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('🕛 Running membership expiry check...');
    try {
      const result = await checkExpiredMemberships();
      console.log(`✅ Membership expiry check completed. Expired: ${result.expired_count} memberships`);
    } catch (error) {
      console.error('❌ Membership expiry check failed:', error);
    }
  });
  
  console.log('📅 Membership expiry cron job started (runs daily at midnight)');
};

// Run every hour to check for expired memberships (more frequent checking)
const startHourlyMembershipCheck = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('🕐 Running hourly membership expiry check...');
    try {
      const result = await checkExpiredMemberships();
      if (result.expired_count > 0) {
        console.log(`✅ Hourly check: Expired ${result.expired_count} memberships`);
      }
    } catch (error) {
      console.error('❌ Hourly membership check failed:', error);
    }
  });
  
  console.log('⏰ Hourly membership expiry check started');
};

module.exports = {
  startMembershipExpiryJob,
  startHourlyMembershipCheck
};