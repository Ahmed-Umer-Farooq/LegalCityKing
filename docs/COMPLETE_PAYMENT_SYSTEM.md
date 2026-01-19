# Complete Payment System Documentation

## Overview

The Legal City Payment System is a comprehensive financial infrastructure that enables secure transactions between clients and lawyers, subscription management, and payout processing. Built on Stripe's robust payment platform, the system supports multiple payment types, subscription billing, and automated payout distribution.

## Key Features

- **Multiple Payment Types**: Subscriptions, consultations, payment links, and form purchases
- **Secure Processing**: PCI-compliant payment handling through Stripe
- **Subscription Management**: Flexible billing cycles with automatic renewals
- **Payout System**: Automated earnings distribution to lawyers via Stripe Connect
- **Payment Links**: Secure, shareable payment URLs for client billing
- **Transaction Tracking**: Complete audit trail of all financial activities
- **Platform Fees**: Automated fee collection and revenue management
- **Multi-currency Support**: USD-based transactions with future expansion capabilities

## System Architecture

### Technology Stack
- **Payment Processor**: Stripe API for all payment operations
- **Database**: MySQL with optimized financial transaction storage
- **Backend**: Node.js with Express and comprehensive payment controllers
- **Security**: JWT authentication with role-based payment access
- **Webhooks**: Real-time payment status updates and event handling
- **Connect Integration**: Stripe Connect for lawyer payout management

### Component Structure
```
Payment System/
├── Subscription Management
│   ├── Plan Configuration
│   ├── Billing Cycles
│   ├── Automatic Renewals
│   └── Cancellation Handling
├── Transaction Processing
│   ├── Payment Links
│   ├── Direct Payments
│   ├── Consultation Fees
│   └── Form Purchases
├── Payout Distribution
│   ├── Stripe Connect Integration
│   ├── Balance Management
│   ├── Payout Scheduling
│   └── Fee Deductions
├── Financial Analytics
│   ├── Revenue Tracking
│   ├── Earnings Reports
│   ├── Transaction History
│   └── Platform Metrics
└── Security & Compliance
    ├── PCI Compliance
    ├── Fraud Prevention
    ├── Audit Logging
    └── Data Encryption
```

## Core Payment Types

### 1. Subscription Payments

#### Subscription Plans
**Professional Plan ($49/month, $499/year):**
- Enhanced profile management
- Unlimited client messaging
- Blog management system
- Advanced reports & analytics
- Email support

**Premium Plan ($99/month, $999/year):**
- All Professional features
- Q&A answer management
- Verification badge system
- Forms management system
- Client management tools
- Priority phone support

#### Subscription Lifecycle
**Plan Activation:**
- Stripe Checkout session creation
- Customer and subscription setup
- Plan restrictions auto-application
- Welcome notifications

**Billing Management:**
- Automatic monthly/yearly renewals
- Failed payment handling
- Grace period management
- Account suspension for non-payment

**Cancellation Process:**
- Immediate cancellation with active period retention
- Auto-renewal disabling
- Pro-rated refunds for early cancellation
- Plan restriction reversion

### 2. Payment Links

#### Link Generation
**Security Features:**
- Unique 64-character secure IDs
- Client email verification
- Expiration timestamps
- Usage limits and tracking

**Link Properties:**
- Service description and pricing
- Client information association
- Expiration time configuration
- One-time use enforcement

#### Payment Processing
**Checkout Flow:**
- Secure Stripe Checkout integration
- Client authentication and verification
- Payment method collection
- Transaction completion confirmation

**Post-Payment Actions:**
- Transaction record creation
- Lawyer earnings calculation
- Platform fee deduction
- Referral reward processing

### 3. Direct Consultation Payments

#### Consultation Booking
**Payment Integration:**
- Direct Stripe Checkout for consultations
- Lawyer profile integration
- Service pricing display
- Instant payment confirmation

**Transaction Details:**
- Service type identification
- Lawyer earnings allocation
- Platform fee calculation
- Transaction categorization

### 4. Form Purchase Payments

#### Digital Form Sales
**Form Monetization:**
- Premium legal form downloads
- Category-based pricing
- Download tracking and limits
- Revenue attribution

## Stripe Integration Architecture

### Core Stripe Services

