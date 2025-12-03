require('dotenv').config();
const db = require('./db');

async function addBillingCycleColumn() {
  try {
    console.log('🔄 Adding billing_cycle column to subscription_plans...\n');
    
    // Check if column exists
    const hasColumn = await db.schema.hasColumn('subscription_plans', 'billing_cycle');
    
    if (!hasColumn) {
      await db.schema.table('subscription_plans', function(table) {
        table.string('billing_cycle').defaultTo('monthly');
      });
      console.log('✅ Added billing_cycle column');
    } else {
      console.log('✅ billing_cycle column already exists');
    }
    
    // Update the values
    await db('subscription_plans')
      .where('price', '>', 400)
      .update({ billing_cycle: 'yearly' });
    
    await db('subscription_plans')
      .where('price', '<', 400)
      .update({ billing_cycle: 'monthly' });
    
    console.log('✅ Updated billing cycles');
    
    // Show final plans
    const plans = await db('subscription_plans').select('*');
    console.log('\n📋 Final subscription plans:');
    plans.forEach(plan => {
      console.log(`- ${plan.name}: $${plan.price}/${plan.billing_cycle} (${plan.stripe_price_id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

addBillingCycleColumn();