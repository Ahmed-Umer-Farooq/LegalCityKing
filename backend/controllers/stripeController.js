const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');

// Create Stripe customer
const createCustomer = async (email, name, userType = 'user') => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { userType }
    });
    return customer;
  } catch (error) {
    throw new Error(`Failed to create Stripe customer: ${error.message}`);
  }
};

// Create subscription checkout session
const createSubscriptionCheckout = async (req, res) => {
  try {
    const { priceId } = req.body;
    const lawyerId = req.user.id; // Get from authenticated user
    
    const lawyer = await db('lawyers').where('id', lawyerId).first();
    if (!lawyer) {
      return res.status(404).json({ error: 'Lawyer not found' });
    }

    let customerId = lawyer.stripe_customer_id;
    if (!customerId) {
      const customer = await createCustomer(lawyer.email, lawyer.name, 'lawyer');
      customerId = customer.id;
      await db('lawyers').where('id', lawyerId).update({ stripe_customer_id: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/lawyer-dashboard/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/lawyer-dashboard/subscription`,
      metadata: {
        lawyerId: lawyerId.toString(),
        type: 'subscription'
      },
      allow_promotion_codes: true
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create payment link checkout session
const createPaymentLinkCheckout = async (req, res) => {
  try {
    const { linkId, userId } = req.body;
    
    const paymentLink = await db('payment_links')
      .select('payment_links.*', 'lawyers.name as lawyer_name', 'lawyers.stripe_connect_account_id')
      .leftJoin('lawyers', 'payment_links.lawyer_id', 'lawyers.id')
      .where('payment_links.link_id', linkId)
      .first();

    if (!paymentLink) {
      return res.status(404).json({ error: 'Payment link not found' });
    }

    if (new Date() > new Date(paymentLink.expires_at)) {
      return res.status(400).json({ error: 'Payment link has expired' });
    }

    const existingTransaction = await db('transactions')
      .where('payment_link_id', linkId)
      .where('status', 'completed')
      .first();

    if (existingTransaction) {
      return res.status(400).json({ error: 'This payment link has already been used' });
    }

    let user = null;
    let customerId = null;

    if (userId) {
      user = await db('users').where('id', userId).first();
      if (user) {
        customerId = user.stripe_customer_id;
        if (!customerId) {
          const customer = await createCustomer(user.email, user.name, 'user');
          customerId = customer.id;
          await db('users').where('id', userId).update({ stripe_customer_id: customerId });
        }
      }
    }

    const platformFee = Math.round(paymentLink.amount * 0.05 * 100);
    const lawyerEarnings = paymentLink.amount * 100 - platformFee;

    const sessionConfig = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: paymentLink.service_name,
            description: paymentLink.description || `Legal service from ${paymentLink.lawyer_name}`,
          },
          unit_amount: paymentLink.amount * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pay/${linkId}`,
      metadata: {
        lawyerId: paymentLink.lawyer_id.toString(),
        userId: userId?.toString() || '',
        type: 'payment_link',
        paymentLinkId: linkId,
        platformFee: platformFee.toString(),
        lawyerEarnings: lawyerEarnings.toString()
      }
    };

    // Add destination charge if lawyer has Connect account
    if (paymentLink.stripe_connect_account_id) {
      sessionConfig.payment_intent_data = {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: paymentLink.stripe_connect_account_id
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Payment link checkout error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create one-time payment checkout session
const createConsultationCheckout = async (req, res) => {
  try {
    const { amount, lawyerId, userId, description = 'Legal Consultation' } = req.body;
    
    const lawyer = await db('lawyers').where('secure_id', lawyerId).first();
    if (!lawyer) {
      return res.status(404).json({ error: 'Lawyer not found' });
    }

    let user = null;
    let customerId = null;

    if (userId) {
      user = await db('users').where('id', userId).first();
      if (user) {
        customerId = user.stripe_customer_id;
        if (!customerId) {
          const customer = await createCustomer(user.email, user.name, 'user');
          customerId = customer.id;
          await db('users').where('id', userId).update({ stripe_customer_id: customerId });
        }
      }
    }

    const platformFee = Math.round(amount * 0.05 * 100);
    const lawyerEarnings = amount * 100 - platformFee;

    const sessionConfig = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: description,
            description: `Legal consultation with ${lawyer.name}`,
          },
          unit_amount: amount * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/lawyer/${lawyerId}`,
      metadata: {
        lawyerId: lawyer.id.toString(),
        userId: userId?.toString() || '',
        type: 'consultation',
        platformFee: platformFee.toString(),
        lawyerEarnings: lawyerEarnings.toString()
      }
    };

    // Add destination charge if lawyer has Connect account
    if (lawyer.stripe_connect_account_id) {
      sessionConfig.payment_intent_data = {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: lawyer.stripe_connect_account_id
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Consultation checkout error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get subscription plans
const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await db('subscription_plans').where('active', true);
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get lawyer earnings
const getLawyerEarnings = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    
    // Clean up any duplicate earnings records first
    const allEarnings = await db('earnings').where('lawyer_id', lawyerId);
    if (allEarnings.length > 1) {
      // Calculate correct total from all records
      const totalEarned = allEarnings.reduce((sum, e) => sum + parseFloat(e.total_earned || 0), 0);
      const totalAvailable = allEarnings.reduce((sum, e) => sum + parseFloat(e.available_balance || 0), 0);
      
      // Delete all records
      await db('earnings').where('lawyer_id', lawyerId).del();
      
      // Create single correct record
      await db('earnings').insert({
        lawyer_id: lawyerId,
        total_earned: totalEarned,
        available_balance: totalAvailable,
        pending_balance: 0,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    // Get the earnings record (create if doesn't exist)
    let earnings = await db('earnings').where('lawyer_id', lawyerId).first();
    if (!earnings) {
      await db('earnings').insert({ 
        lawyer_id: lawyerId,
        total_earned: 0,
        available_balance: 0,
        pending_balance: 0,
        created_at: new Date(),
        updated_at: new Date()
      });
      earnings = await db('earnings').where('lawyer_id', lawyerId).first();
    }

    const recentTransactions = await db('transactions')
      .leftJoin('users', 'transactions.user_id', 'users.id')
      .select(
        'transactions.*',
        'users.name as user_name',
        'users.email as user_email'
      )
      .where('transactions.lawyer_id', lawyerId)
      .where('transactions.status', 'completed')
      .orderBy('transactions.created_at', 'desc')
      .limit(10);

    res.json({ earnings, recentTransactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create billing portal session
const createBillingPortalSession = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const lawyer = await db('lawyers').where('id', lawyerId).first();
    
    if (!lawyer || !lawyer.stripe_customer_id) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: lawyer.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/lawyer-dashboard/subscription`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Billing portal error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get payment receipt
const getPaymentReceipt = async (req, res) => {
  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (!session) {
      return res.status(404).json({ error: 'Payment session not found' });
    }

    const receiptData = {
      sessionId: session.id,
      paymentIntentId: session.payment_intent,
      amount: session.amount_total / 100,
      currency: session.currency.toUpperCase(),
      status: session.payment_status,
      customerEmail: session.customer_details?.email,
      customerName: session.customer_details?.name,
      created: new Date(session.created * 1000).toISOString(),
      description: session.metadata?.type === 'consultation' ? 'Legal Consultation' : 'Subscription Payment'
    };

    res.json(receiptData);
  } catch (error) {
    console.error('Receipt retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Webhook handler - Skip signature verification for development
const handleWebhook = async (req, res) => {
  console.log('🔔 Webhook received:', req.body?.type);
  
  let event;
  try {
    // For development, just parse the body directly
    event = req.body;
    console.log('Event type:', event.type);
  } catch (err) {
    console.error('Webhook parsing failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleSubscriptionPayment(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

const handleCheckoutCompleted = async (session) => {
  console.log('🔔 Webhook: Payment completed', session.id);
  const { metadata, customer_details } = session;
  
  if (metadata.type === 'payment_link') {
    const platformFee = parseInt(metadata.platformFee) / 100;
    const lawyerEarnings = parseInt(metadata.lawyerEarnings) / 100;
    
    // Try to find user by email if userId not provided
    let userId = metadata.userId || null;
    if (!userId && customer_details?.email) {
      const user = await db('users').where('email', customer_details.email).first();
      if (user) {
        userId = user.id;
        console.log(`🔗 Linked payment to user: ${user.name} (${user.email})`);
      }
    }
    
    // Get payment link details for service description
    const paymentLink = await db('payment_links')
      .where('link_id', metadata.paymentLinkId)
      .first();
    
    const serviceDescription = paymentLink ? `${paymentLink.service_name} is paid` : 'Payment link service is paid';
    
    await db('transactions').insert({
      stripe_payment_id: session.payment_intent,
      user_id: userId,
      lawyer_id: metadata.lawyerId,
      amount: session.amount_total / 100,
      platform_fee: platformFee,
      lawyer_earnings: lawyerEarnings,
      type: 'payment_link',
      status: 'completed',
      description: serviceDescription,
      payment_link_id: metadata.paymentLinkId
    });
    
    console.log(`💰 Payment link transaction saved: $${session.amount_total / 100} to lawyer ${metadata.lawyerId}`);

    // Update lawyer earnings
    const existingEarnings = await db('earnings').where('lawyer_id', metadata.lawyerId).first();
    
    if (existingEarnings) {
      // Update existing record
      await db('earnings')
        .where('lawyer_id', metadata.lawyerId)
        .update({
          total_earned: parseFloat(existingEarnings.total_earned || 0) + lawyerEarnings,
          available_balance: parseFloat(existingEarnings.available_balance || 0) + lawyerEarnings,
          updated_at: new Date()
        });
    } else {
      // Create new record
      await db('earnings').insert({
        lawyer_id: metadata.lawyerId,
        total_earned: lawyerEarnings,
        available_balance: lawyerEarnings,
        pending_balance: 0,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    // Update payment link usage count
    if (paymentLink) {
      await db('payment_links')
        .where('link_id', metadata.paymentLinkId)
        .update({
          usage_count: (paymentLink.usage_count || 0) + 1,
          updated_at: new Date()
        });
    }
    
    // Process referral reward if this is user's first payment
    if (userId) {
      const { processReferralReward } = require('./referralController');
      await processReferralReward(userId);
    }
  } else if (metadata.type === 'subscription') {
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const priceId = subscription.items.data[0].price.id;
    
    // Get plan from database using the actual price ID
    const plan = await db('subscription_plans').where('stripe_price_id', priceId).first();
    let tier = 'professional'; // default
    
    if (plan) {
      tier = plan.name.toLowerCase();
      console.log(`✅ Found plan in database: ${plan.name} (${plan.billing_cycle})`);
    } else {
      // Fallback: determine tier from price amount
      const priceAmount = subscription.items.data[0].price.unit_amount;
      if (priceAmount >= 8000) { // $80+ is premium (yearly) or $99 (monthly)
        tier = 'premium';
      } else if (priceAmount >= 4000) { // $40+ is professional
        tier = 'professional';
      }
      console.log(`⚠️ Plan not found in DB, using price-based detection: $${priceAmount/100} -> ${tier}`);
    }
    
    console.log(`🔄 Setting subscription tier to: ${tier} for lawyer ${metadata.lawyerId}`);
    
    // Calculate expiry date (1 month from now)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    
    // Ensure we save the REAL Stripe subscription ID, not a test one
    const realStripeId = session.subscription; // This is the actual Stripe subscription ID
    
    await db('lawyers').where('id', metadata.lawyerId).update({
      stripe_subscription_id: realStripeId, // Use real ID from session
      stripe_customer_id: session.customer, // Also save customer ID
      subscription_tier: tier,
      subscription_status: 'active',
      subscription_created_at: new Date(),
      subscription_expires_at: expiryDate,
      subscription_cancelled: false,
      auto_renew: true
    });
    
    console.log(`✅ Saved real Stripe subscription ID: ${realStripeId}`);
  } else if (metadata.type === 'consultation') {
    const platformFee = parseInt(metadata.platformFee) / 100;
    const lawyerEarnings = parseInt(metadata.lawyerEarnings) / 100;
    
    // Try to find user by email if userId not provided
    let userId = metadata.userId || null;
    if (!userId && customer_details?.email) {
      const user = await db('users').where('email', customer_details.email).first();
      if (user) {
        userId = user.id;
        console.log(`🔗 Linked payment to user: ${user.name} (${user.email})`);
      }
    }
    
    // Get service description from line items
    let serviceDescription = 'Legal consultation payment';
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      if (lineItems.data && lineItems.data.length > 0) {
        const serviceName = lineItems.data[0].description;
        if (serviceName) {
          // Extract service type from description
          if (serviceName.includes('30-min Consultation') || serviceName.includes('Initial consultation')) {
            serviceDescription = '30-min Consultation is paid';
          } else if (serviceName.includes('1 Hour Session') || serviceName.includes('Hourly Legal Service')) {
            serviceDescription = '1 Hour Session is paid';
          } else if (serviceName.includes('Document Review')) {
            serviceDescription = 'Document Review is paid';
          } else {
            serviceDescription = `${serviceName} is paid`;
          }
        }
      }
    } catch (error) {
      console.log('Could not fetch line items for webhook, using default description');
    }
    
    await db('transactions').insert({
      stripe_payment_id: session.payment_intent,
      user_id: userId,
      lawyer_id: metadata.lawyerId,
      amount: session.amount_total / 100,
      platform_fee: platformFee,
      lawyer_earnings: lawyerEarnings,
      type: 'consultation',
      status: 'completed',
      description: serviceDescription
    });
    
    console.log(`💰 Transaction saved: $${session.amount_total / 100} to lawyer ${metadata.lawyerId}`);

    // Update lawyer earnings
    const existingEarnings = await db('earnings').where('lawyer_id', metadata.lawyerId).first();
    
    if (existingEarnings) {
      // Update existing record
      await db('earnings')
        .where('lawyer_id', metadata.lawyerId)
        .update({
          total_earned: parseFloat(existingEarnings.total_earned || 0) + lawyerEarnings,
          available_balance: parseFloat(existingEarnings.available_balance || 0) + lawyerEarnings,
          updated_at: new Date()
        });
    } else {
      // Create new record
      await db('earnings').insert({
        lawyer_id: metadata.lawyerId,
        total_earned: lawyerEarnings,
        available_balance: lawyerEarnings,
        pending_balance: 0,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    // Process referral reward if this is user's first payment
    if (userId) {
      const { processReferralReward } = require('./referralController');
      await processReferralReward(userId);
    }
  }
};

const handleSubscriptionPayment = async (invoice) => {
  // Handle recurring subscription payments
  console.log('Subscription payment succeeded:', invoice.id);
};

const handleSubscriptionUpdated = async (subscription) => {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const lawyer = await db('lawyers').where('stripe_customer_id', customer.id).first();
  
  if (lawyer) {
    await db('lawyers').where('id', lawyer.id).update({
      subscription_status: subscription.status
    });
  }
};

const handleSubscriptionCanceled = async (subscription) => {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const lawyer = await db('lawyers').where('stripe_customer_id', customer.id).first();
  
  if (lawyer) {
    // Mark as cancelled but keep active until expiry
    await db('lawyers').where('id', lawyer.id).update({
      subscription_cancelled: true,
      subscription_cancelled_at: new Date(),
      auto_renew: false
      // Keep subscription_tier and subscription_status active until expiry
    });
    
    console.log(`🚫 Subscription cancelled for lawyer ${lawyer.id}, will remain active until expiry`);
  }
};

// Update subscription status manually
const updateSubscriptionStatus = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const lawyerId = req.user.id;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }
    
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.metadata?.type === 'subscription' && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      const priceId = subscription.items.data[0].price.id;
      
      // Find plan in database using actual price ID
      const plan = await db('subscription_plans').where('stripe_price_id', priceId).first();
      let tier = 'professional'; // default
      
      if (plan) {
        tier = plan.name.toLowerCase();
        console.log(`✅ Found plan: ${plan.name} (${plan.billing_cycle})`);
      } else {
        // Fallback: determine tier from price amount
        const priceAmount = subscription.items.data[0].price.unit_amount;
        if (priceAmount >= 8000) { // $80+ is premium
          tier = 'premium';
        } else if (priceAmount >= 4000) { // $40+ is professional
          tier = 'professional';
        }
        console.log(`⚠️ Plan not in DB, using price: $${priceAmount/100} -> ${tier}`);
      }
      
      console.log(`🔄 Manually updating lawyer ${lawyerId} to ${tier} tier (priceId: ${priceId})`);
      
      // Calculate expiry date (1 month from now)
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      
      // Update lawyer subscription with REAL Stripe IDs
      await db('lawyers').where('id', lawyerId).update({
        stripe_subscription_id: session.subscription, // Real Stripe subscription ID
        stripe_customer_id: session.customer, // Real Stripe customer ID
        subscription_tier: tier,
        subscription_status: 'active',
        subscription_created_at: new Date(),
        subscription_expires_at: expiryDate,
        subscription_cancelled: false,
        auto_renew: true
      });
      
      console.log(`✅ Successfully updated lawyer ${lawyerId} to ${tier} tier`);
      res.json({ success: true, tier });
    } else {
      res.status(400).json({ error: 'Invalid session or not a subscription' });
    }
  } catch (error) {
    console.error('Manual subscription update error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Cancel subscription but keep active until expiry
const cancelSubscription = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const lawyer = await db('lawyers').where('id', lawyerId).first();
    
    if (!lawyer) {
      return res.status(404).json({ error: 'Lawyer not found' });
    }

    // If no stripe subscription ID or already cancelled, just mark as cancelled in DB
    if (!lawyer.stripe_subscription_id || lawyer.subscription_cancelled) {
      if (lawyer.subscription_cancelled) {
        return res.status(400).json({ error: 'Subscription is already cancelled' });
      }
      
      // Set expiry date to 1 month from now if not set
      const expiryDate = lawyer.subscription_expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      await db('lawyers').where('id', lawyerId).update({
        subscription_cancelled: true,
        subscription_cancelled_at: new Date(),
        auto_renew: false,
        subscription_expires_at: expiryDate
      });
      
      return res.json({ 
        success: true, 
        message: 'Subscription cancelled. Your membership will remain active until expiry date.',
        expires_at: expiryDate
      });
    }

    try {
      // Try to cancel the Stripe subscription at period end
      await stripe.subscriptions.update(lawyer.stripe_subscription_id, {
        cancel_at_period_end: true
      });
    } catch (stripeError) {
      console.log(`Stripe subscription ${lawyer.stripe_subscription_id} not found, marking as cancelled in DB only`);
      // If Stripe subscription doesn't exist, just update our database
    }

    // Set expiry date to 1 month from now if not set
    const expiryDate = lawyer.subscription_expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    // Mark as cancelled in our database but keep active until expiry
    await db('lawyers').where('id', lawyerId).update({
      subscription_cancelled: true,
      subscription_cancelled_at: new Date(),
      auto_renew: false,
      subscription_expires_at: expiryDate
    });

    res.json({ 
      success: true, 
      message: 'Subscription cancelled. Your membership will remain active until expiry date.',
      expires_at: expiryDate
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get subscription status with expiry information
const getSubscriptionStatus = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const lawyer = await db('lawyers')
      .select('subscription_tier', 'subscription_status', 'subscription_created_at', 
              'subscription_expires_at', 'subscription_cancelled', 'subscription_cancelled_at', 
              'auto_renew', 'stripe_subscription_id')
      .where('id', lawyerId)
      .first();

    if (!lawyer) {
      return res.status(404).json({ error: 'Lawyer not found' });
    }

    // Check if subscription has expired
    const now = new Date();
    const isExpired = lawyer.subscription_expires_at && new Date(lawyer.subscription_expires_at) < now;
    
    // If expired, update status to free
    if (isExpired && lawyer.subscription_tier !== 'free') {
      await db('lawyers').where('id', lawyerId).update({
        subscription_tier: 'free',
        subscription_status: 'expired',
        stripe_subscription_id: null
      });
      
      lawyer.subscription_tier = 'free';
      lawyer.subscription_status = 'expired';
    }

    const daysUntilExpiry = lawyer.subscription_expires_at 
      ? Math.ceil((new Date(lawyer.subscription_expires_at) - now) / (1000 * 60 * 60 * 24))
      : null;

    res.json({
      tier: lawyer.subscription_tier,
      status: lawyer.subscription_status,
      created_at: lawyer.subscription_created_at,
      expires_at: lawyer.subscription_expires_at,
      cancelled: !!lawyer.subscription_cancelled, // Convert to boolean
      cancelled_at: lawyer.subscription_cancelled_at,
      auto_renew: !!lawyer.auto_renew, // Convert to boolean
      days_until_expiry: daysUntilExpiry,
      is_expired: isExpired,
      has_active_stripe_subscription: !!lawyer.stripe_subscription_id
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Reactivate cancelled subscription
const reactivateSubscription = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const lawyer = await db('lawyers').where('id', lawyerId).first();
    
    if (!lawyer || !lawyer.stripe_subscription_id) {
      return res.status(400).json({ error: 'No subscription found to reactivate' });
    }

    if (!lawyer.subscription_cancelled) {
      return res.status(400).json({ error: 'Subscription is not cancelled' });
    }

    // Reactivate the Stripe subscription
    await stripe.subscriptions.update(lawyer.stripe_subscription_id, {
      cancel_at_period_end: false
    });

    // Update our database
    await db('lawyers').where('id', lawyerId).update({
      subscription_cancelled: false,
      subscription_cancelled_at: null,
      auto_renew: true
    });

    res.json({ 
      success: true, 
      message: 'Subscription reactivated successfully'
    });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Check and expire memberships (to be called by a cron job)
const checkExpiredMemberships = async () => {
  try {
    const now = new Date();
    const expiredLawyers = await db('lawyers')
      .where('subscription_expires_at', '<', now)
      .whereNot('subscription_tier', 'free');

    for (const lawyer of expiredLawyers) {
      await db('lawyers').where('id', lawyer.id).update({
        subscription_tier: 'free',
        subscription_status: 'expired',
        stripe_subscription_id: null
      });
      
      console.log(`⏰ Expired membership for lawyer ${lawyer.id}`);
    }

    return { expired_count: expiredLawyers.length };
  } catch (error) {
    console.error('Check expired memberships error:', error);
    throw error;
  }
};

module.exports = {
  createSubscriptionCheckout,
  createConsultationCheckout,
  createPaymentLinkCheckout,
  getSubscriptionPlans,
  getLawyerEarnings,
  createBillingPortalSession,
  getPaymentReceipt,
  handleWebhook,
  updateSubscriptionStatus,
  cancelSubscription,
  getSubscriptionStatus,
  reactivateSubscription,
  checkExpiredMemberships
};