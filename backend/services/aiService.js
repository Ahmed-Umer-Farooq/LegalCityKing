const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      throw new Error(`Document analysis failed: ${error.message}`);
    }
  }

  async legalChatbot(userMessage, context = '') {
    try {
      const prompt = `You are a helpful legal assistant for a law firm platform. Provide accurate, helpful responses about legal services, processes, and general guidance. Do not provide specific legal advice.

Context: ${context}
User Question: ${userMessage}

Provide a helpful, professional response that:
- Answers their question clearly
- Suggests relevant legal services if applicable
- Recommends consulting with a lawyer for specific advice
- Keeps responses concise and actionable`;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      throw new Error(`Chat response failed: ${error.message}`);
    }
  }

  async contractAnalysis(text) {
    try {
      const prompt = `Analyze this contract/legal document and provide:
1. Document Type
2. Key Parties Involved
3. Main Obligations & Rights
4. Important Clauses
5. Potential Red Flags
6. Recommendations

Contract text:
${text.substring(0, 8000)}`;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      throw new Error(`Contract analysis failed: ${error.message}`);
    }
  }

  async analyzeContract(text) {
    return this.contractAnalysis(text);
  }
}

module.exports = new AIService();