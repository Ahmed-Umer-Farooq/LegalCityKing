const db = require('../db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createPaymentToLawyer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lawyer_id, amount, description } = req.body;

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        user_id: userId,
        lawyer_id: lawyer_id,
        description: description
      }
    });

    // Save transaction to database
    const [transactionId] = await db('transactions').insert({
      stripe_payment_id: paymentIntent.id,
      user_id: userId,
      lawyer_id: lawyer_id,
      amount: amount,
      platform_fee: amount * 0.05, // 5% platform fee
      lawyer_earnings: amount * 0.95,
      type: 'consultation',
      status: 'completed',
      description: description,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.json({
      success: true,
      data: {
        transaction_id: transactionId,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { createPaymentToLawyer };