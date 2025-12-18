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
      success_url: `${process.env.FRONTEND_URL}/lawyer-dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
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

    const platformFee = Math.round(amount * 0.05 * 100); // 5% platform fee
    const lawyerEarnings = amount * 100 - platformFee;

    const session = await stripe.checkout.sessions.create({
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
    });

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
    
    let earnings = await db('earnings').where('lawyer_id', lawyerId).first();
    if (!earnings) {
      await db('earnings').insert({ lawyer_id: lawyerId });
      earnings = await db('earnings').where('lawyer_id', lawyerId).first();
    }

    const recentTransactions = await db('transactions')
      .where('lawyer_id', lawyerId)
      .where('status', 'completed')
      .orderBy('created_at', 'desc')
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
  
  if (metadata.type === 'subscription') {
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const priceId = subscription.items.data[0].price.id;
    
    const plan = await db('subscription_plans').where('stripe_price_id', priceId).first();
    const tier = plan?.name.toLowerCase() || 'professional';
    
    await db('lawyers').where('id', metadata.lawyerId).update({
      stripe_subscription_id: session.subscription,
      subscription_tier: tier,
      subscription_status: 'active',
      subscription_created_at: new Date()
    });
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
    
    await db('transactions').insert({
      stripe_payment_id: session.payment_intent,
      user_id: userId,
      lawyer_id: metadata.lawyerId,
      amount: session.amount_total / 100,
      platform_fee: platformFee,
      lawyer_earnings: lawyerEarnings,
      type: 'consultation',
      status: 'completed',
      description: 'Legal consultation payment'
    });
    
    console.log(`💰 Transaction saved: $${session.amount_total / 100} to lawyer ${metadata.lawyerId}`);

    // Update lawyer earnings
    await db.raw(`
      INSERT INTO earnings (lawyer_id, total_earned, available_balance, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
      total_earned = total_earned + ?,
      available_balance = available_balance + ?,
      updated_at = NOW()
    `, [metadata.lawyerId, lawyerEarnings, lawyerEarnings, lawyerEarnings, lawyerEarnings]);
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
    await db('lawyers').where('id', lawyer.id).update({
      subscription_tier: 'free',
      subscription_status: 'canceled',
      stripe_subscription_id: null
    });
  }
};

module.exports = {
  createSubscriptionCheckout,
  createConsultationCheckout,
  getSubscriptionPlans,
  getLawyerEarnings,
  createBillingPortalSession,
  getPaymentReceipt,
  handleWebhook
};