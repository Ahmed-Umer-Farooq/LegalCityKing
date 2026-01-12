# Fix PUT /auth/me Endpoint

## Tasks
- [ ] Update updateProfile function in controllers/authController.js to handle all fields from frontend
- [ ] Add logic to determine user type (user vs lawyer) before updating
- [ ] Map 'verified: true' to appropriate database field (profile_completed for users, is_verified for lawyers)
- [ ] Return updated user data with proper role and is_admin fields
- [ ] Add proper error handling and logging for database operations
- [ ] Test the endpoint functionality for both user types
