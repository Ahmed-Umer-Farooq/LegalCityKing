# Membership Cancellation and Expiry Implementation

## Overview
This implementation adds proper membership cancellation and expiry functionality to the Legal City platform. The key feature is that when a lawyer cancels their subscription through Stripe, the membership remains active until the expiry date (1 month from subscription start).

## Key Features

### 1. Membership Cancellation Property
- Added `subscription_cancelled` boolean field to track cancellation status
- Added `subscription_cancelled_at` timestamp to record when cancellation occurred
- Added `auto_renew` boolean to control automatic renewal

### 2. Membership Expiry System
- Added `subscription_expires_at` timestamp (set to 1 month from subscription start)
- Automatic expiry checking via cron jobs
- Membership remains active until expiry date even if cancelled in Stripe

### 3. New API Endpoints

#### Cancel Subscription
```
POST /api/stripe/cancel-subscription
```
- Cancels Stripe subscription but keeps membership active until expiry
- Sets `subscription_cancelled = true` and `auto_renew = false`
- Returns expiry date information

#### Get Subscription Status
```
GET /api/stripe/subscription-status
```
- Returns comprehensive subscription information including:
  - Current tier and status
  - Expiry date and days remaining
  - Cancellation status
  - Auto-renew setting

#### Reactivate Subscription
```
POST /api/stripe/reactivate-subscription
```
- Reactivates a cancelled subscription before expiry
- Sets `subscription_cancelled = false` and `auto_renew = true`

### 4. Automatic Expiry Management
- **Daily Cron Job**: Runs at midnight to check for expired memberships
- **Hourly Cron Job**: More frequent checking for immediate expiry handling
- Automatically downgrades expired memberships to 'free' tier

## Database Changes

### New Fields Added to `lawyers` Table:
```sql
subscription_cancelled BOOLEAN DEFAULT FALSE
subscription_cancelled_at TIMESTAMP NULL
subscription_expires_at TIMESTAMP NULL
auto_renew BOOLEAN DEFAULT TRUE
```

## Implementation Details

### 1. Stripe Webhook Updates
- Modified `handleCheckoutCompleted` to set expiry date (1 month from subscription)
- Updated `handleSubscriptionCanceled` to mark as cancelled but keep active
- Enhanced subscription status tracking

### 2. Cron Job System
- Created `utils/membershipCron.js` for automated expiry checking
- Integrated with server startup in `server.js`
- Logs all expiry actions for monitoring

### 3. Enhanced Profile API
- Updated lawyer dashboard profile endpoint to include subscription details
- Real-time expiry checking when profile is accessed
- Automatic status updates for expired memberships

## Usage Examples

### Frontend Integration
```javascript
// Check subscription status
const response = await fetch('/api/stripe/subscription-status', {
  headers: { Authorization: `Bearer ${token}` }
});
const subscription = await response.json();

// Display cancellation status
if (subscription.cancelled) {
  console.log(`Membership cancelled, expires in ${subscription.days_until_expiry} days`);
}

// Cancel subscription
const cancelResponse = await fetch('/api/stripe/cancel-subscription', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }
});
```

### Admin Monitoring
```javascript
// Check for expired memberships manually
const { checkExpiredMemberships } = require('./controllers/stripeController');
const result = await checkExpiredMemberships();
console.log(`Expired ${result.expired_count} memberships`);
```

## Benefits

1. **User-Friendly**: Lawyers keep access until their paid period ends
2. **Stripe Integration**: Proper handling of Stripe cancellation events
3. **Automatic Management**: No manual intervention needed for expiry
4. **Transparent**: Clear status information for users and admins
5. **Flexible**: Allows reactivation before expiry

## Testing

Run the test script to verify functionality:
```bash
node test_membership_system.js
```

## Installation Steps

1. **Run Migration**:
   ```bash
   npm run migrate
   ```

2. **Install Dependencies**:
   ```bash
   npm install node-cron
   ```

3. **Restart Server**:
   The cron jobs will start automatically when the server starts.

## Monitoring

- Check server logs for cron job execution
- Monitor Stripe webhook events
- Use admin endpoints to track subscription status
- Test cancellation and reactivation flows

This implementation ensures that the membership system works exactly as requested: cancellation is allowed through Stripe, but membership remains active until the natural expiry date of one month from subscription start.