#### Stripe API Integration
```javascript
const stripeConfig = {
  apiVersion: '2023-10-16',
  typescript: false,
  maxNetworkRetries: 3,
  timeout: 30000
};

// Primary payment processing
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

#### Service Components
**Payment Intents:**
- Secure payment method collection
- PCI compliance handling
- Fraud detection integration
- Multi-step payment flows

**Checkout Sessions:**
- Hosted payment pages
- Customizable payment flows
- Success/failure URL handling
- Metadata attachment

**Customer Management:**
- Customer profile creation
- Payment method storage
- Billing address collection
- Subscription association

### Webhook Event Handling

#### Event Processing
**Supported Events:**
- `checkout.session.completed`: Payment completion
- `invoice.payment_succeeded`: Subscription renewal
- `customer.subscription.updated`: Plan changes
- `customer.subscription.deleted`: Cancellation handling

**Webhook Security:**
- Signature verification
- Event deduplication
- Idempotent processing
- Error handling and retries

## Database Schema

### Core Payment Tables

#### Transactions Table
```sql
CREATE TABLE transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stripe_payment_id VARCHAR(255) UNIQUE NOT NULL,
  user_id INT UNSIGNED NULL,
  lawyer_id INT UNSIGNED NULL,
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  lawyer_earnings DECIMAL(10,2) NOT NULL,
  type ENUM('consultation', 'hourly', 'document_review', 'retainer', 'subscription', 'payment_link') NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  description VARCHAR(255) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_lawyer (lawyer_id),
  INDEX idx_status (status),
  INDEX idx_type (type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE CASCADE
);
```

#### Earnings Table
```sql
CREATE TABLE earnings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lawyer_id INT UNSIGNED NOT NULL UNIQUE,
  total_earned DECIMAL(12,2) DEFAULT 0,
  available_balance DECIMAL(12,2) DEFAULT 0,
  pending_balance DECIMAL(12,2) DEFAULT 0,
  last_payout_date TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE CASCADE
);
```

#### Payment Links Table
```sql
CREATE TABLE payment_links (
  id INT PRIMARY KEY AUTO_INCREMENT,
  link_id VARCHAR(64) UNIQUE NOT NULL,
  lawyer_id INT UNSIGNED NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  client_email VARCHAR(255),
  client_name VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  status ENUM('active', 'disabled', 'expired') DEFAULT 'active',
  usage_count INT DEFAULT 0,
  max_uses INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_link_id (link_id),
  INDEX idx_lawyer (lawyer_id),
  INDEX idx_status (status),
  INDEX idx_expires_at (expires_at),
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE CASCADE
);
```

#### Subscription Plans Table
```sql
CREATE TABLE subscription_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  stripe_price_id VARCHAR(100) NOT NULL UNIQUE,
  price DECIMAL(8,2) NOT NULL,
  billing_period ENUM('monthly', 'yearly') DEFAULT 'monthly',
  features JSON NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Payouts Table
```sql
CREATE TABLE payouts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lawyer_id INT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  stripe_payout_id VARCHAR(100) UNIQUE,
  status ENUM('pending', 'processing', 'paid', 'failed') DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  failed_reason TEXT NULL,
  approved_by_admin_id INT UNSIGNED NULL,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_lawyer (lawyer_id),
  INDEX idx_status (status),
  INDEX idx_requested_at (requested_at),
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
);
```

## API Endpoints

### Subscription Management

#### Plan Operations
```javascript
// GET /api/stripe/subscription-plans
// Get all active subscription plans
const getPlans = async () => {
  const response = await api.get('/api/stripe/subscription-plans');
  return response.data; // Array of plan objects
};

// POST /api/stripe/create-subscription-checkout
// Create Stripe Checkout session for subscription
const createSubscriptionCheckout = async (priceId) => {
  const response = await api.post('/api/stripe/create-subscription-checkout', {
    priceId: 'price_1QdVJL5fbvco9iYvhJGKJGKJ' // Professional Monthly
  });
  return response.data; // { sessionId, url }
};
```

#### Subscription Management
```javascript
// GET /api/stripe/subscription-status
// Get current subscription status
const getSubscriptionStatus = async () => {
  const response = await api.get('/api/stripe/subscription-status');
  return response.data; // Subscription details with expiry info
};

// POST /api/stripe/cancel-subscription
// Cancel subscription (keeps active until expiry)
const cancelSubscription = async () => {
  const response = await api.post('/api/stripe/cancel-subscription');
  return response.data; // Cancellation confirmation
};

// POST /api/stripe/reactivate-subscription
// Reactivate cancelled subscription
const reactivateSubscription = async () => {
  const response = await api.post('/api/stripe/reactivate-subscription');
  return response.data; // Reactivation confirmation
};
```

