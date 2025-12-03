const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// Database connection
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'legal_city'
};

// Test API 1: Create Random Google OAuth User (Incomplete Profile)
app.post('/test/create-google-user', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Generate random Google user data
        const randomId = Math.floor(Math.random() * 10000);
        const googleUser = {
            name: `Test Google User ${randomId}`,
            email: `testgoogle${randomId}@gmail.com`,
            username: `googleuser${randomId}`,
            google_id: `google_${randomId}_${Date.now()}`,
            secure_id: uuidv4(),
            profile_completed: 0,
            oauth_provider: 'google'
        };

        const [result] = await connection.execute(
            `INSERT INTO users (name, email, username, google_id, secure_id, profile_completed, oauth_provider, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [googleUser.name, googleUser.email, googleUser.username, googleUser.google_id, googleUser.secure_id, googleUser.profile_completed, googleUser.oauth_provider]
        );

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: result.insertId, 
                email: googleUser.email,
                secure_id: googleUser.secure_id 
            },
            'yourSecretKey',
            { expiresIn: '24h' }
        );

        await connection.end();

        res.json({
            success: true,
            message: 'Random Google OAuth user created successfully',
            user: {
                id: result.insertId,
                ...googleUser,
                token
            },
            setupUrl: `http://localhost:3000/google-user-setup?token=${token}`
        });

    } catch (error) {
        console.error('Error creating test Google user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test API 2: Complete Profile (Simulate "Submit Later" then Dashboard Completion)
app.post('/test/complete-profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const profileData = req.body;
        
        const connection = await mysql.createConnection(dbConfig);
        
        // Update user profile with complete data
        const updateQuery = `
            UPDATE users SET 
                address = ?, 
                city = ?, 
                state = ?, 
                zip_code = ?, 
                country = ?, 
                mobile_number = ?,
                date_of_birth = ?,
                bio = ?,
                job_title = ?,
                company = ?,
                profile_completed = 1,
                updated_at = NOW()
            WHERE id = ?
        `;
        
        await connection.execute(updateQuery, [
            profileData.address || `123 Test Street ${userId}`,
            profileData.city || 'Test City',
            profileData.state || 'Test State',
            profileData.zip_code || '12345',
            profileData.country || 'USA',
            profileData.mobile_number || `+1234567${userId}`,
            profileData.date_of_birth || '1990-01-01',
            profileData.bio || `Test bio for user ${userId}`,
            profileData.job_title || 'Software Developer',
            profileData.company || 'Test Company',
            userId
        ]);

        // Fetch updated user
        const [users] = await connection.execute(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        await connection.end();

        res.json({
            success: true,
            message: 'Profile completed successfully',
            user: users[0]
        });

    } catch (error) {
        console.error('Error completing profile:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test API 3: Check Admin Panel Data
app.get('/test/admin-panel-check/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const connection = await mysql.createConnection(dbConfig);
        
        // Get user data as admin panel would see it
        const [users] = await connection.execute(
            `SELECT id, name, email, username, secure_id, profile_completed, 
                    oauth_provider, address, city, state, country, mobile_number,
                    created_at, updated_at 
             FROM users WHERE id = ?`,
            [userId]
        );

        await connection.end();

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            message: 'Admin panel data retrieved',
            adminPanelView: users[0],
            profileStatus: users[0].profile_completed ? 'COMPLETED' : 'INCOMPLETE'
        });

    } catch (error) {
        console.error('Error checking admin panel:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test API 4: Get All Users (Admin Panel Simulation)
app.get('/test/admin-users', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [users] = await connection.execute(
            `SELECT id, name, email, username, secure_id, profile_completed, 
                    oauth_provider, created_at, updated_at 
             FROM users 
             ORDER BY created_at DESC 
             LIMIT 20`
        );

        await connection.end();

        res.json({
            success: true,
            message: 'Admin panel users retrieved',
            users: users,
            totalUsers: users.length
        });

    } catch (error) {
        console.error('Error getting admin users:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 5002;
app.listen(PORT, () => {
    console.log(`Test API server running on port ${PORT}`);
    console.log('\nAvailable Test Endpoints:');
    console.log('POST /test/create-google-user - Create random Google OAuth user');
    console.log('POST /test/complete-profile/:userId - Complete user profile');
    console.log('GET /test/admin-panel-check/:userId - Check admin panel data');
    console.log('GET /test/admin-users - Get all users (admin view)');
});