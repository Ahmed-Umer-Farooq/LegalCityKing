## Legal City Backend – AI Onboarding Snapshot

Purpose: This single file gives any AI/engineer instant context to work on this backend without scanning the whole repo first.

### Tech Stack
- Runtime: Node.js + Express
- Auth: JWT + Passport (Google, Facebook)
- DB: MySQL (mysql2) via Knex migrations
- Mail: Nodemailer (Gmail)

### Runbook
1) Env file `.env` (example values):
```
NODE_ENV=development
PORT=5001

FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=legal_city

JWT_SECRET=change_me

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback

FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

EMAIL_USER=your@gmail.com
EMAIL_PASS=app_password

TRUST_PROXY=0
```
2) Install and run:
```
npm install
npx knex migrate:latest --env development
npm start
```

### Project Structure (key parts)
```
backend/
  server.js                 # App bootstrap, middleware, routes mount
  knexfile.js               # Knex config (mysql2)
  config/
    passport.js            # Passport Google & Facebook strategies
  controllers/
    authController.js      # Login, OTP, verify email, password reset
    userController.js      # Register user, profile CRUD
    lawyerController.js    # Register/login lawyers, profile
  routes/
    auth.js                # /api/auth/*  (register, login, oauth)
    lawyers.js             # /api/lawyers/*
  migrations/              # Knex migrations (users, lawyers, columns)
  utils/
    validator.js           # Input validation helpers
    token.js               # JWT sign/verify
    mailer.js              # Email helpers
  db.js                    # Knex instance (if present)
```

### HTTP Surface (most used)
- Base: `http://localhost:5001`
- Auth
  - POST `/api/auth/register` – body: { name, username, email, password, address, city, state, zipCode|zip_code, country, mobileNumber|mobile_number }
  - POST `/api/auth/login` – body: { email, password } or lawyers with registration_id
  - GET `/api/auth/google` → Google OAuth
  - GET `/api/auth/google/callback` → redirects to `${FRONTEND_URL}/dashboard?token=...`
  - POST `/api/auth/send-otp`, `/verify-otp` – email OTP flow
  - GET/PUT/DELETE `/api/auth/me` – profile, requires `Authorization: Bearer <JWT>`

### Auth Flow Notes
- Local login issues usually come from `email_verified` being 0; OTP or verify endpoint flips it to 1.
- Google OAuth: ensure `GOOGLE_CALLBACK_URL` matches the console’s Authorized Redirect URI exactly.
- Sessions are used only for OAuth handshake; JWT for API auth.

### Database Model Highlights
- users:
  - Required: id, name, email (unique), password, email_verified (int 0/1)
  - Optional: username, address, city, state, country, zip_code, mobile_number
  - OAuth-related: role (default 'user'), google_id, avatar, is_active (int 1)
- lawyers: similar contact fields + registration_id, lawyer_verified

### Common Tasks for AI
- Add/modify fields: create a Knex migration in `migrations/` and run `npx knex migrate:latest`.
- Creating endpoints: implement controller in `controllers/*`, wire route in `routes/*`, mount under `/api/...` in `server.js`.
- JWT use: `utils/token.js` (`generateToken`, verify middleware in `utils/middleware.js`).

### Debug Tips
- CORS origin controlled by `FRONTEND_URL` in `server.js`.
- OAuth cookie issues: set `TRUST_PROXY=1` if behind proxy; cookies use `sameSite: 'lax'`, `secure` in production.
- Redirect mismatches = check ports, http vs https, and exact paths.

### Conventions
- Request validation via `utils/validator.js`.
- Use camelCase in frontend; backend accepts both camelCase and snake_case for register fields.
- Keep controller code side-effect free besides DB/email; put helpers in `utils/`.

### Quick Checklist Before Starting
- [ ] `.env` filled and loaded
- [ ] Migrations up to date
- [ ] `GOOGLE_CALLBACK_URL` and Google Console URIs match
- [ ] Backend running on 5001; frontend on 3000

This file is the single artifact to upload to any AI to gain context quickly.