### Payment Links

#### Link Management
```javascript
// POST /api/payment-links
// Create new payment link
const createPaymentLink = async (linkData) => {
  const response = await api.post('/api/payment-links', {
    service_name: 'Legal Consultation',
    amount: 150.00,
    description: 'Initial consultation fee',
    client_email: 'client@example.com',
    client_name: 'John Doe',
    expires_in_hours: 24
  });
  return response.data; // Link details with secure URL
};

// GET /api/payment-links
// Get lawyer's payment links
const getPaymentLinks = async (page = 1, limit = 10) => {
  const response = await api.get(`/api/payment-links?page=${page}&limit=${limit}`);
  return response.data; // Paginated link list
};
```

#### Link Processing
```javascript
// POST /api/stripe/create-payment-link-checkout
// Process payment link checkout
const processPaymentLink = async (linkId, userId) => {
  const response = await api.post('/api/stripe/create-payment-link-checkout', {
    linkId,
    userId
  });
  return response.data; // Stripe Checkout session
};
```

### Earnings and Payouts

#### Earnings Tracking
```javascript
// GET /api/stripe/lawyer-earnings
// Get lawyer's earnings summary
const getEarnings = async () => {
  const response = await api.get('/api/stripe/lawyer-earnings');
  return response.data; // Earnings and recent transactions
};
```

#### Stripe Connect Integration
```javascript
// POST /api/stripe-connect/create-account
// Create Stripe Connect account for payouts
const createConnectAccount = async () => {
  const response = await api.post('/api/stripe-connect/create-account');
  return response.data; // Account creation status
};

// GET /api/stripe-connect/onboarding-link
// Get Stripe Connect onboarding URL
const getOnboardingLink = async () => {
  const response = await api.get('/api/stripe-connect/onboarding-link');
  return response.data; // Onboarding URL for bank setup
};

// GET /api/stripe-connect/account-status
// Check Connect account status
const getAccountStatus = async () => {
  const response = await api.get('/api/stripe-connect/account-status');
  return response.data; // Account verification and payout status
};
```

#### Payout Management
```javascript
// POST /api/stripe-connect/request-payout
// Request payout to connected bank account
const requestPayout = async (amount) => {
  const response = await api.post('/api/stripe-connect/request-payout', {
    amount: 500.00
  });
  return response.data; // Payout request confirmation
};

// GET /api/stripe-connect/payout-history
// Get payout history
const getPayoutHistory = async () => {
  const response = await api.get('/api/stripe-connect/payout-history');
  return response.data; // Array of payout records
};
```

### Administrative Functions

#### Platform Analytics
```javascript
// GET /api/admin/payouts/earnings
// Get platform earnings summary (admin only)
const getPlatformEarnings = async () => {
  const response = await api.get('/api/admin/payouts/earnings');
  return response.data; // Today's, weekly, monthly earnings
};

// GET /api/admin/payouts/connected-accounts
// Get all connected Stripe accounts (admin only)
const getConnectedAccounts = async () => {
  const response = await api.get('/api/admin/payouts/connected-accounts');
  return response.data; // Lawyers with Connect account status
};
```

#### Payout Administration
```javascript
// GET /api/admin/payouts/pending
// Get pending payout requests (admin only)
const getPendingPayouts = async () => {
  const response = await api.get('/api/admin/payouts/pending');
  return response.data; // Pending payout requests with lawyer details
};

// POST /api/admin/payouts/:id/approve
// Approve payout request (admin only)
const approvePayout = async (payoutId) => {
  const response = await api.post(`/api/admin/payouts/${payoutId}/approve`);
  return response.data; // Approval confirmation
};
```

## Payment Flow Diagrams

### Subscription Payment Flow
```
1. User selects subscription plan
2. Frontend calls /api/stripe/create-subscription-checkout
3. Backend creates Stripe Checkout session
4. User redirected to Stripe Checkout
5. User completes payment
6. Stripe sends webhook to /api/stripe/webhook
7. Backend processes checkout.session.completed
8. Updates lawyer subscription status
9. Applies plan restrictions
10. User redirected to success page
```

### Payment Link Flow
```
1. Lawyer creates payment link via /api/payment-links
2. Link shared with client
3. Client accesses payment link
4. Frontend calls /api/stripe/create-payment-link-checkout
5. Backend validates link and creates Checkout session
6. Client completes payment on Stripe
7. Webhook processes payment completion
8. Transaction recorded in database
9. Lawyer earnings updated
10. Platform fees calculated
```

