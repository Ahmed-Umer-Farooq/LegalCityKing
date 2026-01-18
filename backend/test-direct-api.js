require('dotenv').config();

async function testGeminiDirectly() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔍 Testing Gemini API directly...\n');
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Hello, can you help me with a simple legal question?"
          }]
        }]
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API Key is working!');
      console.log('Response:', data.candidates[0].content.parts[0].text.substring(0, 100) + '...');
    } else {
      console.log('❌ API Error:', data);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

testGeminiDirectly();