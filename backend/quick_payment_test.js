require('dotenv').config();
const { runPaymentTests } = require('./test_payment_apis');

console.log('🚀 Quick Payment Test - Direct Database');
console.log('=======================================');

runPaymentTests();