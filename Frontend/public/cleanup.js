// Clean up localStorage and fix session isolation
console.log('🧹 Cleaning up localStorage...\n');

// Remove all multi-session related data
localStorage.removeItem('multiSessions');
localStorage.removeItem('token_user');
localStorage.removeItem('token_lawyer');
localStorage.removeItem('token_admin');
localStorage.removeItem('user_user');
localStorage.removeItem('user_lawyer');
localStorage.removeItem('user_admin');

// Remove navigation state
localStorage.removeItem('returnPath');
localStorage.removeItem('navigatedFromDashboard');

console.log('✅ Cleaned up multi-session data');
console.log('✅ Removed navigation state');
console.log('✅ System reset to single-session mode');

console.log('\n🔄 Please refresh the page and login again.');
console.log('The system will now use proper single-session authentication.');