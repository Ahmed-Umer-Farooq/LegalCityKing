# Legal City Backend - Complete Overview

This document provides a comprehensive overview of the Legal City backend, including all files, APIs, database schema, and implementation details. This single file gives complete context for understanding and working with the backend.

## Tech Stack and Dependencies

### Runtime & Framework
- **Node.js** with **Express.js** (v5.1.0)
- **Knex.js** for database operations and migrations
- **MySQL2** for database connectivity

### Authentication & Security
- **JWT (jsonwebtoken)** for token-based authentication
- **Passport.js** with Google OAuth2 and Facebook OAuth strategies
- **bcryptjs** for password hashing
- **express-session** for OAuth session management
- **express-rate-limit** for rate limiting

### Email & Communication
- **Nodemailer** for email sending (Gmail service)

### Utilities
- **cors** for cross-origin resource sharing
- **crypto** for OTP generation
- **dotenv** for environment variable management

### Development
- **express-rate-limit** for API rate limiting

## Project Structure

```
backend/
├── server.js                 # Main application entry point
├── package.json              # Dependencies and scripts
├── knexfile.js              # Database configuration
├── db.js                    # Knex database instance
├── .env                     # Environment variables (not in repo)
├── AI_ONBOARDING.md         # Quick start guide for AIs
├── registration_apis.md     # API documentation for registration
├── TODO.md                  # Current tasks and progress
├── config/
│   └── passport.js          # OAuth strategies (Google, Facebook)
├── controllers/
│   ├── authController.js    # Authentication logic (login, OTP, email verification)
│   ├── userController.js    # User registration and profile management
│   ├── lawyerController.js  # Lawyer registration, login, and directory
│   └── adminController.js   # Admin functions (lawyer verification)
├── routes/
│   ├── auth.js              # Authentication routes (/api/auth/*)
│   ├── admin.js             # Admin routes (/api/admin/*)
│   └── lawyers.js           # Lawyer directory routes (/api/lawyers/*)
├── migrations/              # Database schema migrations
│   ├── 20231201000000_create_users_table.js
│   ├── 20231201000001_create_lawyers_table.js
│   ├── 20241201000002_add_missing_columns_to_users_table.js
│   ├── 20241201000003_add_missing_columns_to_lawyers_table.js
│   ├── 20241201000004_add_lawyer_directory_columns.js
│   ├── 20241201000005_insert_sample_lawyers.js
│   ├── 20251029094033_add_otp_expiry.js
│   └── 20251030000100_add_oauth_and_role_columns_to_users.js
└── utils/
    ├── token.js             # JWT token generation and verification
    ├── mailer.js            # Email sending utilities
    ├── middleware.js        # Authentication and admin middleware
    ├── limiter.js           # Rate limiting configuration
    └── validator.js         # Input validation functions
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  username VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email_verification_code VARCHAR(255),
  email_verified INT DEFAULT 0,
  reset_token VARCHAR(255),
  reset_token_expiry TIMESTAMP,
  otp_expiry TIMESTAMP,
  address VARCHAR(255),
  zip_code VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(255),
  country VARCHAR(255),
  mobile_number VARCHAR(20),
  role VARCHAR(255) NOT NULL DEFAULT 'user',
  google_id VARCHAR(255) UNIQUE,
  avatar VARCHAR(255),
  is_active INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Lawyers Table
```sql
CREATE TABLE lawyers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  username VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  registration_id VARCHAR(255),
  law_firm VARCHAR(255),
  speciality VARCHAR(255),
  email_verification_code VARCHAR(255),
  email_verified INT DEFAULT 0,
  reset_token VARCHAR(255),
  reset_token_expiry TIMESTAMP,
  otp_expiry TIMESTAMP,
  address VARCHAR(255),
  zip_code VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(255),
  country VARCHAR(255),
  mobile_number VARCHAR(20),
  lawyer_verified INT DEFAULT 0,
  rating DECIMAL(3,1) DEFAULT 0.0,
  phone VARCHAR(20),
  experience VARCHAR(50),
  description TEXT,
  profile_image VARCHAR(500),
  is_verified INT DEFAULT 0,
  languages JSON,
  hourly_rate INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Base URL
`http://localhost:5001/api`

### Authentication Routes (`/api/auth`)

