const db = require('../db');

const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    console.log(`Fetching transactions for user ID: ${userId}, email: ${userEmail}`);
    
    // Get transactions by user ID first
    let transactions = await db('transactions')
      .select(
        'transactions.*',
        'lawyers.name as lawyer_name'
      )
      .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
      .where('transactions.user_id', userId)
      .orderBy('transactions.created_at', 'desc');
    
    // Also check for orphaned transactions by matching Stripe session emails
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const orphanedTransactions = await db('transactions')
      .select('transactions.*', 'lawyers.name as lawyer_name')
      .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
      .whereNull('transactions.user_id')
      .whereNotNull('transactions.stripe_payment_id')
      .orderBy('transactions.created_at', 'desc');
    
    // Check each orphaned transaction against Stripe
    for (const transaction of orphanedTransactions) {
      try {
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: transaction.stripe_payment_id,
          limit: 1
        });
        
        if (sessions.data.length > 0) {
          const sessionEmail = sessions.data[0].customer_details?.email;
          if (sessionEmail === userEmail) {
            transactions.push(transaction);
            // Auto-fix: assign this transaction to current user
            await db('transactions')
              .where('id', transaction.id)
              .update({ user_id: userId });
          }
        }
      } catch (error) {
        console.error(`Error checking transaction ${transaction.id}:`, error.message);
      }
    }
    
    // Sort all transactions by date
    transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    console.log(`Found ${transactions.length} transactions for user`);

    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      type: 'expense',
      description: t.description || `Payment to ${t.lawyer_name} (Lawyer)`,
      amount: parseFloat(t.amount),
      date: t.created_at,
      category: 'Lawyer Fees',
      status: t.status === 'completed' ? 'Paid' : t.status,
      lawyer: t.lawyer_name,
      payment_method: 'Stripe',
      transaction_type: t.type,
      stripe_payment_id: t.stripe_payment_id,
      platform_fee: parseFloat(t.platform_fee || 0),
      lawyer_earnings: parseFloat(t.lawyer_earnings || 0)
    }));
    
    console.log('Formatted transactions:', formattedTransactions.length);

    res.json({
      success: true,
      data: formattedTransactions,
      total: formattedTransactions.length,
      user_id: userId,
      user_email: userEmail
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getUserTransactions };