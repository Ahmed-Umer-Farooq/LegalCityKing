const db = require('../db');

const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    console.log(`Fetching transactions for user ID: ${userId}, email: ${userEmail}`);
    
    // Get transactions by user ID or by email if user_id is null
    const transactions = await db('transactions')
      .select(
        'transactions.*',
        'lawyers.name as lawyer_name',
        'users.email as user_email'
      )
      .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
      .leftJoin('users', 'transactions.user_id', 'users.id')
      .where(function() {
        this.where('transactions.user_id', userId)
            .orWhere('users.email', userEmail);
      })
      .orderBy('transactions.created_at', 'desc');
    
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