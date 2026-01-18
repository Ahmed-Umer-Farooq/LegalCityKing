require('dotenv').config();
const aiService = require('./services/aiService');

async function testAI() {
  console.log('Testing AI service...');
  console.log('Gemini API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
  
  try {
    const response = await aiService.legalChatbot('Hello, how does consultation work?', 'Test context');
    console.log('✅ AI Response:', response);
  } catch (error) {
    console.error('❌ AI Error:', error.message);
    console.error('Full error:', error);
  }
}

testAI();