#### User Registration
- **POST** `/auth/register-user`
- **Body**: `{ name, username, email, password, address, zip_code, city, state, country, mobile_number }`
- **Response**: `{ message: "Registration successful. Please check your email for verification code." }`

#### Lawyer Registration
- **POST** `/auth/register-lawyer`
- **Body**: `{ name, username, email, password, registration_id, law_firm, speciality, address, zip_code, city, state, country, mobile_number }`
- **Response**: `{ message: "Registration successful. Please check your email for verification code." }`

#### Unified Registration (Auto-detects user/lawyer)
- **POST** `/auth/register`
- **Body**: Same as above, detects lawyer by presence of `registration_id`, `law_firm`, or `speciality`
- **Response**: Same as individual registration endpoints

#### Login
- **POST** `/auth/login`
- **Body**: `{ email, password }` or for lawyers: `{ email?, registration_id?, password }`
- **Response**: `{ token, user: { id, name, email, role } }`

#### Email Verification
- **POST** `/auth/verify-email`
- **Body**: `{ email, code }`
- **Response**: `{ message: "Email verified successfully" }`

#### OTP Endpoints
- **POST** `/auth/send-otp`
- **Body**: `{ email }`
- **Response**: `{ message: "OTP sent to your email" }`

- **POST** `/auth/verify-otp`
- **Body**: `{ email, otp }`
- **Response**: `{ message: "OTP verified successfully. Email is now verified." }`

#### Password Reset
- **POST** `/auth/forgot-password-otp`
- **Body**: `{ email }`
- **Response**: `{ message: "Password reset OTP sent to your email" }`

- **POST** `/auth/verify-forgot-password-otp`
- **Body**: `{ email, otp, newPassword }`
- **Response**: `{ message: "Password reset successfully" }`

#### Profile Management (Requires JWT)
- **GET** `/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: User profile data

- **PUT** `/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ name, username, address, zip_code, city, state, country, mobile_number }`
- **Response**: `{ message: "Profile updated successfully" }`

- **DELETE** `/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ message: "Account deleted successfully" }`

#### OAuth Routes
- **GET** `/auth/google` - Initiates Google OAuth
- **GET** `/auth/google/callback` - Google OAuth callback (redirects to frontend)
- **GET** `/auth/facebook` - Initiates Facebook OAuth
- **GET** `/auth/facebook/callback` - Facebook OAuth callback (redirects to frontend)

### Admin Routes (`/api/admin`) - Requires Admin JWT

#### Get Unverified Lawyers
- **GET** `/admin/lawyers/unverified`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Response**: Array of unverified lawyers

#### Verify Lawyer
- **PUT** `/admin/verify-lawyer/:id`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Response**: `{ message: "Lawyer verified successfully" }`

### Lawyer Directory Routes (`/api/lawyers`)

#### Get Lawyers Directory
- **GET** `/lawyers/`
- **Query Params**: `page`, `limit`, `specialty`, `location`
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Smith",
      "specialty": "Criminal Law",
      "location": "New York",
      "rating": 4.8,
      "email": "john.smith@lawfirm.com",
      "phone": "+1-555-0123",
      "experience": "15 years",
      "description": "Experienced criminal defense attorney...",
      "profileImage": null,
      "isVerified": true,
      "languages": ["English", "Spanish"],
      "hourlyRate": 250
    }
  ],
  "total": 6,
  "page": 1,
  "limit": 10
}
```

### Health Check
- **GET** `/health`
- **Response**: `{ status: "OK", message: "Legal City API is running" }`

## Controllers Overview

### authController.js
Handles all authentication-related operations:

- `login()` - Unified login for users and lawyers
- `verifyEmail()` - Email verification with code
- `forgotPasswordOtp()` - Send OTP for password reset
- `verifyForgotPasswordOtp()` - Verify OTP and reset password
- `resetPassword()` - Legacy password reset (token-based)
- `getProfile()` - Get user profile (checks both users and lawyers tables)
- `updateProfile()` - Update user profile
- `deleteAccount()` - Delete user account
- `sendOtp()` - Send OTP for email verification
- `verifyOtp()` - Verify OTP and mark email as verified

### userController.js
Handles user-specific operations:

- `registerUser()` - Register new user with validation and email verification
- `loginUser()` - User login (legacy, now handled by authController)
- `getProfile()` - Get user profile
- `updateProfile()` - Update user profile
- `deleteAccount()` - Delete user account

### lawyerController.js
Handles lawyer-specific operations:

