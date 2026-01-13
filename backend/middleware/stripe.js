const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { logger, auditLog, verifyStripeSignature } = require('./security');
const { requirePaymentAccess } = require('./auth');
const { validatePayment } = require('./validation');

// Enhanced Stripe payment processing with security
const processSecurePayment = async (req, res, next) => {
  try {
    const { amount, currency, description, customer_id, payment_method } = req.body;
    
    // Additional security validations
    if (amount > 100000) { // $1000+ requires additional verification
      auditLog('high_value_payment_attempt', {
        userId: req.user.id,
        amount,
        currency,
        ip: req.ip
      });
      
      // Could add additional verification steps here
    }
    
    // Rate limiting for payment attempts
    const recentPayments = await checkRecentPaymentAttempts(req.user.id, req.ip);
    if (recentPayments > 5) {
      auditLog('payment_rate_limit_exceeded', {
        userId: req.user.id,
        attempts: recentPayments,
        ip: req.ip
      });
      
      return res.status(429).json({ 
        error: 'Too many payment attempts. Please try again later.' 
      });
    }
    
    // Create payment intent with enhanced metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency || 'usd',
      description,
      metadata: {
        user_id: req.user.id,
        user_role: req.user.role,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      },
      automatic_payment_methods: {
        enabled: true
      }
    });
    
    auditLog('payment_intent_created', {
      userId: req.user.id,
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
      ip: req.ip
    });
    
    req.paymentIntent = paymentIntent;
    next();
    
  } catch (error) {
    logger.error('Payment processing error:', error);
    auditLog('payment_processing_error', {
      userId: req.user?.id,
      error: error.message,
      ip: req.ip
    });
    
    res.status(500).json({ 
      error: 'Payment processing failed',
      code: 'PAYMENT_ERROR'
    });
  }
};

// Secure webhook handler
const handleStripeWebhook = async (req, res, next) => {
  try {
    const event = req.stripeEvent; // Set by verifyStripeSignature middleware
    
    auditLog('stripe_webhook_received', {
      eventType: event.type,
      eventId: event.id,
      ip: req.ip
    });
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object, event.type);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePayment(event.data.object);
        break;
        
      default:
        logger.info('Unhandled webhook event type:', event.type);
    }
    
    res.json({ received: true });
    
  } catch (error) {
    logger.error('Webhook processing error:', error);
    auditLog('webhook_processing_error', {
      error: error.message,
      eventType: req.stripeEvent?.type,
      ip: req.ip
    });
    
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Payment success handler
const handlePaymentSuccess = async (paymentIntent) => {
  try {
    const db = require('../db');
    
    const userId = paymentIntent.metadata.user_id;
    const amount = paymentIntent.amount / 100; // Convert from cents
    
    // Record successful payment
    await db('user_transactions').insert({
      user_id: userId,
      stripe_payment_intent_id: paymentIntent.id,
      amount,
      currency: paymentIntent.currency,
      status: 'completed',
      description: paymentIntent.description,
      created_at: new Date()
    });
    
    auditLog('payment_completed', {
      userId,
      paymentIntentId: paymentIntent.id,
      amount,
      currency: paymentIntent.currency
    });
    
    // Update user subscription if applicable
    if (paymentIntent.description?.includes('subscription')) {
      await updateUserSubscription(userId, paymentIntent);
    }
    
  } catch (error) {
    logger.error('Payment success handling error:', error);
  }
};

// Payment failure handler
const handlePaymentFailure = async (paymentIntent) => {
  try {
    const db = require('../db');
    
    const userId = paymentIntent.metadata.user_id;
    
    // Record failed payment
    await db('user_transactions').insert({
      user_id: userId,
      stripe_payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: 'failed',
      description: paymentIntent.description,
      failure_reason: paymentIntent.last_payment_error?.message,
      created_at: new Date()
    });
    
    auditLog('payment_failed', {
      userId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      reason: paymentIntent.last_payment_error?.message
    });
    
  } catch (error) {
    logger.error('Payment failure handling error:', error);
  }
};

// Subscription change handler
const handleSubscriptionChange = async (subscription, eventType) => {
  try {
    const db = require('../db');
    
    const customerId = subscription.customer;
    
    // Find user by Stripe customer ID
    const user = await db('users')
      .where('stripe_customer_id', customerId)
      .orWhere('stripe_customer_id', customerId)
      .first();
    
    if (!user) {
      logger.warn('User not found for subscription change:', customerId);
      return;
    }
    
    const subscriptionData = {
      user_id: user.id,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      updated_at: new Date()
    };
    
    if (eventType === 'customer.subscription.created') {
      await db('user_subscriptions').insert({
        ...subscriptionData,
        created_at: new Date()
      });
    } else {
      await db('user_subscriptions')
        .where('stripe_subscription_id', subscription.id)
        .update(subscriptionData);
    }
    
    auditLog('subscription_updated', {
      userId: user.id,
      subscriptionId: subscription.id,
      status: subscription.status,
      eventType
    });
    
  } catch (error) {
    logger.error('Subscription change handling error:', error);
  }
};

// Invoice payment handler
const handleInvoicePayment = async (invoice) => {
  try {
    const db = require('../db');
    
    auditLog('invoice_payment_received', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency
    });
    
    // Additional invoice processing logic here
    
  } catch (error) {
    logger.error('Invoice payment handling error:', error);
  }
};

// Helper function to check recent payment attempts
const checkRecentPaymentAttempts = async (userId, ip) => {
  try {
    const db = require('../db');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const attempts = await db('user_transactions')
      .where('user_id', userId)
      .where('created_at', '>', oneHourAgo)
      .count('id as count')
      .first();
    
    return attempts.count || 0;
  } catch (error) {
    logger.error('Error checking payment attempts:', error);
    return 0;
  }
};

// Helper function to update user subscription
const updateUserSubscription = async (userId, paymentIntent) => {
  try {
    const db = require('../db');
    
    // Logic to update user subscription based on payment
    // This would depend on your specific subscription model
    
    auditLog('subscription_payment_processed', {
      userId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100
    });
    
  } catch (error) {
    logger.error('Subscription update error:', error);
  }
};

// Create secure customer
const createSecureCustomer = async (req, res, next) => {
  try {
    const { email, name } = req.body;
    
    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });
    
    let customer;
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      auditLog('existing_customer_found', {
        userId: req.user.id,
        customerId: customer.id,
        email
      });
    } else {
      customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          user_id: req.user.id,
          created_by: 'legal_city_api',
          ip_address: req.ip
        }
      });
      
      auditLog('customer_created', {
        userId: req.user.id,
        customerId: customer.id,
        email
      });
    }
    
    req.stripeCustomer = customer;
    next();
    
  } catch (error) {
    logger.error('Customer creation error:', error);
    res.status(500).json({ error: 'Customer creation failed' });
  }
};

module.exports = {
  processSecurePayment,
  handleStripeWebhook,
  createSecureCustomer,
  verifyStripeSignature,
  // Individual handlers for testing
  handlePaymentSuccess,
  handlePaymentFailure,
  handleSubscriptionChange
};