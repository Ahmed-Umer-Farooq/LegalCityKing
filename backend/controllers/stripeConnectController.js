const db = require('../db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Mock mode flag - set to false when ready for real Stripe integration
const MOCK_MODE = false;

// Create Connect account for lawyer
const createConnectAccount = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    
    const lawyer = await db('lawyers').where('id', lawyerId).first();
    if (!lawyer) {
      return res.status(404).json({ error: 'Lawyer not found' });
    }

    // Check if already has Connect account
    if (lawyer.stripe_connect_account_id) {
      return res.status(400).json({ error: 'Connect account already exists' });
    }

    let accountId;

    if (MOCK_MODE) {
      // Mock: Generate fake account ID
      accountId = `mock_acct_${Date.now()}`;
      console.log('🧪 MOCK MODE: Created fake Connect account:', accountId);
    } else {
      // Real Stripe: Create Express Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: lawyer.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: 'individual',
        metadata: {
          lawyer_id: lawyerId.toString(),
          platform: 'LegalCityKing'
        }
      });
      accountId = account.id;
      console.log('✅ Created real Stripe Connect account:', accountId);
    }

    // Save to database
    await db('lawyers').where('id', lawyerId).update({
      stripe_connect_account_id: accountId,
      updated_at: new Date()
    });

    res.json({ 
      success: true, 
      accountId,
      message: MOCK_MODE ? 'Connect account created (TEST MODE)' : 'Connect account created'
    });
  } catch (error) {
    console.error('Create Connect account error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get onboarding link for lawyer to complete setup
const getOnboardingLink = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    
    const lawyer = await db('lawyers').where('id', lawyerId).first();
    if (!lawyer || !lawyer.stripe_connect_account_id) {
      return res.status(400).json({ error: 'No Connect account found. Create one first.' });
    }

    let onboardingUrl;

    if (MOCK_MODE) {
      // Mock: Return fake URL
      onboardingUrl = `${process.env.FRONTEND_URL}/lawyer-dashboard/payouts?mock_onboarding=success`;
      console.log('🧪 MOCK MODE: Generated fake onboarding URL');
    } else {
      // Real Stripe: Generate onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: lawyer.stripe_connect_account_id,
        refresh_url: `${process.env.FRONTEND_URL}/lawyer-dashboard/payouts?refresh=true`,
        return_url: `${process.env.FRONTEND_URL}/lawyer-dashboard/payouts?success=true`,
        type: 'account_onboarding'
      });
      onboardingUrl = accountLink.url;
      console.log('✅ Generated real Stripe onboarding URL');
    }

    res.json({ 
      success: true, 
      url: onboardingUrl,
      message: MOCK_MODE ? 'Onboarding link generated (TEST MODE)' : 'Onboarding link generated'
    });
  } catch (error) {
    console.error('Get onboarding link error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Connect account status
const getAccountStatus = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    
    const lawyer = await db('lawyers').where('id', lawyerId).first();
    if (!lawyer) {
      return res.status(404).json({ error: 'Lawyer not found' });
    }

    if (!lawyer.stripe_connect_account_id) {
      return res.json({
        connected: false,
        onboarding_complete: false,
        payouts_enabled: false
      });
    }

    let accountStatus;

    if (MOCK_MODE) {
      // Mock: Return fake status
      accountStatus = {
        connected: true,
        onboarding_complete: lawyer.connect_onboarding_complete,
        payouts_enabled: lawyer.payouts_enabled,
        account_id: lawyer.stripe_connect_account_id,
        bank_last4: '1234',
        payout_schedule: lawyer.payout_schedule
      };
      console.log('🧪 MOCK MODE: Returned fake account status');
    } else {
      // Real Stripe: Get account details
      const account = await stripe.accounts.retrieve(lawyer.stripe_connect_account_id);
      
      accountStatus = {
        connected: true,
        onboarding_complete: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
        charges_enabled: account.charges_enabled,
        account_id: account.id,
        bank_last4: account.external_accounts?.data[0]?.last4 || null,
        payout_schedule: lawyer.payout_schedule
      };

      // Update database if status changed
      if (account.details_submitted !== lawyer.connect_onboarding_complete) {
        await db('lawyers').where('id', lawyerId).update({
          connect_onboarding_complete: account.details_submitted,
          payouts_enabled: account.payouts_enabled,
          updated_at: new Date()
        });
      }
    }

    res.json(accountStatus);
  } catch (error) {
    console.error('Get account status error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get lawyer's balance
const getBalance = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    
    // Get balance from earnings table
    let earnings = await db('earnings').where('lawyer_id', lawyerId).first();
    
    if (!earnings) {
      earnings = {
        available_balance: 0,
        pending_balance: 0,
        total_earned: 0
      };
    }

    res.json({
      available: parseFloat(earnings.available_balance || 0),
      pending: parseFloat(earnings.pending_balance || 0),
      total_earned: parseFloat(earnings.total_earned || 0),
      last_payout_date: earnings.last_payout_date
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Request payout
const requestPayout = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const lawyer = await db('lawyers').where('id', lawyerId).first();
    if (!lawyer) {
      return res.status(404).json({ error: 'Lawyer not found' });
    }

    // Check if Connect account exists
    if (!lawyer.stripe_connect_account_id) {
      return res.status(400).json({ error: 'Please connect your bank account first' });
    }

    // Get available balance
    const earnings = await db('earnings').where('lawyer_id', lawyerId).first();
    const availableBalance = parseFloat(earnings?.available_balance || 0);

    if (amount > availableBalance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Check minimum payout amount
    if (amount < parseFloat(lawyer.minimum_payout_amount)) {
      return res.status(400).json({ 
        error: `Minimum payout amount is $${lawyer.minimum_payout_amount}` 
      });
    }

    let stripePayoutId = null;

    if (MOCK_MODE) {
      // Mock: Generate fake payout ID
      stripePayoutId = `mock_po_${Date.now()}`;
      console.log('🧪 MOCK MODE: Created fake payout:', stripePayoutId);
    } else {
      // Real Stripe: Create payout
      const payout = await stripe.payouts.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        metadata: {
          lawyer_id: lawyerId.toString()
        }
      }, {
        stripeAccount: lawyer.stripe_connect_account_id
      });
      stripePayoutId = payout.id;
      console.log('✅ Created real Stripe payout:', stripePayoutId);
    }

    // Create payout record
    const [payoutId] = await db('payouts').insert({
      lawyer_id: lawyerId,
      amount: amount,
      stripe_payout_id: stripePayoutId,
      status: 'pending',
      requested_at: new Date()
    });

    // Update earnings - move from available to pending
    await db('earnings').where('lawyer_id', lawyerId).update({
      available_balance: db.raw('available_balance - ?', [amount]),
      pending_balance: db.raw('pending_balance + ?', [amount]),
      updated_at: new Date()
    });

    res.json({
      success: true,
      payout_id: payoutId,
      amount: amount,
      status: 'pending',
      message: MOCK_MODE 
        ? 'Payout requested (TEST MODE) - Will be processed in 2-7 days' 
        : 'Payout requested - Will arrive in 2-7 days'
    });
  } catch (error) {
    console.error('Request payout error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get payout history
const getPayoutHistory = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    
    const payouts = await db('payouts')
      .where('lawyer_id', lawyerId)
      .orderBy('requested_at', 'desc')
      .limit(50);

    res.json(payouts);
  } catch (error) {
    console.error('Get payout history error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Complete onboarding (called when lawyer returns from Stripe)
const completeOnboarding = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    
    const lawyer = await db('lawyers').where('id', lawyerId).first();
    if (!lawyer || !lawyer.stripe_connect_account_id) {
      return res.status(400).json({ error: 'No Connect account found' });
    }

    if (MOCK_MODE) {
      // Mock: Mark as complete
      await db('lawyers').where('id', lawyerId).update({
        connect_onboarding_complete: true,
        payouts_enabled: true,
        updated_at: new Date()
      });
      console.log('🧪 MOCK MODE: Marked onboarding as complete');
    } else {
      // Real Stripe: Verify account status
      const account = await stripe.accounts.retrieve(lawyer.stripe_connect_account_id);
      
      await db('lawyers').where('id', lawyerId).update({
        connect_onboarding_complete: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
        updated_at: new Date()
      });
    }

    res.json({ 
      success: true,
      message: 'Onboarding completed successfully'
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createConnectAccount,
  getOnboardingLink,
  getAccountStatus,
  getBalance,
  requestPayout,
  getPayoutHistory,
  completeOnboarding
};
