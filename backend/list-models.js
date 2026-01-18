require('dotenv').config();

async function listAvailableModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔍 Listing available models...\n');
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Available models:');
      data.models.forEach(model => {
        console.log(`- ${model.name} (${model.displayName})`);
        if (model.supportedGenerationMethods?.includes('generateContent')) {
          console.log(`  ✅ Supports generateContent`);
        }
      });
      
      // Find the first model that supports generateContent
      const workingModel = data.models.find(model => 
        model.supportedGenerationMethods?.includes('generateContent')
      );
      
      if (workingModel) {
        console.log(`\n🎯 Recommended model: ${workingModel.name}`);
        return workingModel.name;
      }
    } else {
      console.log('❌ Failed to list models:', data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

listAvailableModels();