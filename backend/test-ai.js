const aiService = require('./services/aiService');

async function testAI() {
  console.log('🤖 Testing AI Integration...\n');

  try {
    // Test 1: Legal Chatbot
    console.log('1. Testing Legal Chatbot...');
    const chatResponse = await aiService.legalChatbot(
      'What documents do I need for a divorce?',
      'Legal consultation platform'
    );
    console.log('✅ Chatbot Response:', chatResponse.substring(0, 100) + '...\n');

    // Test 2: Contract Analysis
    console.log('2. Testing Contract Analysis...');
    const contractText = `
      EMPLOYMENT AGREEMENT
      
      This Employment Agreement is entered into between ABC Company and John Doe.
      
      1. Position: Software Developer
      2. Salary: $80,000 per year
      3. Benefits: Health insurance, 401k matching
      4. Term: 2 years with automatic renewal
      5. Termination: Either party may terminate with 30 days notice
    `;
    
    const analysisResponse = await aiService.contractAnalysis(contractText);
    console.log('✅ Contract Analysis:', analysisResponse.substring(0, 100) + '...\n');

    console.log('🎉 All AI tests passed successfully!');
    
  } catch (error) {
    console.error('❌ AI Test Failed:', error.message);
  }
}

// Run the test
testAI();