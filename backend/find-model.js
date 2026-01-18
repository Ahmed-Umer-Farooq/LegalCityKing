require('dotenv').config();

async function findWorkingModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-1.0-pro'
  ];
  
  console.log('🔍 Testing different Gemini models...\n');
  
  for (const model of models) {
    try {
      console.log(`Testing model: ${model}`);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Hello"
            }]
          }]
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${model} works!`);
        console.log(`Response: ${data.candidates[0].content.parts[0].text}\n`);
        return model;
      } else {
        console.log(`❌ ${model} failed: ${data.error?.message}\n`);
      }
    } catch (error) {
      console.log(`❌ ${model} error: ${error.message}\n`);
    }
  }
  
  console.log('No working model found. Please check your API key.');
  return null;
}

findWorkingModel();