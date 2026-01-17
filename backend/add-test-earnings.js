const db = require('./db');

async function addTestEarnings() {
  try {
    // Get the first lawyer (the one you just tested with)
    const lawyer = await db('lawyers').first();
    
    if (!lawyer) {
      console.log('No lawyers found');
      return;
    }

    console.log('Adding earnings for lawyer:', lawyer.name);

    // Check if earnings already exist
    const existingEarnings = await db('earnings').where('lawyer_id', lawyer.id).first();

    if (existingEarnings) {
      console.log('Earnings already exist:', existingEarnings);
    } else {
      // Insert earnings record
      await db('earnings').insert({
        lawyer_id: lawyer.id,
        available_balance: 1900.00,
        pending_balance: 0.00,
        total_earned: 1900.00,
        last_payout_date: null,
        created_at: new Date(),
        updated_at: new Date()
      });

      console.log('✅ Test earnings added successfully');
    }

    // Add some sample transactions for context
    const existingTransactions = await db('transactions').where('lawyer_id', lawyer.id).first();
    
    if (!existingTransactions) {
      await db('transactions').insert([
        {
          lawyer_id: lawyer.id,
          user_id: 1, // Assuming user ID 1 exists
          amount: 1000.00,
          platform_fee: 100.00,
          lawyer_earnings: 900.00,
          status: 'completed',
          stripe_payment_intent_id: 'pi_test_123',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          lawyer_id: lawyer.id,
          user_id: 1,
          amount: 1200.00,
          platform_fee: 120.00,
          lawyer_earnings: 1000.00,
          status: 'completed',
          stripe_payment_intent_id: 'pi_test_456',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      ]);

      console.log('✅ Sample transactions added');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error adding test data:', error);
    process.exit(1);
  }
}

addTestEarnings();