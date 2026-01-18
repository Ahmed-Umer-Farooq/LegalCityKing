const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');

class AIService {
  constructor() {
    // Initialize Grok (primary)
    this.groq = new Groq({
      apiKey: process.env.GROK_API_KEY
    });
    
    // Initialize Gemini (fallback)
    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.geminiModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
  }

  async summarizeDocument(filePath, fileType) {
    try {
      let text = '';
      
      if (fileType === 'pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        text = data.text;
      } else if (fileType === 'docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        text = result.value;
      } else if (fileType === 'txt') {
        text = fs.readFileSync(filePath, 'utf8');
      }

      const prompt = `As a legal AI assistant, analyze this document and provide:
1. Executive Summary (2-3 sentences)
2. Key Legal Points (bullet points)
3. Important Dates/Deadlines
4. Potential Risks or Concerns
5. Action Items

Document content:
${text.substring(0, 8000)}`;

      // Try Grok first
      try {
        if (process.env.GROK_API_KEY) {
          const completion = await this.groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.3,
            max_tokens: 1000
          });
          return completion.choices[0]?.message?.content || 'Summary unavailable.';
        }
      } catch (grokError) {
        console.log('Grok failed for document summary, trying Gemini:', grokError.message);
        
        // Fallback to Gemini
        if (this.geminiModel) {
          const result = await this.geminiModel.generateContent(prompt);
          return result.response.text();
        }
      }
      
      throw new Error('Document analysis temporarily unavailable.');
    } catch (error) {
      throw new Error(`Document analysis failed: ${error.message}`);
    }
  }

  async legalChatbot(userMessage, context = '') {
    const prompt = `You are a helpful legal assistant for a law firm platform. Provide accurate, helpful responses about legal services, processes, and general guidance. Do not provide specific legal advice.

Context: ${context}
User Question: ${userMessage}

Provide a helpful, professional response that:
- Answers their question clearly
- Suggests relevant legal services if applicable
- Recommends consulting with a lawyer for specific advice
- Keeps responses concise and actionable`;

    // Try Grok first (primary)
    try {
      if (process.env.GROK_API_KEY) {
        const completion = await this.groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.1-8b-instant',
          temperature: 0.7,
          max_tokens: 500
        });
        return completion.choices[0]?.message?.content || 'I apologize, but I cannot provide a response at this time.';
      }
    } catch (grokError) {
      console.log('Grok API failed, trying Gemini fallback:', grokError.message);
      
      // Try Gemini as fallback
      try {
        if (this.geminiModel) {
          const result = await this.geminiModel.generateContent(prompt);
          return result.response.text();
        }
      } catch (geminiError) {
        console.error('Both AI services failed:', { grok: grokError.message, gemini: geminiError.message });
      }
    }
    
    // If both fail, return helpful fallback
    throw new Error('AI service temporarily unavailable. Please try again or contact support.');
  }

  async analyzeContract(text) {
    const prompt = `Analyze this contract/legal document and provide:
1. Document Type
2. Key Parties Involved
3. Main Obligations & Rights
4. Important Clauses
5. Potential Red Flags
6. Recommendations

Contract text:
${text.substring(0, 8000)}`;

    // Try Grok first
    try {
      if (process.env.GROK_API_KEY) {
        const completion = await this.groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.1-8b-instant',
          temperature: 0.3,
          max_tokens: 800
        });
        return completion.choices[0]?.message?.content || 'Analysis unavailable.';
      }
    } catch (grokError) {
      console.log('Grok failed for contract analysis, trying Gemini:', grokError.message);
      
      // Fallback to Gemini
      if (this.geminiModel) {
        try {
          const result = await this.geminiModel.generateContent(prompt);
          return result.response.text();
        } catch (geminiError) {
          console.error('Both AI services failed for contract analysis');
        }
      }
    }
    
    throw new Error('Contract analysis temporarily unavailable.');
  }
}

module.exports = new AIService();