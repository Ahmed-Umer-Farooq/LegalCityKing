const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');

// Webhook endpoint for Stripe Connect events
router.post('/connect', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payout.paid':
        await handlePayoutPaid(event.data.object);
        break;
      case 'payout.failed':
        await handlePayoutFailed(event.data.object);
        break;
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

async function handlePayoutPaid(payout) {
  console.log('Payout paid:', payout.id);
  
  // Update payout status in database
  await db('payouts')
    .where('stripe_payout_id', payout.id)
    .update({
      status: 'paid',
      completed_at: new Date(payout.arrival_date * 1000)
    });

  // Update lawyer earnings
  const payoutRecord = await db('payouts')
    .where('stripe_payout_id', payout.id)
    .first();

  if (payoutRecord) {
    await db('earnings')
      .where('lawyer_id', payoutRecord.lawyer_id)
      .update({
        pending_balance: db.raw('pending_balance - ?', [payoutRecord.amount]),
        last_payout_date: new Date(),
        updated_at: new Date()
      });
  }
}

async function handlePayoutFailed(payout) {
  console.log('Payout failed:', payout.id);
  
  // Update payout status
  await db('payouts')
    .where('stripe_payout_id', payout.id)
    .update({
      status: 'failed',
      failure_reason: payout.failure_message
    });

  // Return money to available balance
  const payoutRecord = await db('payouts')
    .where('stripe_payout_id', payout.id)
    .first();

  if (payoutRecord) {
    await db('earnings')
      .where('lawyer_id', payoutRecord.lawyer_id)
      .update({
        available_balance: db.raw('available_balance + ?', [payoutRecord.amount]),
        pending_balance: db.raw('pending_balance - ?', [payoutRecord.amount]),
        updated_at: new Date()
      });
  }
}

async function handleAccountUpdated(account) {
  console.log('Account updated:', account.id);
  
  // Update lawyer's Connect account status
  await db('lawyers')
    .where('stripe_connect_account_id', account.id)
    .update({
      connect_onboarding_complete: account.details_submitted,
      payouts_enabled: account.payouts_enabled,
      updated_at: new Date()
    });
}

module.exports = router;