### Payout Flow
```
1. Lawyer requests payout via /api/stripe-connect/request-payout
2. Backend validates balance and minimum amount
3. Payout record created with 'pending' status
4. Admin reviews and approves payout
5. Stripe processes payout to connected bank account
6. Payout status updated to 'paid'
7. Lawyer balance updated
```

## Security Measures

### Payment Security
**PCI Compliance:**
- All card data handled by Stripe
- No sensitive data stored locally
- Token-based payment processing
- SSL encryption for all transactions

**Fraud Prevention:**
- Stripe Radar fraud detection
- Address verification system (AVS)
- Card verification value (CVV) checking
- Velocity limits and suspicious activity monitoring

### Access Control
**Authentication Requirements:**
- JWT token validation for all payment operations
- Role-based access control (lawyer vs user vs admin)
- Session management and timeout handling
- Multi-factor authentication for high-value operations

**Authorization Levels:**
- **Users**: Can make payments and view their transactions
- **Lawyers**: Can create payment links, view earnings, manage payouts
- **Admins**: Full access to all payment operations and analytics

### Data Protection
**Encryption Standards:**
- AES-256 encryption for stored sensitive data
- TLS 1.3 for all network communications
- Secure key management and rotation
- Database-level encryption for financial records

**Audit Logging:**
- Complete transaction audit trails
- User action logging for compliance
- Failed payment attempt tracking
- Administrative action recording

## Fee Structure and Revenue Model

### Platform Fees
**Transaction Fees:**
- **Payment Links**: 5% platform fee on all transactions
- **Consultations**: 5% platform fee on direct payments
- **Form Sales**: 5% platform fee on premium form purchases
- **Subscriptions**: No additional platform fees (Stripe handles billing)

**Fee Calculation:**
```javascript
const calculateFees = (amount, type) => {
  const platformFeeRate = 0.05; // 5%
  const platformFee = Math.round(amount * platformFeeRate * 100) / 100;
  const lawyerEarnings = amount - platformFee;

  return {
    originalAmount: amount,
    platformFee: platformFee,
    lawyerEarnings: lawyerEarnings,
    type: type
  };
};
```

### Revenue Streams
**Primary Revenue:**
- Platform fees on all transactions
- Subscription revenue from lawyer accounts
- Premium feature monetization
- Form and document sales

**Secondary Revenue:**
- Referral program commissions
- Premium support services
- Advanced analytics features
- Third-party integrations

## Monitoring and Analytics

### Transaction Monitoring
**Real-time Metrics:**
- Transaction success rates
- Payment processing times
- Failed payment analysis
- Geographic transaction distribution

**Performance Indicators:**
- Average transaction value
- Conversion rates by payment type
- Customer lifetime value
- Churn rates by subscription tier

### Financial Reporting
**Revenue Analytics:**
- Daily, weekly, monthly revenue reports
- Platform fee collection tracking
- Lawyer earnings distribution
- Payout processing efficiency

**Business Intelligence:**
- Customer acquisition cost analysis
- Payment method preferences
- Seasonal transaction patterns
- Market penetration metrics

## Error Handling and Recovery

### Payment Failures
**Common Failure Scenarios:**
- Insufficient funds
- Card declined by bank
- Expired payment methods
- Address verification failures

**Recovery Mechanisms:**
- Automatic retry logic for temporary failures
- Alternative payment method suggestions
- Customer notification and support
- Manual intervention for complex cases

### System Failures
**Webhook Processing:**
- Event deduplication to prevent double processing
- Retry logic for failed webhook deliveries
- Manual webhook replay capabilities
- Alert system for processing failures

**Database Consistency:**
- Transaction rollback on failures
- Data integrity validation
- Backup and recovery procedures
- Audit trail maintenance

## Integration Points

### External Services
**Stripe Ecosystem:**
- Stripe Checkout for payment processing
- Stripe Connect for payout management
- Stripe Billing for subscription handling
- Stripe Radar for fraud prevention

**Internal Platform:**
- User management system integration
- Lawyer profile and verification linkage
- Notification system for payment events
- Analytics platform for financial reporting

### Third-party Integrations
**Future Expansions:**
- Accounting software integration (QuickBooks, Xero)
- Tax reporting automation
- Multi-currency support
- International payment processing
- Mobile payment wallets

## Compliance and Legal

### Regulatory Compliance
**Financial Regulations:**
- PCI DSS compliance through Stripe
- Anti-money laundering (AML) procedures
- Know Your Customer (KYC) verification
- Transaction reporting requirements

