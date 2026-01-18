# Plan Restrictions System Documentation

## Overview
The Plan Restrictions System automatically manages feature access for lawyers based on their subscription tier (Free, Professional, Premium). It provides both automatic updates via webhooks and manual admin control.

## System Architecture

### Core Components
1. **Plan Templates** (`backend/utils/planTemplates.js`) - Defines restrictions for each tier
2. **Automatic Updates** - Stripe webhooks, registration, expiration handlers
3. **Manual Admin Control** - Admin dashboard interface
4. **Enforcement** - Frontend and backend restriction checking

## Plan Templates Configuration

### File Location
```
backend/utils/planTemplates.js
```

### Current Tier Configuration
- **Free**: 14 features blocked (only home, profile, subscription allowed)
- **Professional**: 13 features enabled (only forms blocked)
- **Premium**: All 14 features enabled

### Available Features
```javascript
{
  messages: boolean,        // Chat/messaging system
  contacts: boolean,        // Contact management
  calendar: boolean,        // Calendar/scheduling
  payment_records: boolean, // Payment tracking
  tasks: boolean,          // Task management
  documents: boolean,      // Document storage
  reports: boolean,        // Analytics/reports
  blogs: boolean,          // Blog creation
  forms: boolean,          // Legal forms (premium only)
  payouts: boolean,        // Payout requests
  payment_links: boolean,  // Payment link generation
  qa_answers: boolean,     // Q&A participation
  ai_analyzer: boolean,    // AI document analysis
  quick_actions: boolean   // Dashboard quick actions
}
```

## How to Modify Restrictions

### 1. Edit Plan Templates
```javascript
// Example: Make AI Analyzer premium-only
const PLAN_TEMPLATES = {
  free: {
    ai_analyzer: false,    // Blocked
    // ... other features
  },
  professional: {
    ai_analyzer: false,    // Blocked for pro too
    // ... other features
  },
  premium: {
    ai_analyzer: true,     // Only premium gets access
    // ... other features
  }
};
```

### 2. Feature Access Levels
- `false` = Feature blocked (shows PRO badge, requires upgrade)
- `true` = Feature allowed (full access)

### 3. Common Restriction Patterns
```javascript
// Free tier - minimal access
free: {
  messages: false,
  contacts: false,
  // Only basic features allowed
}

// Professional tier - most features
professional: {
  messages: true,
  contacts: true,
  forms: false,  // Keep some premium-only
}

// Premium tier - full access
premium: {
  // All features: true
}
```

## Automatic Update Triggers

### 1. New Lawyer Registration
**File**: `backend/controllers/lawyerController.js`
```javascript
// Auto-applies free tier restrictions
const restrictions = getPlanRestrictions('free');
```

### 2. Stripe Webhook Events
**File**: `backend/controllers/stripeController.js`
```javascript
// Auto-updates on subscription changes
await updateLawyerPlanRestrictions(lawyerId, newTier, db);
```

### 3. Subscription Expiration
**Trigger**: When subscription expires, reverts to free tier restrictions

## Manual Admin Control

### Admin Dashboard Access
1. Navigate to: **Admin Dashboard → Subscription Management**
2. Click: **"Plan Restrictions"** tab
3. Modify: Check/uncheck features for each tier
4. Save: Click **"Save Changes"** to apply to all lawyers

### Bulk Updates
The admin interface can update restrictions for all lawyers of a specific tier simultaneously.

## Restriction Enforcement

### Frontend Enforcement
**File**: `Frontend/src/utils/restrictionChecker.js`
```javascript
// Checks if feature is allowed
const isFeatureAllowed = (feature, userRestrictions) => {
  return userRestrictions[feature] === true;
};
```

### Backend Enforcement
**File**: `backend/middleware/featureAccess.js`
```javascript
// API-level restriction checking
const checkFeatureAccess = (feature) => {
  // Validates access before processing requests
};
```

## Database Schema

### Lawyers Table
```sql
plan_restrictions TEXT  -- JSON string of feature permissions
subscription_tier VARCHAR(50)  -- 'free', 'professional', 'premium'
```

### Storage Format
```json
{
  "messages": true,
  "contacts": false,
  "calendar": true
}
```

## Testing Changes

### Test Script
**File**: `backend/test-auto-plan-restrictions.js`
```bash
node backend/test-auto-plan-restrictions.js
```

### Expected Output
```
Free Plan: 14 blocked features
Professional Plan: 13 enabled, 1 blocked
Premium Plan: 14 enabled features
```

## Best Practices

### 1. Feature Graduation
```javascript
// Logical progression from free → pro → premium
free: { feature: false },
professional: { feature: true },
premium: { feature: true }
```

### 2. Premium Exclusives
```javascript
// Keep some features premium-only for revenue
professional: { forms: false },
premium: { forms: true }
```

### 3. Core Features
```javascript
// Always allow essential features
all_tiers: {
  home: true,
  profile: true,
  subscription: true
}
```

## Troubleshooting

### Issue: Changes Not Applied
**Solution**: Restart server after modifying `planTemplates.js`

### Issue: User Still Restricted
**Solution**: Check if user's `plan_restrictions` field was updated in database

### Issue: Frontend Shows Wrong Access
**Solution**: Verify `restrictionChecker.js` is using latest user data

## API Endpoints

### Get Plan Restrictions
```
GET /admin/plan-restrictions
```

### Update Bulk Restrictions
```
POST /admin/plan-restrictions-bulk
Body: { tier: 'professional', restrictions: {...} }
```

### Update Individual Lawyer
```javascript
updateLawyerPlanRestrictions(lawyerId, newTier, db)
```

## Security Notes

- Restrictions enforced at both frontend (UX) and backend (security)
- Admin restrictions override plan restrictions
- Verification requirements still apply regardless of plan
- All restriction changes logged for audit trail

## Future Enhancements

1. **Custom Plans**: Allow admins to create custom restriction sets
2. **Feature Usage Analytics**: Track which restricted features users attempt to access
3. **Gradual Rollout**: A/B test different restriction configurations
4. **Time-based Restrictions**: Temporary feature access or trials