- `registerLawyer()` - Register new lawyer with validation
- `loginLawyer()` - Lawyer login (legacy, now handled by authController)
- `getProfile()` - Get lawyer profile
- `updateProfile()` - Update lawyer profile
- `deleteAccount()` - Delete lawyer account
- `getLawyersDirectory()` - Public lawyer directory with filtering and pagination

### adminController.js
Handles admin operations:

- `getUnverifiedLawyers()` - Get list of unverified lawyers
- `verifyLawyer()` - Mark lawyer as verified

## Routes Overview

### routes/auth.js
Mounts all authentication routes with rate limiting:

- Registration routes (user, lawyer, unified)
- Login route
- Email verification
- OTP routes
- Password reset routes
- Profile management (protected)
- OAuth routes

### routes/admin.js
Admin-only routes (require admin authentication):

- Get unverified lawyers
- Verify lawyer

### routes/lawyers.js
Public lawyer directory routes:

- Get lawyers directory with filters

## Utils Overview

### token.js
JWT utilities:

- `generateToken(user)` - Creates JWT with user info
- `verifyToken(token)` - Verifies and decodes JWT

### mailer.js
Email sending utilities:

- `sendVerificationEmail(email, code)` - Send verification code
- `sendResetPasswordEmail(email, resetToken)` - Send password reset link

### middleware.js
Express middleware:

- `authenticateToken` - JWT authentication middleware
- `authenticateAdmin` - Admin role check middleware
- `rateLimit` - Simple in-memory rate limiting

### limiter.js
Rate limiting configuration:

- `authLimiter` - 10 requests per 15 minutes for auth endpoints

### validator.js
Input validation:

- `validateRegistration(data)` - Validates registration data
- `validateLogin(data)` - Validates login data

## Configuration

### server.js
Main application setup:

- Express app initialization
- CORS configuration
- Session setup for OAuth
- Passport initialization
- Route mounting
- Error handling
- 404 handling
- Server startup with email verification

### config/passport.js
OAuth configuration:

- Google Strategy: Handles Google OAuth, creates/updates users
- Facebook Strategy: Handles Facebook OAuth, creates/updates users
- Serialize/deserialize for session management

### knexfile.js
Database configuration for different environments (development, production)

### db.js
Knex instance initialization with development config

## Environment Variables

Required environment variables in `.env`:

```env
NODE_ENV=development
PORT=5001

FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=legal_city

JWT_SECRET=change_me_to_random_string

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback

FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

EMAIL_USER=your@gmail.com
EMAIL_PASS=your_gmail_app_password

TRUST_PROXY=0
```

## How to Run the Project

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   - Copy `.env` file and fill in required values

3. **Run database migrations**:
   ```bash
   npx knex migrate:latest --env development
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

5. **Verify server is running**:
   - Check console for "Server running on port 5001"
   - Check email transporter verification

## Important Notes and Conventions

### Authentication Flow
- Registration → Email verification (OTP or code) → Login
- JWT tokens expire in 7 days
- Passwords hashed with bcrypt (10 rounds)
- OTPs valid for 10 minutes, stored in memory

### Database Design
- Separate tables for users and lawyers
- Email uniqueness across both tables
- Flexible schema with many optional fields
- JSON storage for lawyer languages

### API Design
- RESTful endpoints with consistent error responses
- Rate limiting on authentication endpoints
- CORS configured for frontend origin
- JSON request/response format

### Validation
- Server-side validation for all inputs
- Password requirements: 8+ chars, uppercase, lowercase, number, special char
- Email format validation
- Mobile number format validation
- Registration ID format for lawyers: 2 letters + 6 digits

### Email System
- Uses Gmail SMTP
- Mock email logging to console for development
- HTML email templates for verification and password reset

### OAuth Integration
- Google and Facebook login
- Automatic user creation on first OAuth login
- Redirect to frontend with token after successful OAuth

### Security
- JWT for API authentication
- Password hashing
- Rate limiting
- Input validation and sanitization
- CORS protection

### Development Notes
- Supports both snake_case and camelCase in requests
- Extensive console logging for debugging
- In-memory OTP storage (not suitable for production clustering)
- Sample lawyers inserted via migration for testing

This comprehensive overview covers all aspects of the Legal City backend. Any AI or developer can use this single file to understand the complete system architecture, API surface, and implementation details.