**Data Protection:**
- GDPR compliance for EU users
- CCPA compliance for California residents
- Data retention policies
- User data export capabilities

### Legal Documentation
**Terms of Service:**
- Payment processing terms
- Refund and cancellation policies
- Dispute resolution procedures
- Liability limitations

**Privacy Policy:**
- Data collection and usage
- Payment information handling
- Third-party service disclosures
- User rights and choices

## Troubleshooting Guide

### Common Payment Issues

#### Subscription Problems

1. **Failed Subscription Renewal**
   - **Symptom**: Subscription status shows "past_due"
   - **Solution**: Update payment method via billing portal
   - **Prevention**: Enable auto-payment method updates

2. **Incorrect Plan Assignment**
   - **Symptom**: Wrong features available after subscription
   - **Solution**: Manual plan restriction update via admin
   - **Prevention**: Verify plan mapping in subscription webhook

3. **Cancellation Not Processed**
   - **Symptom**: Subscription still active after cancellation
   - **Solution**: Check Stripe dashboard for cancellation status
   - **Prevention**: Implement proper webhook event handling

#### Payment Link Issues

1. **Link Not Accessible**
   - **Symptom**: 403 Forbidden error on payment link
   - **Solution**: Verify client email matches link recipient
   - **Prevention**: Clear email validation during link creation

2. **Expired Links Still Working**
   - **Symptom**: Payments accepted on expired links
   - **Solution**: Implement strict expiration checking
   - **Prevention**: Add expiration validation in checkout process

3. **Duplicate Transactions**
   - **Symptom**: Multiple charges for same service
   - **Solution**: Implement payment link usage tracking
   - **Prevention**: Add transaction deduplication logic

#### Payout Problems

1. **Payouts Not Processing**
   - **Symptom**: Payouts stuck in "pending" status
   - **Solution**: Verify Stripe Connect account setup
   - **Prevention**: Implement account verification checks

2. **Incorrect Payout Amounts**
   - **Symptom**: Lawyer receives wrong payout amount
   - **Solution**: Recalculate earnings and adjust balances
   - **Prevention**: Implement automated balance validation

3. **Bank Transfer Failures**
   - **Symptom**: Payouts fail at bank level
   - **Solution**: Update bank account information
   - **Prevention**: Regular account verification reminders

### System Monitoring

#### Health Checks
```javascript
// Payment system health monitoring
const paymentHealthCheck = {
  stripeConnectivity: async () => {
    try {
      await stripe.balance.retrieve();
      return { status: 'healthy', latency: Date.now() - startTime };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  },

  databaseConnectivity: async () => {
    try {
      await db('transactions').select(1).limit(1);
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  },

  webhookProcessing: async () => {
    const recentWebhooks = await db('transactions')
      .where('created_at', '>', new Date(Date.now() - 3600000))
      .count();
    return { status: 'healthy', recentTransactions: recentWebhooks };
  }
};
```

#### Performance Optimization

**Database Optimization:**
- Transaction table partitioning by date
- Index optimization for common queries
- Connection pooling for high throughput
- Query result caching

**API Optimization:**
- Rate limiting implementation
- Response compression
- CDN integration for static assets
- API response caching

## Future Enhancements

### Advanced Features
- **Multi-currency Support**: International payment processing
- **Mobile Payment Integration**: Apple Pay, Google Pay support
- **Subscription Analytics**: Advanced billing insights
- **Automated Tax Calculation**: Tax-inclusive pricing
- **Payment Plans**: Installment payment options
- **Invoice Generation**: Automated billing documents

### Platform Expansions
- **Marketplace Integration**: Third-party service connections
- **API Access**: Developer payment API access
- **White-label Solutions**: Custom payment processing
- **Advanced Fraud Prevention**: Machine learning fraud detection
- **Real-time Notifications**: Instant payment confirmations
- **Bulk Payment Processing**: Mass payment operations

## Conclusion

The Legal City Payment System provides a robust, secure, and scalable financial infrastructure that supports the complete economic ecosystem of the legal platform. From subscription management to payout distribution, the system ensures fair compensation for legal professionals while maintaining platform sustainability through transparent fee structures and comprehensive financial tracking.

The integration with Stripe's enterprise-grade payment processing ensures PCI compliance, fraud prevention, and reliable transaction processing, while the comprehensive API and administrative tools provide full visibility and control over the financial operations of the platform.
