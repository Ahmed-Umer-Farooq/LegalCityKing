// Test what the actual API returns
// Run this in browser console after logging in as lawyer

console.log('Testing Dashboard APIs...\n');

// Get the token from localStorage
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);

if (!token) {
  console.error('No token found! Please login first.');
} else {
  // Test /stripe/lawyer-earnings
  fetch('http://localhost:5001/api/stripe/lawyer-earnings', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {
    console.log('\n1. /stripe/lawyer-earnings response:');
    console.log('   earnings:', data.earnings);
    console.log('   total_earned:', data.earnings?.total_earned);
    console.log('   available_balance:', data.earnings?.available_balance);
  })
  .catch(err => console.error('Error fetching earnings:', err));

  // Test /lawyer/dashboard/stats
  fetch('http://localhost:5001/api/lawyer/dashboard/stats', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {
    console.log('\n2. /lawyer/dashboard/stats response:');
    console.log('   monthlyRevenue:', data.monthlyRevenue);
    console.log('   totalRevenue:', data.totalRevenue);
    console.log('   monthlyRevenueData:', data.monthlyRevenueData);
  })
  .catch(err => console.error('Error fetching stats:', err));
}
