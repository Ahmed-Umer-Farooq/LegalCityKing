require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

const captureRecentPayments = async () => {
  try {
    console.log('🔍 Looking for recent Stripe payments...');
    
    // Get recent checkout sessions from Stripe
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
      created: {
        gte: Math.floor(Date.now() / 1000) - (24 * 60 * 60) // Last 24 hours
      }
    });
    
    console.log(`Found ${sessions.data.length} recent sessions`);
    
    for (const session of sessions.data) {
      if (session.payment_status === 'paid') {
        console.log(`\n💳 Processing session: ${session.id}`);
        console.log(`Amount: $${session.amount_total / 100}`);
        console.log(`Customer: ${session.customer_details?.email}`);
        
        // Check if already in database
        const existing = await db('transactions')
          .where('stripe_payment_id', session.payment_intent)
          .first();
        
        if (existing) {
          console.log('✅ Already in database');
          continue;
        }
        
        // Find user by email
        const userEmail = session.customer_details?.email;
        let user = null;
        
        if (userEmail) {
          user = await db('users').where('email', userEmail).first();
        }
        
        // Get metadata and line items for service description
        const metadata = session.metadata || {};
        const lawyerId = metadata.lawyerId || 48; // Default to Ahmad Umer Farooq
        const amount = session.amount_total / 100;
        const platformFee = amount * 0.05;
        const lawyerEarnings = amount - platformFee;
        
        // Get service description from line items
        let serviceDescription = `Payment captured - $${amount}`;
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
          console.log('Could not fetch line items, using default description');
        }
        
        // Save to database
        const [transactionId] = await db('transactions').insert({
          stripe_payment_id: session.payment_intent || `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: user?.id || null,
          lawyer_id: lawyerId,
          amount: amount,
          platform_fee: platformFee,
          lawyer_earnings: lawyerEarnings,
          type: 'consultation',
          status: 'completed',
          description: serviceDescription,
          created_at: new Date(session.created * 1000),
          updated_at: new Date()
        });
        
        console.log(`✅ Saved transaction ID: ${transactionId}`);
        
        // Update lawyer earnings
        await db.raw(`
          INSERT INTO earnings (lawyer_id, total_earned, available_balance, created_at, updated_at)
          VALUES (?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
          total_earned = total_earned + ?,
          available_balance = available_balance + ?,
          updated_at = NOW()
        `, [lawyerId, lawyerEarnings, lawyerEarnings, lawyerEarnings, lawyerEarnings]);
      }
    }
    
    // Show all transactions for Ahmad Umer
    const userTransactions = await db('transactions')
      .select('transactions.*', 'lawyers.name as lawyer_name')
      .leftJoin('lawyers', 'transactions.lawyer_id', 'lawyers.id')
      .where('transactions.user_id', 50)
      .orderBy('transactions.created_at', 'desc');
    
    console.log(`\n✅ Ahmad Umer now has ${userTransactions.length} transactions:`);
    userTransactions.forEach((tx, i) => {
      console.log(`${i+1}. ${tx.description} - ${new Date(tx.created_at).toLocaleDateString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

captureRecentPayments();