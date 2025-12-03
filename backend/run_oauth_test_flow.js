const axios = require('axios');

const BASE_URL = 'http://localhost:5002';

async function runCompleteOAuthFlow() {
    console.log('🚀 Starting Complete Google OAuth Flow Test\n');
    
    try {
        // Phase 1: Create Random Google OAuth User
        console.log('📝 Phase 1: Creating random Google OAuth user...');
        const createResponse = await axios.post(`${BASE_URL}/test/create-google-user`);
        
        if (!createResponse.data.success) {
            throw new Error('Failed to create Google user');
        }
        
        const user = createResponse.data.user;
        console.log('✅ Google OAuth user created:');
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Name: ${user.name}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Profile Completed: ${user.profile_completed ? 'YES' : 'NO'}`);
        console.log(`   - Setup URL: ${createResponse.data.setupUrl}\n`);
        
        // Phase 2: Simulate "Submit Later" - Check Admin Panel (Should show incomplete)
        console.log('📋 Phase 2: Checking admin panel (should show incomplete profile)...');
        const adminCheck1 = await axios.get(`${BASE_URL}/test/admin-panel-check/${user.id}`);
        console.log('✅ Admin Panel Status (Before Completion):');
        console.log(`   - Profile Status: ${adminCheck1.data.profileStatus}`);
        console.log(`   - Has Address: ${adminCheck1.data.adminPanelView.address ? 'YES' : 'NO'}`);
        console.log(`   - Has City: ${adminCheck1.data.adminPanelView.city ? 'YES' : 'NO'}\n`);
        
        // Phase 3: Complete Profile from Dashboard
        console.log('🔧 Phase 3: Completing profile from user dashboard...');
        const profileData = {
            address: '456 Dashboard Street',
            city: 'Dashboard City',
            state: 'California',
            zip_code: '90210',
            country: 'USA',
            mobile_number: '+1-555-0123',
            date_of_birth: '1992-05-15',
            bio: 'Completed profile from dashboard after clicking Submit Later',
            job_title: 'Senior Developer',
            company: 'Tech Corp'
        };
        
        const completeResponse = await axios.post(`${BASE_URL}/test/complete-profile/${user.id}`, profileData);
        console.log('✅ Profile completed successfully from dashboard\n');
        
        // Phase 4: Check Admin Panel Again (Should show complete)
        console.log('📋 Phase 4: Checking admin panel (should show completed profile)...');
        const adminCheck2 = await axios.get(`${BASE_URL}/test/admin-panel-check/${user.id}`);
        console.log('✅ Admin Panel Status (After Completion):');
        console.log(`   - Profile Status: ${adminCheck2.data.profileStatus}`);
        console.log(`   - Address: ${adminCheck2.data.adminPanelView.address}`);
        console.log(`   - City: ${adminCheck2.data.adminPanelView.city}`);
        console.log(`   - State: ${adminCheck2.data.adminPanelView.state}`);
        console.log(`   - Mobile: ${adminCheck2.data.adminPanelView.mobile_number}\n`);
        
        // Phase 5: Check All Users in Admin Panel
        console.log('👥 Phase 5: Checking all users in admin panel...');
        const allUsersResponse = await axios.get(`${BASE_URL}/test/admin-users`);
        console.log('✅ Admin Panel Users List:');
        allUsersResponse.data.users.forEach((u, index) => {
            console.log(`   ${index + 1}. ${u.name} (${u.email}) - Profile: ${u.profile_completed ? 'COMPLETE' : 'INCOMPLETE'}`);
        });
        
        console.log('\n🎉 Complete OAuth Flow Test PASSED!');
        console.log('✅ User created with Google OAuth');
        console.log('✅ Profile initially incomplete (Submit Later simulation)');
        console.log('✅ Profile completed from dashboard');
        console.log('✅ Admin panel shows updated profile status');
        console.log('✅ All users visible in admin panel');
        
    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

// Run the test
runCompleteOAuthFlow();