const aiService = require('../services/aiService');
const path = require('path');
const fs = require('fs');
const knex = require('../db');

const aiController = {
  // Document summarization for lawyers
  async summarizeDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      let fileType;
      
      if (fileExtension === '.pdf') fileType = 'pdf';
      else if (fileExtension === '.docx') fileType = 'docx';
      else if (fileExtension === '.txt') fileType = 'txt';
      else {
        return res.status(400).json({ error: 'Unsupported file type. Use PDF, DOCX, or TXT' });
      }

      const summary = await aiService.summarizeDocument(req.file.path, fileType);
      
      // Read document content for storage
      let documentContent = '';
      if (fileType === 'txt') {
        documentContent = fs.readFileSync(req.file.path, 'utf8');
      }
      
      // Store session in database
      const [sessionId] = await knex('ai_document_sessions').insert({
        lawyer_id: req.user.id,
        document_name: req.file.originalname,
        document_content: documentContent.substring(0, 50000), // Limit size
        document_type: fileType,
        document_summary: summary
      });
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.json({
        success: true,
        summary,
        sessionId,
        fileName: req.file.originalname,
        fileType
      });
    } catch (error) {
      console.error('Document summarization error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Legal chatbot for public users
  async chatbot(req, res) {
    try {
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const response = await aiService.legalChatbot(message, context);
      
      res.json({
        success: true,
        response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Chatbot error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Contract analysis for lawyers
  async analyzeContract(req, res) {
    try {
      const { contractText } = req.body;
      
      if (!contractText) {
        return res.status(400).json({ error: 'Contract text is required' });
      }

      const analysis = await aiService.analyzeContract(contractText);
      
      res.json({
        success: true,
        analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Contract analysis error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Document-specific chat for lawyers
  async documentChat(req, res) {
    try {
      const { message, sessionId, documentContext } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Handle backward compatibility - if no sessionId, use old format
      if (!sessionId) {
        let prompt;
        
        if (message.toLowerCase().includes('one liner') || message.toLowerCase().includes('brief') || message.toLowerCase().includes('short')) {
          prompt = `Based on the document, provide a ONE SENTENCE answer.

Document Context: ${documentContext}

User Request: ${message}

Give only a direct, single sentence response.`;
        } else {
          prompt = `You are a legal AI assistant helping a lawyer understand a document.

Document Context: ${documentContext}

Current Question: ${message}

Provide a direct, specific answer about the document.`;
        }

        const response = await aiService.legalChatbot(prompt, 'Document analysis chat');
        
        return res.json({
          success: true,
          response,
          timestamp: new Date().toISOString()
        });
      }

      // New database-backed format
      const session = await knex('ai_document_sessions')
        .where({ id: sessionId, lawyer_id: req.user.id })
        .first();
        
      if (!session) {
        return res.status(404).json({ error: 'Document session not found' });
      }
      
      const chatHistory = await knex('ai_chat_messages')
        .where({ session_id: sessionId })
        .orderBy('created_at', 'asc')
        .limit(10);

      await knex('ai_chat_messages').insert({
        session_id: sessionId,
        lawyer_id: req.user.id,
        role: 'user',
        message
      });

      let prompt;
      
      if (message.toLowerCase().includes('one liner') || message.toLowerCase().includes('brief') || message.toLowerCase().includes('short')) {
        prompt = `Based on the document and previous discussion, provide a ONE SENTENCE answer.

Document: ${session.document_name}
Summary: ${session.document_summary}

User Request: ${message}

Give only a direct, single sentence response.`;
      } else {
        prompt = `You are a legal AI assistant helping a lawyer understand a document.

Document: ${session.document_name}
Summary: ${session.document_summary}

`;
        
        if (chatHistory.length > 0) {
          prompt += `Previous conversation:
${chatHistory.map(msg => `${msg.role}: ${msg.message}`).join('\n')}

`;
        }
        
        prompt += `Current Question: ${message}

Provide a direct, specific answer about the document.`;
      }

      const response = await aiService.legalChatbot(prompt, 'Document analysis chat');
      
      await knex('ai_chat_messages').insert({
        session_id: sessionId,
        lawyer_id: req.user.id,
        role: 'assistant',
        message: response
      });
      
      res.json({
        success: true,
        response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Document chat error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = aiController;