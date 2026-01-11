const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../utils/middleware');
const { chatRateLimit, validateContent, validateFile, verifyUserAccess, auditLog } = require('../middleware/chatSecurity');
const { scanFile, quarantineFile } = require('../middleware/fileScanner');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure secure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/chat');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}_${sanitizedName}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Get all conversations for a user (including pending messages for lawyers)
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    
    // Determine user type by checking which table the user exists in
    let userType = 'user';
    try {
      const lawyer = await db('lawyers').where('id', userId).first();
      if (lawyer) {
        userType = 'lawyer';
      }
    } catch (error) {
      console.error('Error checking lawyer table:', error);
    }
    
    console.log(`Fetching conversations for user ${userId} (${userType}) - role: ${role}, reg_id: ${req.user.registration_id}`);
    
    let conversations = await db('chat_messages')
      .select(
        db.raw(`
          CASE 
            WHEN sender_id = ? AND sender_type = ? THEN receiver_id
            ELSE sender_id
          END as partner_id
        `, [userId, userType]),
        db.raw(`
          CASE 
            WHEN sender_id = ? AND sender_type = ? THEN receiver_type
            ELSE sender_type
          END as partner_type
        `, [userId, userType]),
        db.raw('MAX(created_at) as last_message_time'),
        db.raw('COUNT(CASE WHEN read_status = 0 AND receiver_id = ? AND receiver_type = ? THEN 1 END) as unread_count', [userId, userType])
      )
      .where(function() {
        this.where({ sender_id: userId, sender_type: userType })
          .orWhere({ receiver_id: userId, receiver_type: userType });
      })
      .groupBy('partner_id', 'partner_type')
      .orderBy('last_message_time', 'desc');

    console.log(`Found ${conversations.length} conversations from main query`);
    
    // For lawyers, also include all messages sent to them
    if (userType === 'lawyer') {
      console.log('Processing lawyer-specific conversations...');
      const allIncomingMessages = await db('chat_messages')
        .select(
          'sender_id as partner_id',
          'sender_type as partner_type',
          db.raw('MAX(created_at) as last_message_time'),
          db.raw('COUNT(CASE WHEN read_status = 0 THEN 1 END) as unread_count')
        )
        .where({
          receiver_id: userId,
          receiver_type: userType
        })
        .groupBy('sender_id', 'sender_type');

      console.log(`Found ${allIncomingMessages.length} incoming messages for lawyer`);
      
      // Merge incoming messages with existing conversations
      const existingPartners = new Set(conversations.map(c => `${c.partner_id}-${c.partner_type}`));
      allIncomingMessages.forEach(incoming => {
        const key = `${incoming.partner_id}-${incoming.partner_type}`;
        if (!existingPartners.has(key)) {
          console.log(`Adding new conversation: ${key}`);
          conversations.push(incoming);
        }
      });
      
      // Re-sort by last message time
      conversations.sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));
    }

    const conversationsWithDetails = await Promise.all(
      conversations
        .filter(conv => conv.partner_id > 0) // Skip invalid IDs
        .map(async (conv) => {
        const table = conv.partner_type === 'lawyer' ? 'lawyers' : 'users';
        let partner = await db(table)
          .select('id', 'name', 'email')
          .where('id', conv.partner_id)
          .first();
        
        // If partner not found, skip this conversation
        if (!partner) {
          // console.warn(`⚠️ Partner not found: ID ${conv.partner_id} in ${table} table - skipping`);
          return null;
        }

        const lastMessage = await db('chat_messages')
          .where(function() {
            this.where({ 
              sender_id: userId, 
              sender_type: userType,
              receiver_id: conv.partner_id,
              receiver_type: conv.partner_type
            }).orWhere({ 
              sender_id: conv.partner_id,
              sender_type: conv.partner_type,
              receiver_id: userId,
              receiver_type: userType
            });
          })
          .orderBy('created_at', 'desc')
          .first();

        return {
          partner_id: conv.partner_id,
          partner_type: conv.partner_type,
          partner_name: partner?.name || 'Unknown User',
          partner_email: partner?.email,
          partner_image: null,
          last_message: lastMessage?.content,
          last_message_time: conv.last_message_time,
          unread_count: conv.unread_count
        };
      })
    );

    // Filter out null entries (conversations with missing partners)
    const validConversations = conversationsWithDetails.filter(conv => conv !== null);
    res.json(validConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch conversations', details: error.message });
  }
});

