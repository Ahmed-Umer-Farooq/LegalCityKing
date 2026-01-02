const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');
const { generateToken } = require('../utils/token');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/mailer');
const { getRedirectPath } = require('../utils/redirectLogic');

// In-memory storage for OTPs (email -> {otp, expiry})
const otpStore = new Map();

// Mock email sending for testing (remove when email is configured)
const mockSendVerificationEmail = async (email, code) => {
  console.log('\n=================================');
  console.log('📧 MOCK EMAIL - Server Port: 5001');
  console.log(`Verification code for ${email}: ${code}`);
  console.log('=================================\n');
};

const mockSendResetPasswordEmail = async (email, resetToken) => {
  console.log(`MOCK EMAIL: Reset link for ${email}: http://localhost:3000/reset-password?token=${resetToken}`);
};

const { validateRegistration, validateLogin, handleValidationErrors } = require('../utils/validation');

const login = async (req, res) => {
  try {
    const { email, password, registration_id } = req.body;

    // Input validation
    if (!email && !registration_id) {
      return res.status(400).json({ message: 'Email or registration ID is required' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    let user;
    let role;

    // For lawyer login, BOTH email AND registration_id must be provided and match
    if (registration_id) {
      user = await db('lawyers').where({ 
        email: email,
        registration_id: registration_id 
      }).first();
      
      if (user) {
        role = 'lawyer';
      } else {
        return res.status(401).json({ message: 'Invalid email or registration ID' });
      }
    }
    
    // For regular user login (no registration_id provided)
    if (!user && email && !registration_id) {
      user = await db('users').where({ email }).first();
      if (user) {
        role = 'user';
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Debug logging for verification status
    console.log('User verification status:', user.email_verified, typeof user.email_verified);

    // Check email verification - handle both boolean and integer values
    const isVerified = user.email_verified === 1 || user.email_verified === true;
    if (!isVerified) {
      return res.status(403).json({ message: 'Please verify your email first' });
    }

    // If this account was created via Google OAuth, it won't have a password
    if (!user.password || user.password === '') {
      return res.status(400).json({ message: 'This account was created with Google. Please sign in with Google.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Determine admin status - check multiple conditions
    const isAdmin = user.is_admin === 1 || user.is_admin === true || user.role === 'admin';

    // Ensure role is set to 'admin' if user is admin
    if (isAdmin) {
      user.role = 'admin';
      // Update the database to persist the role
      await db('users').where({ id: user.id }).update({ role: 'admin' });
    }

    const token = generateToken(user);

    // Prepare user data for redirect logic
    const userData = {
      id: user.id,
      email: user.email,
      role: isAdmin ? 'admin' : (role || user.role || 'user'),
      is_admin: isAdmin,
      registration_id: user.registration_id || null,
      redirect: user.redirect || null // Custom redirect if exists
    };

    // Get redirect path using the utility function
    const redirectPath = getRedirectPath(userData);

    // Include all required fields in response
    const userResponse = {
      id: userData.id,
      secure_id: user.secure_id,
      email: userData.email,
      role: userData.role,
      is_admin: userData.is_admin,
      registration_id: userData.registration_id,
      redirect: redirectPath
    };

    console.log('Login response - Role:', userData.role, 'Registration ID:', userData.registration_id, 'Redirect:', redirectPath);

    res.json({ token, user: userResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Check users table
    let user = await db('users').where({ email, email_verification_code: code }).first();
    if (user) {
      await db('users').where({ id: user.id }).update({
        email_verified: 1,
        email_verification_code: null,
        is_verified: 1,
      });
      return res.json({ message: 'Email verified successfully' });
    }

    // Check lawyers table
    user = await db('lawyers').where({ email, email_verification_code: code }).first();
    if (user) {
      await db('lawyers').where({ id: user.id }).update({
        email_verified: 1,
        email_verification_code: null,
        is_verified: 1,
      });
      return res.json({ message: 'Email verified successfully' });
    }

    return res.status(400).json({ message: 'Invalid verification code' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    // Check if user exists in either table
    let user = await db('users').where({ email }).first();
    let userType = 'user';

    if (!user) {
      user = await db('lawyers').where({ email }).first();
      userType = 'lawyer';
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Set expiry to 10 minutes from now
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    // Store OTP in memory with user type
    otpStore.set(`${email}_forgot`, { otp, expiry, userType, userId: user.id });

    // Send OTP via email
    await sendVerificationEmail(email, otp);

    // For testing: log the OTP to console
    console.log(`Forgot Password OTP for ${email}: ${otp}`);

    res.json({ message: 'Password reset OTP sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send password reset OTP' });
  }
};

const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'Valid email, 6-digit OTP, and new password are required' });
    }

    if (newPassword.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character' });
    }

    const storedOtpData = otpStore.get(`${email}_forgot`);

    if (!storedOtpData) {
      return res.status(400).json({ message: 'OTP not found or expired' });
    }

    const { otp: storedOtp, expiry, userType, userId } = storedOtpData;

    // Check if OTP has expired
    if (new Date() > expiry) {
      otpStore.delete(`${email}_forgot`);
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Check if OTP matches
    if (storedOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in the appropriate table
    if (userType === 'user') {
      await db('users').where({ id: userId }).update({ password: hashedPassword });
    } else {
      await db('lawyers').where({ id: userId }).update({ password: hashedPassword });
    }

    // Remove OTP from storage
    otpStore.delete(`${email}_forgot`);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6 || !/\d/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must be at least 6 characters and include a number' });
    }

    // Check users table
    let user = await db('users')
      .where({ reset_token: token })
      .andWhere('reset_token_expiry', '>', new Date())
      .first();

    if (user) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db('users').where({ id: user.id }).update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
      });

      return res.json({ message: 'Password reset successfully' });
    }

    // Check lawyers table
    user = await db('lawyers')
      .where({ reset_token: token })
      .andWhere('reset_token_expiry', '>', new Date())
      .first();

    if (user) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db('lawyers').where({ id: user.id }).update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
      });

      return res.json({ message: 'Password reset successfully' });
    }

    return res.status(400).json({ message: 'Invalid or expired reset token' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const calculateProfileCompletion = (user, userType) => {
  const requiredFields = userType === 'lawyer' 
    ? ['name', 'email', 'username', 'mobile_number', 'registration_id', 'law_firm', 'speciality']
    : ['name', 'email', 'username', 'mobile_number'];
  
  const optionalFields = ['address', 'city', 'state', 'zip_code', 'country', 'date_of_birth', 'bio'];
  
  let completed = 0;
  let total = requiredFields.length + optionalFields.length;
  
  // Check required fields (weighted more)
  requiredFields.forEach(field => {
    if (user[field] && user[field].toString().trim()) completed += 2;
  });
  
  // Check optional fields
  optionalFields.forEach(field => {
    if (user[field] && user[field].toString().trim()) completed += 1;
  });
  
  // Adjust total for weighting
  total = requiredFields.length * 2 + optionalFields.length;
  
  return Math.round((completed / total) * 100);
};

const getProfile = async (req, res) => {
  try {
    // Check lawyers table first for this user ID
    let user = await db('lawyers').where({ id: req.user.id }).select(
      'id', 'name', 'username', 'email', 'registration_id', 'law_firm', 'speciality', 
      'address', 'zip_code', 'city', 'state', 'country', 'mobile_number', 
      'date_of_birth', 'bio', 'profile_image', 'social_links', 'interests', 'privacy_settings',
      'is_verified', 'lawyer_verified', 'profile_completed', 'profile_completion_percentage', 'google_id',
      'verification_status'
    ).first();
    
    if (user) {
      const completionPercentage = calculateProfileCompletion(user, 'lawyer');
      
      // Update completion percentage if different
      if (user.profile_completion_percentage !== completionPercentage) {
        await db('lawyers').where({ id: user.id }).update({ profile_completion_percentage: completionPercentage });
        user.profile_completion_percentage = completionPercentage;
      }
      
      return res.json({
        ...user,
        role: 'lawyer',
        is_admin: false,
        verified: user.verification_status === 'approved',
        is_verified: user.verification_status === 'approved',
        profile_completion_percentage: completionPercentage
      });
    }

    // Check users table if not found in lawyers
    user = await db('users').where({ id: req.user.id }).select(
      'id', 'name', 'username', 'email', 'address', 'zip_code', 'city', 'state', 'country', 'mobile_number',
      'date_of_birth', 'bio', 'profile_image', 'job_title', 'company', 'social_links', 'interests', 'privacy_settings',
      'role', 'is_admin', 'is_verified', 'profile_completed', 'profile_completion_percentage', 'google_id'
    ).first();
    
    if (user) {
      const completionPercentage = calculateProfileCompletion(user, 'user');
      
      // Update completion percentage if different
      if (user.profile_completion_percentage !== completionPercentage) {
        await db('users').where({ id: user.id }).update({ profile_completion_percentage: completionPercentage });
        user.profile_completion_percentage = completionPercentage;
      }
      
      return res.json({
        ...user,
        role: user.role || 'user',
        is_admin: user.is_admin || false,
        verified: user.is_verified === 1,
        profile_completion_percentage: completionPercentage
      });
    }

    return res.status(404).json({ message: 'User not found' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      username,
      mobile_number,
      address,
      city,
      state,
      zip_code,
      country,
      date_of_birth,
      bio,
      job_title,
      company,
      social_links,
      interests,
      privacy_settings,
      registration_id,
      law_firm,
      speciality,
      verified
    } = req.body;

    console.log('Update profile request for user ID:', req.user.id);
    console.log('Request body:', req.body);
    console.log('Speciality value:', speciality);
    console.log('Registration ID value:', registration_id);

    // First, determine if user is in users or lawyers table
    let user = await db('users').where({ id: req.user.id }).first();
    let userType = 'user';

    if (!user) {
      user = await db('lawyers').where({ id: req.user.id }).first();
      userType = 'lawyer';
    }

    if (!user) {
      console.log('User not found in either table');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User type determined:', userType);

    // Prepare update data based on user type
    let updateData = {};

    if (userType === 'user') {
      // For users: include all common fields plus email
      updateData = {
        name,
        email,
        username,
        mobile_number,
        address,
        city,
        state,
        zip_code,
        country,
        date_of_birth,
        bio,
        job_title,
        company,
        social_links: social_links ? JSON.stringify(social_links) : undefined,
        interests: interests ? JSON.stringify(interests) : undefined,
        privacy_settings: privacy_settings ? JSON.stringify(privacy_settings) : undefined,
        profile_completed: 1
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });

      console.log('Updating users table with data:', updateData);

      const updated = await db('users').where({ id: req.user.id }).update(updateData);

      if (updated) {
        // Fetch updated user data
        const updatedUser = await db('users')
          .where({ id: req.user.id })
          .select('id', 'name', 'username', 'email', 'address', 'zip_code', 'city', 'state', 'country', 'mobile_number', 'role', 'is_admin', 'profile_completed', 'is_verified')
          .first();

        console.log('User profile updated successfully');
        
        // Prepare user data for redirect logic
        const userData = {
          role: updatedUser.role || 'user',
          is_admin: updatedUser.is_admin || false,
          registration_id: updatedUser.registration_id || null,
          redirect: updatedUser.redirect || null
        };
        
        const redirectPath = getRedirectPath(userData);
        
        return res.json({
          message: 'Profile updated successfully',
          user: {
            ...updatedUser,
            role: userData.role,
            is_admin: userData.is_admin,
            registration_id: userData.registration_id,
            verified: updatedUser.is_verified === 1
          },
          redirect: redirectPath
        });
      }
    } else {
      // For lawyers: include all common fields plus lawyer-specific fields
      updateData = {
        name,
        email,
        username,
        registration_id,
        law_firm,
        speciality,
        mobile_number,
        address,
        city,
        state,
        zip_code,
        country,
        date_of_birth,
        bio,
        social_links: social_links ? JSON.stringify(social_links) : undefined,
        interests: interests ? JSON.stringify(interests) : undefined,
        privacy_settings: privacy_settings ? JSON.stringify(privacy_settings) : undefined,
        profile_completed: 1, // Mark profile as completed
        updated_at: db.fn.now()
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });

      console.log('Updating lawyers table with data:', updateData);
      console.log('Speciality value before update:', speciality);
      console.log('Registration ID value before update:', registration_id);

      const updated = await db('lawyers').where({ id: req.user.id }).update(updateData);

      if (updated) {
        // Fetch updated lawyer data
        const updatedLawyer = await db('lawyers')
          .where({ id: req.user.id })
          .select('id', 'name', 'username', 'email', 'registration_id', 'law_firm', 'speciality', 'address', 'zip_code', 'city', 'state', 'country', 'mobile_number', 'is_verified', 'lawyer_verified', 'profile_completed')
          .first();

        console.log('Lawyer profile updated successfully - speciality:', updatedLawyer.speciality, 'registration_id:', updatedLawyer.registration_id);
        
        // Prepare user data for redirect logic
        const userData = {
          role: 'lawyer',
          is_admin: false,
          registration_id: updatedLawyer.registration_id || null,
          redirect: updatedLawyer.redirect || null
        };
        
        const redirectPath = getRedirectPath(userData);
        
        return res.json({
          message: 'Profile updated successfully',
          user: {
            ...updatedLawyer,
            role: 'lawyer',
            is_admin: false,
            registration_id: userData.registration_id,
            verified: updatedLawyer.is_verified === 1 || updatedLawyer.lawyer_verified === 1
          },
          redirect: redirectPath
        });
      }
    }

    console.log('No rows updated - user not found');
    return res.status(404).json({ message: 'User not found' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    // Check users table
    let deleted = await db('users').where({ id: req.user.id }).del();
    if (deleted) {
      return res.json({ message: 'Account deleted successfully' });
    }

    // Check lawyers table
    deleted = await db('lawyers').where({ id: req.user.id }).del();
    if (deleted) {
      return res.json({ message: 'Account deleted successfully' });
    }

    return res.status(404).json({ message: 'User not found' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Set expiry to 10 minutes from now
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    // Store OTP in memory
    otpStore.set(email, { otp, expiry });

    // Send OTP via email
    await sendVerificationEmail(email, otp);

    // For testing: log the OTP to console
    console.log(`OTP for ${email}: ${otp}`);

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'Valid email and 6-digit OTP are required' });
    }

    const storedOtpData = otpStore.get(email);

    if (!storedOtpData) {
      return res.status(400).json({ message: 'OTP not found or expired' });
    }

    const { otp: storedOtp, expiry } = storedOtpData;

    // Check if OTP has expired
    if (new Date() > expiry) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Check if OTP matches
    if (storedOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if user exists and update email_verified status
    let user = await db('users').where({ email }).first();
    if (user) {
      await db('users').where({ id: user.id }).update({
        email_verified: 1,
        email_verification_code: null,
        is_verified: 1,
      });
    } else {
      user = await db('lawyers').where({ email }).first();
      if (user) {
        await db('lawyers').where({ id: user.id }).update({
          email_verified: 1,
          email_verification_code: null,
          is_verified: 1,
        });
      }
    }

    // Remove OTP from storage (one-time use)
    otpStore.delete(email);

    res.json({ message: 'OTP verified successfully. Email is now verified.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};

// Mark account as verified upon "Submit Later" action
const submitLater = async (req, res) => {
  try {
    // Check lawyers table first
    let user = await db('lawyers').where({ id: req.user.id }).first();
    if (user) {
      await db('lawyers').where({ id: req.user.id }).update({ 
        profile_completed: 1
      });
      const updated = await db('lawyers').where({ id: req.user.id }).first();
      return res.json({ 
        message: 'Profile completed', 
        user: { 
          ...updated, 
          role: 'lawyer',
          is_admin: false,
          registration_id: updated.registration_id
        },
        redirect: '/lawyer-dashboard'
      });
    }
    
    // Check users table
    user = await db('users').where({ id: req.user.id }).first();
    if (user) {
      await db('users').where({ id: req.user.id }).update({ 
        profile_completed: 1
      });
      const updated = await db('users').where({ id: req.user.id }).first();
      return res.json({ 
        message: 'Profile completed', 
        user: { 
          ...updated, 
          role: 'user',
          is_admin: updated.is_admin || false,
          registration_id: updated.registration_id || null
        },
        redirect: '/user-dashboard'
      });
    }
    return res.status(404).json({ message: 'User not found' });
  } catch (error) {
    console.error('Error updating status on submit later:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
};

module.exports = {
  login,
  verifyEmail,
  forgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
  getProfile,
  updateProfile,
  deleteAccount,
  sendOtp,
  verifyOtp,
  submitLater,
};
