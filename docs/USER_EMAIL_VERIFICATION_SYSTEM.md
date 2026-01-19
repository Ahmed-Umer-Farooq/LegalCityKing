# User Email Verification System Documentation

## Overview

The User Email Verification System is a critical security feature that ensures users verify their email addresses during the registration process. This system prevents spam accounts, ensures account recovery capabilities, and provides a layer of security by confirming email ownership. The system supports both traditional email verification codes and OTP (One-Time Password) verification methods.

## Key Features

- **Email Verification Codes**: 6-digit numeric codes sent during registration
- **OTP Verification**: Alternative OTP-based verification for enhanced security
- **Cross-Platform Support**: Works for both users and lawyers
- **Expiration Handling**: Verification codes expire after use or time limits
- **Resend Functionality**: Users can request new verification codes
- **Security Logging**: All verification attempts are logged for security monitoring

## Database Schema

### Users Table - Email Verification Fields

```sql
-- Email verification status
email_verified TINYINT(1) DEFAULT 0 -- 0: not verified, 1: verified

-- Verification code storage
email_verification_code VARCHAR(6) -- 6-digit verification code

-- General verification flag
is_verified TINYINT(1) DEFAULT 0 -- Legacy field, used for email verification
```

### Lawyers Table - Email Verification Fields

```sql
-- Same fields as users table for consistency
email_verified TINYINT(1) DEFAULT 0
email_verification_code VARCHAR(6)
is_verified TINYINT(1) DEFAULT 0
```

## API Endpoints

All endpoints are prefixed with `/api/auth/` and are rate-limited.

### Email Verification Code Generation

**Automatic during registration:**
- User registration automatically generates and sends a 6-digit verification code
- Code is stored in the database and sent via email

```javascript
// Automatic code generation during registration
const verificationCode = crypto.randomInt(100000, 999999).toString();

// Store in database
email_verification_code: verificationCode,
email_verified: 0,
is_verified: 0
```

### Verify Email with Code
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

**Success Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

**Error Responses:**
```json
{
  "message": "Invalid verification code"
}
```

### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "OTP sent to your email"
}
```

### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "message": "OTP verified successfully. Email is now verified."
}
```

## Verification Flow

### Registration Flow

1. **User Registration**
   ```javascript
   // User submits registration form
   const response = await api.post('/auth/register-user', {
     name: "John Doe",
     email: "john@example.com",
     password: "password123"
   });
   ```

2. **Automatic Code Generation**
   - System generates 6-digit verification code
   - Code stored in database with user's email
   - Email sent to user with verification code

3. **Email Verification Required**
   - User redirected to verification page
   - Must enter code before accessing account

4. **Code Verification**
   ```javascript
   // User enters verification code
   await api.post('/auth/verify-email', {
     email: "john@example.com",
     code: "123456"
   });
   ```

5. **Account Activation**
   - `email_verified` set to `1`
   - `is_verified` set to `1`
   - `email_verification_code` cleared
   - User can now log in

### Login Flow with Verification Check

```javascript
const loginUser = async (req, res) => {
  // ... authentication logic ...

  // Check email verification
  if (!user.email_verified) {
    return res.status(401).json({
      message: 'Please verify your email first'
    });
  }

  // ... proceed with login ...
};
```

## Security Features

### Code Security
- **Random Generation**: Uses `crypto.randomInt()` for cryptographically secure codes
- **Single Use**: Codes are cleared after successful verification
- **Expiration**: Codes expire after verification or account updates
- **Length Validation**: Enforces 6-digit format

### Rate Limiting
- **Registration Rate Limiting**: Prevents spam account creation
- **OTP Rate Limiting**: Limits OTP request frequency
- **Verification Attempts**: Limited verification attempts per time window

### Input Validation
- **Email Format**: Strict email regex validation
- **Code Format**: Must be exactly 6 digits
- **SQL Injection Prevention**: Parameterized queries

### Audit Logging
- **Verification Attempts**: All verification attempts logged
- **Success/Failure Tracking**: Comprehensive audit trail
- **Security Monitoring**: Failed attempts flagged for monitoring

## Frontend Components

### VerifyEmail Component
Located at `Frontend/src/pages/auth/VerifyEmail.js`

**Features:**
- 6-digit OTP input component
- Real-time validation
- Resend functionality with countdown
- Error handling and user feedback
- Responsive design

**Key Methods:**
```javascript
const handleSubmit = async () => {
  try {
    await api.post('/auth/verify-email', { email, code });
    toast.success('Email verified successfully!');
    onVerified(); // Callback to parent component
  } catch (error) {
    setErrors({ code: 'Invalid verification code' });
  }
};

const handleResendOTP = async () => {
  await api.post('/auth/send-otp', { email });
  setCountdown(60); // 60 second cooldown
};
```