// Get messages between two users
router.get('/messages/:partnerId/:partnerType', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    // Determine user type by checking which table the user exists in
    let userType = 'user';
    try {
      const lawyer = await db('lawyers').where('id', userId).first();
      if (lawyer) {
        userType = 'lawyer';
      }
    } catch (error) {
      console.error('Error checking lawyer table:', error);
    }
    let { partnerId, partnerType } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Convert secure_id to actual id if needed
    if (partnerType === 'lawyer' && isNaN(partnerId)) {
      const lawyer = await db('lawyers').where('secure_id', partnerId).first();
      if (lawyer) {
        partnerId = lawyer.id;
      }
    } else if (partnerType === 'user' && isNaN(partnerId)) {
      const user = await db('users').where('secure_id', partnerId).first();
      if (user) {
        partnerId = user.id;
      }
    }

    console.log(`Fetching messages between user ${userId} (${userType}) and partner ${partnerId} (${partnerType})`);

    const messages = await db('chat_messages')
      .where(function() {
        this.where({
          sender_id: userId,
          sender_type: userType,
          receiver_id: partnerId,
          receiver_type: partnerType
        }).orWhere({
          sender_id: partnerId,
          sender_type: partnerType,
          receiver_id: userId,
          receiver_type: userType
        });
      })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    console.log(`Found ${messages.length} messages`);
    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mark conversation as read
router.put('/messages/read/:partnerId/:partnerType', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    // Determine user type by checking which table the user exists in
    let userType = 'user';
    try {
      const lawyer = await db('lawyers').where('id', userId).first();
      if (lawyer) {
        userType = 'lawyer';
      }
    } catch (error) {
      console.error('Error checking lawyer table:', error);
    }
    let { partnerId, partnerType } = req.params;

    // Convert secure_id to actual id if needed
    if (partnerType === 'lawyer' && isNaN(partnerId)) {
      const lawyer = await db('lawyers').where('secure_id', partnerId).first();
      if (lawyer) {
        partnerId = lawyer.id;
      }
    } else if (partnerType === 'user' && isNaN(partnerId)) {
      const user = await db('users').where('secure_id', partnerId).first();
      if (user) {
        partnerId = user.id;
      }
    }

    console.log(`Marking messages as read for user ${userId} (${userType}) from partner ${partnerId} (${partnerType})`);

    const result = await db('chat_messages')
      .where({
        sender_id: partnerId,
        sender_type: partnerType,
        receiver_id: userId,
        receiver_type: userType,
        read_status: 0
      })
      .update({ read_status: 1 });

    console.log(`Marked ${result} messages as read`);
    res.json({ success: true, markedCount: result });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get unread message count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    // Determine user type by checking which table the user exists in
    let userType = 'user';
    try {
      const lawyer = await db('lawyers').where('id', userId).first();
      if (lawyer) {
        userType = 'lawyer';
      }
    } catch (error) {
      console.error('Error checking lawyer table:', error);
    }
    
    const unreadCount = await db('chat_messages')
      .where({
        receiver_id: userId,
        receiver_type: userType,
        read_status: 0
      })
      .count('id as count')
      .first();

    res.json({ count: unreadCount.count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// File upload endpoint with security scanning
router.post('/upload', authenticateToken, chatRateLimit, auditLog, upload.single('file'), validateFile, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    
    // Scan file for malicious content
    const scanResult = await scanFile(filePath);
    
    if (!scanResult.safe) {
      // Quarantine malicious file
      await quarantineFile(filePath, scanResult.reason);
      
      return res.status(400).json({ 
        error: 'File blocked by security scan',
        reason: scanResult.reason,
        code: scanResult.code
      });
    }
    
    const fileUrl = `/uploads/chat/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      file_url: fileUrl,
      file_name: req.file.originalname,
      file_size: req.file.size,
      scan_result: {
        safe: true,
        hash: scanResult.hash,
        entropy: scanResult.entropy
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Send message via API with security validation
router.post('/send', authenticateToken, chatRateLimit, auditLog, validateContent, verifyUserAccess, async (req, res) => {
  try {
    let { sender_id, sender_type, receiver_id, receiver_type, content, message_type, file_url, file_name, file_size } = req.body;
    
    // Verify sender is the authenticated user
    if (sender_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized sender' });
    }
    
    // Determine sender type by checking which table the user exists in
    let verifiedSenderType = 'user';
    try {
      const lawyer = await db('lawyers').where('id', sender_id).first();
      if (lawyer) {
        verifiedSenderType = 'lawyer';
      }
    } catch (error) {
      console.error('Error checking sender type:', error);
    }
    
    // Convert secure_id to actual id if needed
    if (receiver_type === 'lawyer' && isNaN(receiver_id)) {
      const lawyer = await db('lawyers').where('secure_id', receiver_id).first();
      if (lawyer) {
        receiver_id = lawyer.id;
      } else {
        return res.status(404).json({ error: 'Lawyer not found' });
      }
    } else if (receiver_type === 'user' && isNaN(receiver_id)) {
      const user = await db('users').where('secure_id', receiver_id).first();
      if (user) {
        receiver_id = user.id;
      } else {
        return res.status(404).json({ error: 'User not found' });
      }
    }
    
    // Encrypt message content
    const encryptionKey = process.env.CHAT_ENCRYPTION_KEY || 'default-key-change-in-production';
    const encryptedContent = encryptMessage(content, encryptionKey);
    
    const [messageId] = await db('chat_messages').insert({
      sender_id,
      sender_type: verifiedSenderType,
      receiver_id,
      receiver_type,
      content: content, // Store original content for now to fix display issue
      message_type: message_type || 'text',
      file_url: file_url || null,
      file_name: file_name || null,
      file_size: file_size || null,
      read_status: false,
      created_at: new Date()
    });

    const message = await db('chat_messages').where('id', messageId).first();
    
    // Return decrypted content to sender
    message.content = content;
    
    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Save call history
router.post('/call-history', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    // Determine user type by checking which table the user exists in
    let userType = 'user';
    try {
      const lawyer = await db('lawyers').where('id', userId).first();
      if (lawyer) {
        userType = 'lawyer';
      }
    } catch (error) {
      console.error('Error checking lawyer table:', error);
    }
    const { partner_id, partner_name, partner_type, duration, timestamp, type } = req.body;

    const [callId] = await db('call_history').insert({
      user_id: userId,
      user_type: userType,
      partner_id,
      partner_name,
      partner_type,
      duration,
      call_type: type,
      created_at: timestamp
    });

    res.json({ success: true, callId });
  } catch (error) {
    console.error('Error saving call history:', error);
    res.status(500).json({ error: 'Failed to save call history' });
  }
});

// Get call history
router.get('/call-history', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    // Determine user type by checking which table the user exists in
    let userType = 'user';
    try {
      const lawyer = await db('lawyers').where('id', userId).first();
      if (lawyer) {
        userType = 'lawyer';
      }
    } catch (error) {
      console.error('Error checking lawyer table:', error);
    }
    
    const calls = await db('call_history')
      .where({ user_id: userId, user_type: userType })
      .orderBy('created_at', 'desc')
      .limit(50);

    res.json(calls);
  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

// Delete conversation
router.delete('/conversation/:partnerId/:partnerType', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    // Determine user type by checking which table the user exists in
    let userType = 'user';
    try {
      const lawyer = await db('lawyers').where('id', userId).first();
      if (lawyer) {
        userType = 'lawyer';
      }
    } catch (error) {
      console.error('Error checking lawyer table:', error);
    }
    const { partnerId, partnerType } = req.params;

    await db('chat_messages')
      .where(function() {
        this.where({
          sender_id: userId,
          sender_type: userType,
          receiver_id: partnerId,
          receiver_type: partnerType
        }).orWhere({
          sender_id: partnerId,
          sender_type: partnerType,
          receiver_id: userId,
          receiver_type: userType
        });
      })
      .delete();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

module.exports = router;