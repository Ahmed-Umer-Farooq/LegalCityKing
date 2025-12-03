const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const crypto = require('crypto');
const db = require('../db');
const { generateToken } = require('../utils/token');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      console.log('🔍 Google strategy called with profile:', profile.id, profile.displayName);
      try {
        const email = profile.emails?.[0]?.value;
        console.log('📧 Email from Google:', email);
        if (!email) {
          console.log('❌ No email from Google profile');
          return done(null, false, { message: 'No email from Google' });
        }

        // Check if user exists
        let user = await db('users').where({ email }).first();
        console.log('👤 Existing user found:', user ? user.id : 'None');
        
        if (user) {
          // User exists - check if it's a password account
          if (user.password && !user.google_id) {
            console.log('🚫 Password account exists, blocking OAuth');
            return done(null, false, { message: 'Account already exists. Please login with password.' });
          }
          // Update google_id if missing
          if (!user.google_id) {
            console.log('🔗 Linking Google account to existing user');
            await db('users').where({ id: user.id }).update({ google_id: profile.id, email_verified: 1 });
            user = await db('users').where({ id: user.id }).first();
          }
        } else {
          // Create new Google user
          console.log('🆕 Creating new Google user');
          const [id] = await db('users').insert({
            name: profile.displayName,
            email,
            google_id: profile.id,
            email_verified: 1,
            is_verified: 1,
            password: '',
            role: 'user',
            profile_completed: 0,
            secure_id: crypto.randomBytes(16).toString('hex'),
            avatar: profile.photos?.[0]?.value
          });
          user = await db('users').where({ id }).first();
          console.log('✅ Created user with ID:', user.id);
        }

        const token = generateToken(user);
        console.log('🔑 Generated token for user:', user.id);
        const result = {
          id: user.id,
          email: user.email,
          name: user.name,
          token: token,
          profile_completed: user.profile_completed
        };
        console.log('✅ Calling done() with simplified result:', JSON.stringify(result));
        done(null, result);
      } catch (error) {
        console.error('❌ Google strategy error:', error);
        done(error, null);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/api/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'emails'],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;
        const role = (req.query && req.query.role) || 'user';
        const tableName = role === 'lawyer' ? 'lawyers' : 'users';

        let user = await db(tableName).where({ email }).first();

        if (user && user.password && user.password !== '') {
          return done(null, false, { message: 'Account already exists with this email. Please login with your password.' });
        }

        if (!user) {
          const insertData = {
            name: profile.displayName,
            email,
            role: 'user',
            email_verified: 1,
            facebook_id: profile.id,
            password: '',
            profile_completed: 0,
            is_verified: 0,
            secure_id: crypto.randomBytes(16).toString('hex'),
          };

          const [id] = await db('users').insert(insertData);
          user = await db('users').where({ id }).first();
        } else {
          const updateData = {};
          if (!user.facebook_id) {
            updateData.facebook_id = profile.id;
            updateData.email_verified = 1;
          }
          if (!user.secure_id) {
            updateData.secure_id = crypto.randomBytes(16).toString('hex');
          }
          
          if (Object.keys(updateData).length > 0) {
            await db('users').where({ id: user.id }).update(updateData);
            user = await db('users').where({ id: user.id }).first();
          }
        }

        const token = generateToken(user);
        done(null, { user, token });
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = passport;