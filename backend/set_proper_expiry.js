require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

async function setProperExpiryDate() {
  try {
    const lawyer = await db('lawyers')
      .where('email', 'vabitar479@hudisk.com')
      .first();

    if (!lawyer) {
      console.log('Lawyer not found');
      return;
    }

    console.log(`Setting proper expiry date for: ${lawyer.name}`);
    console.log(`Current cancelled status: ${lawyer.subscription_cancelled}`);
    console.log(`Current cancelled at: ${lawyer.subscription_cancelled_at}`);
    
    // Since subscription was cancelled today (Jan 8, 2026), set expiry to end of current month
    // Typically subscriptions run for a full month from activation
    const cancelledDate = new Date(lawyer.subscription_cancelled_at);
    const expiryDate = new Date(cancelledDate);
    expiryDate.setMonth(expiryDate.getMonth() + 1); // Add 1 month from cancellation
    
    console.log(`Setting expiry date to: ${expiryDate}`);
    
    await db('lawyers').where('id', lawyer.id).update({
      subscription_expires_at: expiryDate,
      subscription_status: 'active' // Keep active until expiry
    });

    console.log('✅ Updated expiry date successfully');
    
    // Calculate days remaining
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    console.log(`Days remaining: ${daysRemaining}`);

    // Verify the update
    const updatedLawyer = await db('lawyers')
      .where('id', lawyer.id)
      .first();
    
    console.log('\n=== UPDATED STATUS ===');
    console.log(`Tier: ${updatedLawyer.subscription_tier}`);
    console.log(`Status: ${updatedLawyer.subscription_status}`);
    console.log(`Cancelled: ${updatedLawyer.subscription_cancelled}`);
    console.log(`Expires: ${updatedLawyer.subscription_expires_at}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

setProperExpiryDate();