## Email Templates

### Verification Email Template
```
Subject: Verify Your Legal City Account

Dear [User Name],

Welcome to Legal City! To complete your registration, please verify your email address by entering the following 6-digit code:

[VERIFICATION CODE]

This code will expire in 10 minutes for security reasons.

If you didn't create an account with Legal City, please ignore this email.

Best regards,
Legal City Team
```

### OTP Email Template
```
Subject: Your Legal City OTP

Your One-Time Password (OTP) for Legal City is:

[OTP CODE]

This OTP is valid for 10 minutes.

If you didn't request this OTP, please contact our support team immediately.
```

## Error Handling

### Common Error Scenarios

#### Invalid Verification Code
```json
{
  "message": "Invalid verification code"
}
```

#### Expired Code
```json
{
  "message": "Verification code has expired"
}
```

#### Email Not Found
```json
{
  "message": "No account found with this email"
}
```

#### Rate Limit Exceeded
```json
{
  "message": "Too many requests. Please try again later."
}
```

#### Already Verified
```json
{
  "message": "Email is already verified"
}
```

## Integration Points

### Authentication Middleware
```javascript
const login = async (req, res) => {
  // ... find user ...

  // Email verification check
  const isVerified = user.email_verified === 1 || user.email_verified === true;
  if (!isVerified) {
    return res.status(403).json({
      error: 'Please verify your email first'
    });
  }

  // ... proceed with authentication ...
};
```

### OAuth Integration
- Google OAuth users automatically have `email_verified: 1`
- No additional verification required for OAuth accounts
- Maintains security while improving user experience

### Password Reset Integration
- Uses same OTP system for password reset verification
- Separate OTP storage to prevent conflicts
- 10-minute expiration for security

## Monitoring and Analytics

### Verification Metrics
- **Success Rate**: Percentage of successful verifications
- **Failure Rate**: Failed verification attempts
- **Resend Rate**: OTP resend frequency
- **Time to Verify**: Average time from registration to verification

### Security Monitoring
- **Suspicious Patterns**: Multiple failed attempts from same IP
- **Rate Limit Hits**: Accounts hitting rate limits
- **Expired Codes**: High rate of expired code usage

## Usage Examples

### Frontend Verification Flow
```javascript
// After successful registration
const handleRegistrationSuccess = () => {
  navigate('/verify-email', {
    state: { email: formData.email }
  });
};

// In VerifyEmail component
const handleVerification = async () => {
  try {
    await api.post('/auth/verify-email', {
      email: email,
      code: verificationCode
    });

    // Redirect to login or dashboard
    navigate('/login', {
      state: { message: 'Email verified! Please log in.' }
    });
  } catch (error) {
    setError('Invalid verification code');
  }
};
```

### Backend Verification Logic
```javascript
const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  // Check both users and lawyers tables
  let user = await db('users')
    .where({ email, email_verification_code: code })
    .first();

  if (!user) {
    user = await db('lawyers')
      .where({ email, email_verification_code: code })
      .first();
  }

  if (!user) {
    return res.status(400).json({
      message: 'Invalid verification code'
    });
  }

  // Update verification status
  const table = user.registration_id ? 'lawyers' : 'users';
  await db(table)
    .where({ id: user.id })
    .update({
      email_verified: 1,
      email_verification_code: null,
      is_verified: 1
    });

  res.json({ message: 'Email verified successfully' });
};
```

## Troubleshooting

### Common Issues

1. **Emails not received**
   - Check spam/junk folder
   - Verify email address is correct
   - Contact support if issue persists

2. **Codes not working**
   - Ensure code is entered exactly (no spaces)
   - Check for typos in email address
   - Try resending the code

3. **Rate limiting**
   - Wait before requesting another code
   - Contact support for account unlock if needed

### Debug Commands

Check verification status:
```sql
SELECT email, email_verified, email_verification_code, is_verified
FROM users WHERE email = 'user@example.com';
```

Clear verification code (for testing):
```sql
UPDATE users SET email_verification_code = NULL WHERE email = 'user@example.com';
```

Check OTP storage (development only):
```javascript
console.log('Current OTPs:', Array.from(otpStore.entries()));
```

## Future Enhancements

- **SMS Verification**: Add SMS as alternative to email
- **Biometric Verification**: Integrate device biometrics
- **Advanced Security**: Risk-based verification requirements
- **Bulk Verification**: Admin tools for bulk email verification
- **Verification Analytics**: Detailed analytics dashboard
- **Multi-factor Authentication**: Expand to full MFA system

## Conclusion

The User Email Verification System provides essential security and user experience benefits by ensuring email ownership and preventing fraudulent accounts. The system is designed to be user-friendly while maintaining high security standards through proper validation, rate limiting, and audit logging.
