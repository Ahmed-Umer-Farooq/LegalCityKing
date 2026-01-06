require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

async function setupStripeProducts() {
  try {
    console.log('🔄 Setting up Stripe products and prices...');
    
    // Create Professional Product
    const professionalProduct = await stripe.products.create({
      name: 'Professional Plan',
      description: 'Enhanced profile management, unlimited client messaging, blog management system, advanced reports & analytics, email support',
      metadata: {
        plan_type: 'professional'
      }
    });
    
    // Create Premium Product
    const premiumProduct = await stripe.products.create({
      name: 'Premium Plan',
      description: 'All Professional features plus Q&A answer management, verification badge system, forms management system, client management tools, priority phone support',
      metadata: {
        plan_type: 'premium'
      }
    });
    
    console.log('✅ Created products');
    
    // Create Professional Monthly Price
    const professionalMonthly = await stripe.prices.create({
      product: professionalProduct.id,
      unit_amount: 4900, // $49.00
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_type: 'professional',
        billing_cycle: 'monthly'
      }
    });
    
    // Create Professional Yearly Price
    const professionalYearly = await stripe.prices.create({
      product: professionalProduct.id,
      unit_amount: 4165, // $41.65 (15% discount)
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_type: 'professional',
        billing_cycle: 'yearly'
      }
    });
    
    // Create Premium Monthly Price
    const premiumMonthly = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 9900, // $99.00
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_type: 'premium',
        billing_cycle: 'monthly'
      }
    });
    
    // Create Premium Yearly Price
    const premiumYearly = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 8415, // $84.15 (15% discount)
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_type: 'premium',
        billing_cycle: 'yearly'
      }
    });
    
    console.log('✅ Created prices');
    
    // Update database with actual Stripe price IDs
    await db('subscription_plans').where({ name: 'Professional', billing_cycle: 'monthly' })
      .update({ stripe_price_id: professionalMonthly.id });
    
    await db('subscription_plans').where({ name: 'Professional', billing_cycle: 'yearly' })
      .update({ stripe_price_id: professionalYearly.id });
    
    await db('subscription_plans').where({ name: 'Premium', billing_cycle: 'monthly' })
      .update({ stripe_price_id: premiumMonthly.id });
    
    await db('subscription_plans').where({ name: 'Premium', billing_cycle: 'yearly' })
      .update({ stripe_price_id: premiumYearly.id });
    
    console.log('✅ Updated database with Stripe price IDs');
    
    // Display the results
    const plans = await db('subscription_plans').select('*');
    console.log('📋 Updated plans:');
    plans.forEach(plan => {
      console.log(`  ${plan.name} (${plan.billing_cycle}): ${plan.stripe_price_id} - $${plan.price}`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error);
  } finally {
    process.exit(0);
  }
}

setupStripeProducts();