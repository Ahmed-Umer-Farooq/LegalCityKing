async function testNewKey() {
  const apiKey = 'AIzaSyBdESfjYRPrcmxwAISM2bZ44dpTh-i31TE';
  
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent("Hello, test message");
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ New API key works!');
    console.log('Response:', text);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNewKey();