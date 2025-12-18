const db = require('../db');

// Generate unique referral code
const generateReferralCode = (name) => {
  const prefix = name.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${random}`;
};

// Get user referral data
const getReferralData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get or create referral code
    let user = await db('users').where('id', userId).first();
    console.log('User found:', user ? 'Yes' : 'No', user?.referral_code);
    if (!user || !user.referral_code) {
      const code = generateReferralCode(user.name);
      await db('users').where('id', userId).update({ referral_code: code });
      user.referral_code = code;
    }
    
    // Get referral stats
    const referrals = await db('referrals')
      .select('referrals.*', 'users.name as referee_name', 'users.email as referee_email')
      .leftJoin('users', 'referrals.referred_user_id', 'users.id')
      .where('referrals.referrer_id', userId)
      .orderBy('referrals.created_at', 'desc');
    
    const stats = {
      total_referrals: referrals.length,
      completed_referrals: referrals.filter(r => r.status === 'completed').length,
      pending_referrals: referrals.filter(r => r.status === 'pending').length,
      total_earnings: referrals.reduce((sum, r) => sum + (r.status === 'completed' && r.reward_status === 'paid' ? parseFloat(r.reward_amount) : 0), 0)
    };
    
    const responseData = {
      success: true,
      data: {
        referral_code: user.referral_code,
        referral_link: `${process.env.FRONTEND_URL}/register?ref=${user.referral_code}`,
        stats,
        referrals: referrals.map(r => ({
          id: r.id,
          referee_name: r.referee_name,
          referee_email: r.referee_email,
          reward_amount: parseFloat(r.reward_amount),
          status: r.status,
          created_at: r.created_at,
          completed_at: r.completed_at
        }))
      }
    };
    
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Process referral when user makes first payment
const processReferralReward = async (userId) => {
  try {
    const user = await db('users').where('id', userId).first();
    if (!user.referred_by) return;
    
    // Find the referrer
    const referrer = await db('users').where('referral_code', user.referred_by).first();
    if (!referrer) return;
    
    // Check if referral already processed
    const existing = await db('referrals')
      .where('referrer_id', referrer.id)
      .where('referred_user_id', userId)
      .first();
    
    if (existing && existing.status === 'completed') return;
    
    const rewardAmount = 10.00; // $10 reward
    
    if (existing) {
      // Update existing referral
      await db('referrals')
        .where('id', existing.id)
        .update({
          status: 'completed',
          reward_status: 'paid'
        });
    } else {
      // Create new referral record
      await db('referrals').insert({
        referrer_id: referrer.id,
        referred_user_id: userId,
        referred_email: user.email,
        reward_amount: rewardAmount,
        status: 'completed'
      });
    }
    
    // Update referrer earnings
    await db('users')
      .where('id', referrer.id)
      .increment('referral_earnings', rewardAmount);
    
    console.log(`✅ Referral reward processed: $${rewardAmount} for user ${referrer.id}`);
    
  } catch (error) {
    console.error('Referral processing error:', error);
  }
};

module.exports = {
  getReferralData,
  processReferralReward
};