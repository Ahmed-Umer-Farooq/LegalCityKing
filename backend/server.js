require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('./config/passport');
const { generateCSRFToken, getCSRFToken } = require('./utils/csrf');
const authRoutes = require('./routes/auth');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// Security middleware - DISABLED FOR DEVELOPMENT
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'", "https:"],
//       scriptSrc: ["'self'", "'unsafe-inline'"],
//       imgSrc: ["'self'", "data:", "https:"],
//       connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*", "https://localhost:*"],
//     },
//   },
// }));

// Rate limiting - DISABLED FOR DEVELOPMENT
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use('/api/', limiter);

// // Stricter rate limiting for auth endpoints
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: 'Too many authentication attempts, please try again later.',
// });
// app.use('/api/auth/login', authLimiter);
// app.use('/api/auth/register', authLimiter);

// Socket.io setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy (needed if behind reverse proxy for correct secure cookies)
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

// Session for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
  },
  name: 'sessionId', // Don't use default session name
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// CSRF token generation - DISABLED FOR DEVELOPMENT
// if (process.env.NODE_ENV === 'production') {
//   app.use(generateCSRFToken);
// }

// All security headers disabled for development
console.log('🔧 Backend Security: ALL FEATURES DISABLED FOR DEVELOPMENT');

// CSRF token endpoint
app.get('/api/csrf-token', getCSRFToken);

// Static file serving for uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('📁 Serving uploads from:', path.join(__dirname, 'uploads'));

// Routes
app.use('/api/auth', authRoutes);

// Working admin endpoints
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await db('users').count('id as count').first();
    const totalLawyers = await db('lawyers').count('id as count').first();
    const verifiedLawyers = await db('lawyers').where('is_verified', 1).count('id as count').first();
    const unverifiedLawyers = await db('lawyers').where('is_verified', 0).count('id as count').first();
    
    res.json({
      stats: {
        totalUsers: totalUsers.count || 0,
        totalLawyers: totalLawyers.count || 0,
        verifiedLawyers: verifiedLawyers.count || 0,
        unverifiedLawyers: unverifiedLawyers.count || 0
      },
      recentUsers: [],
      recentLawyers: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await db('users').select('*').limit(10);
    res.json({ users, pagination: { page: 1, limit: 10, total: users.length, totalPages: 1 } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/lawyers', async (req, res) => {
  try {
    const lawyers = await db('lawyers').select('*').limit(10);
    res.json({ lawyers, pagination: { page: 1, limit: 10, total: lawyers.length, totalPages: 1 } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Real-time call tracking
app.get('/api/admin/active-calls', async (req, res) => {
  try {
    console.log('Admin requesting active calls. Total active users:', activeUsers.size);
    
    // Get currently active calls from memory
    const activeCalls = Array.from(activeUsers.entries())
      .filter(([userId, userInfo]) => {
        console.log(`User ${userId}: inCall=${userInfo.inCall}`);
        return userInfo.inCall;
      })
      .map(([userId, userInfo]) => ({
        userId,
        userName: userInfo.userName,
        userType: userInfo.userType,
        callStartTime: userInfo.callStartTime,
        partnerId: userInfo.partnerId,
        partnerName: userInfo.partnerName
      }));
    
    console.log('Active calls found:', activeCalls.length);
    res.json(activeCalls);
  } catch (error) {
    console.error('Error fetching active calls:', error);
    res.status(500).json({ error: 'Failed to fetch active calls' });
  }
});

// Call history and statistics
app.get('/api/admin/call-stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [totalCalls, todayCalls, avgDuration] = await Promise.all([
      db('call_history').count('id as count').first(),
      db('call_history').where('created_at', '>=', today).count('id as count').first(),
      db('call_history').avg('duration as avg').first()
    ]);
    
    const recentCalls = await db('call_history')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(20);
    
    res.json({
      totalCalls: totalCalls.count || 0,
      todayCalls: todayCalls.count || 0,
      avgDuration: Math.round(avgDuration.avg || 0),
      recentCalls
    });
  } catch (error) {
    console.error('Error fetching call stats:', error);
    res.status(500).json({ error: 'Failed to fetch call stats' });
  }
});

app.get('/api/admin/chat-messages', async (req, res) => {
  try {
    const messages = await db('chat_messages')
      .leftJoin('users as sender_users', function() {
        this.on('chat_messages.sender_id', '=', 'sender_users.id')
            .andOn('chat_messages.sender_type', '=', db.raw('?', ['user']));
      })
      .leftJoin('lawyers as sender_lawyers', function() {
        this.on('chat_messages.sender_id', '=', 'sender_lawyers.id')
            .andOn('chat_messages.sender_type', '=', db.raw('?', ['lawyer']));
      })
      .leftJoin('users as receiver_users', function() {
        this.on('chat_messages.receiver_id', '=', 'receiver_users.id')
            .andOn('chat_messages.receiver_type', '=', db.raw('?', ['user']));
      })
      .leftJoin('lawyers as receiver_lawyers', function() {
        this.on('chat_messages.receiver_id', '=', 'receiver_lawyers.id')
            .andOn('chat_messages.receiver_type', '=', db.raw('?', ['lawyer']));
      })
      .select(
        'chat_messages.id',
        'chat_messages.content as message',
        'chat_messages.created_at',
        db.raw('COALESCE(sender_users.name, sender_lawyers.name) as sender_name'),
        db.raw('COALESCE(sender_users.email, sender_lawyers.email) as sender_email'),
        db.raw('COALESCE(receiver_users.name, receiver_lawyers.name) as receiver_name'),
        db.raw('COALESCE(receiver_users.email, receiver_lawyers.email) as receiver_email'),
        'chat_messages.sender_type',
        'chat_messages.receiver_type'
      )
      .orderBy('chat_messages.created_at', 'desc')
      .limit(50);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

app.get('/api/admin/call-history', async (req, res) => {
  try {
    console.log('Admin call history endpoint hit');
    
    // Check if table exists and has data
    const tableExists = await db.schema.hasTable('call_history');
    console.log('call_history table exists:', tableExists);
    
    if (!tableExists) {
      return res.json([]);
    }
    
    const calls = await db('call_history')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(100);
    
    console.log('Call history found:', calls.length, 'calls');
    console.log('Sample call data:', calls[0]);
    res.json(calls);
  } catch (error) {
    console.error('Error fetching admin call history:', error);
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

const adminRoutes = require('./routes/admin');
console.log('🔍 Loading admin routes at /api/admin');
app.use('/api/admin', adminRoutes);
console.log('✅ Admin routes loaded');
const lawyerRoutes = require('./routes/lawyers');
app.use('/api/lawyers', lawyerRoutes);
const lawyerDashboardRoutes = require('./routes/lawyerDashboard');
app.use('/api/lawyer', lawyerDashboardRoutes);

// New dashboard routes
const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRoutes);
const casesRoutes = require('./routes/cases');
app.use('/api/cases', casesRoutes);
const clientsRoutes = require('./routes/clients');
app.use('/api/clients', clientsRoutes);
const eventsRoutes = require('./routes/events');
app.use('/api/events', eventsRoutes);
const tasksRoutes = require('./routes/tasks');
app.use('/api/tasks', tasksRoutes);
const documentsRoutes = require('./routes/documents');
app.use('/api/documents', documentsRoutes);
const invoicesRoutes = require('./routes/invoices');
app.use('/api/invoices', invoicesRoutes);
const timeEntriesRoutes = require('./routes/timeEntries');
app.use('/api/time-entries', timeEntriesRoutes);
const expensesRoutes = require('./routes/expenses');
app.use('/api/expenses', expensesRoutes);
const notesRoutes = require('./routes/notes');
app.use('/api/notes', notesRoutes);
const contactsRoutes = require('./routes/contacts');
app.use('/api/contacts', contactsRoutes);
const callsRoutes = require('./routes/calls');
app.use('/api/calls', callsRoutes);
const messagesRoutes = require('./routes/messages');
app.use('/api/messages', messagesRoutes);
const paymentsRoutes = require('./routes/payments');
app.use('/api/payments', paymentsRoutes);
const intakesRoutes = require('./routes/intakes');
app.use('/api/intakes', intakesRoutes);
const blogsRoutes = require('./routes/blogs');
app.use('/api/blogs', blogsRoutes);
const uploadRoutes = require('./routes/upload');
app.use('/api/upload', uploadRoutes);

// Chat routes
const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);

// Store active users
const activeUsers = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('user_connected', async (data) => {
    const userId = typeof data === 'object' ? data.userId : data;
    const userType = typeof data === 'object' ? data.userType : 'user';
    
    // Get user name for admin tracking
    let userName = 'Unknown';
    try {
      const table = userType === 'lawyer' ? 'lawyers' : 'users';
      const user = await db(table).select('name').where('id', userId).first();
      userName = user?.name || 'Unknown';
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
    
    // Store user with their type and call status
    activeUsers.set(userId, { 
      socketId: socket.id, 
      userType, 
      userName,
      inCall: false,
      callStartTime: null,
      partnerId: null,
      partnerName: null
    });
    console.log(`User ${userId} (${userType}) connected with socket ${socket.id}`);
    io.emit('user_status', { userId, status: 'online' });
    
    // Send current unread count to user
    try {
      const unreadCount = await db('chat_messages')
        .where({ receiver_id: userId, receiver_type: userType, read_status: 0 })
        .count('id as count')
        .first();
      socket.emit('unread_count_update', { count: unreadCount.count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  });

  socket.on('send_message', async (data) => {
    try {
      const { sender_id, sender_type, receiver_id, receiver_type, content, message_type, file_url, file_name, file_size } = data;
      
      const [messageId] = await db('chat_messages').insert({
        sender_id,
        sender_type,
        receiver_id,
        receiver_type,
        content,
        message_type: message_type || 'text',
        file_url: file_url || null,
        file_name: file_name || null,
        file_size: file_size || null,
        read_status: false,
        created_at: new Date()
      });

      const message = await db('chat_messages').where('id', messageId).first();
      
      // Send to receiver if online
      const receiverInfo = activeUsers.get(receiver_id);
      const receiverSocketId = receiverInfo?.socketId;
      console.log(`Looking for receiver ${receiver_id} (${receiver_type}), found socket: ${receiverSocketId}`);
      console.log('Active users:', Array.from(activeUsers.keys()));
      
      if (receiverSocketId) {
        console.log(`Sending message to receiver socket ${receiverSocketId}`);
        io.to(receiverSocketId).emit('receive_message', message);
        // Force refresh conversations for receiver
        io.to(receiverSocketId).emit('refresh_conversations');
        // Send updated unread count to receiver
        const unreadCount = await db('chat_messages')
          .where({ receiver_id, receiver_type, read_status: 0 })
          .count('id as count')
          .first();
        io.to(receiverSocketId).emit('unread_count_update', { count: unreadCount.count });
      } else {
        console.log(`Receiver ${receiver_id} is not online`);
      }
      
      // Send confirmation to sender
      socket.emit('message_sent', message);
      
      // Force refresh conversations for sender
      socket.emit('refresh_conversations');
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  socket.on('mark_as_read', async (data) => {
    try {
      const { messageIds, userId, userType, partnerId, partnerType } = data;
      
      if (messageIds) {
        await db('chat_messages').whereIn('id', messageIds).update({ read_status: true });
      } else if (partnerId && partnerType) {
        // Mark all messages from specific partner as read
        await db('chat_messages')
          .where({
            sender_id: partnerId,
            sender_type: partnerType,
            receiver_id: userId,
            receiver_type: userType,
            read_status: 0
          })
          .update({ read_status: 1 });
      }
      
      socket.emit('messages_marked_read', { messageIds });
      
      // Send updated unread count
      if (userId && userType) {
        const unreadCount = await db('chat_messages')
          .where({ receiver_id: userId, receiver_type: userType, read_status: 0 })
          .count('id as count')
          .first();
        socket.emit('unread_count_update', { count: unreadCount.count });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  socket.on('typing', (data) => {
    const { receiver_id } = data;
    const receiverInfo = activeUsers.get(receiver_id);
    const receiverSocketId = receiverInfo?.socketId;
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', {
        sender_id: data.sender_id,
        isTyping: true
      });
    }
  });

  socket.on('stop_typing', (data) => {
    const { receiver_id } = data;
    const receiverInfo = activeUsers.get(receiver_id);
    const receiverSocketId = receiverInfo?.socketId;
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', {
        sender_id: data.sender_id,
        isTyping: false
      });
    }
  });

  // WebRTC Voice Call Signaling
  socket.on('voice_call_offer', (data) => {
    const receiverInfo = activeUsers.get(data.to);
    if (receiverInfo) {
      io.to(receiverInfo.socketId).emit('voice_call_offer', data);
    }
  });

  socket.on('voice_call_answer', (data) => {
    const receiverInfo = activeUsers.get(data.to);
    const callerInfo = activeUsers.get(data.from);
    
    if (receiverInfo && callerInfo) {
      // Mark both users as in call
      const callStartTime = new Date();
      
      activeUsers.set(data.to, {
        ...receiverInfo,
        inCall: true,
        callStartTime,
        partnerId: data.from,
        partnerName: callerInfo.userName || 'Unknown'
      });
      
      activeUsers.set(data.from, {
        ...callerInfo,
        inCall: true,
        callStartTime,
        partnerId: data.to,
        partnerName: receiverInfo.userName || 'Unknown'
      });
      
      io.to(receiverInfo.socketId).emit('voice_call_answer', data);
      
      console.log(`📞 Call started between ${callerInfo.userType} (${data.from}) and ${receiverInfo.userType} (${data.to})`);
      
      // Notify admin panel of new active call
      io.emit('admin_call_update', {
        type: 'call_started',
        users: [data.from, data.to],
        startTime: callStartTime
      });
    }
  });

  socket.on('ice_candidate', (data) => {
    const receiverInfo = activeUsers.get(data.to);
    if (receiverInfo) {
      io.to(receiverInfo.socketId).emit('ice_candidate', data);
    }
  });

  socket.on('end_call', (data) => {
    const receiverInfo = activeUsers.get(data.to);
    const callerInfo = activeUsers.get(data.from);
    
    // Clear call status for both users
    if (receiverInfo) {
      activeUsers.set(data.to, {
        ...receiverInfo,
        inCall: false,
        callStartTime: null,
        partnerId: null,
        partnerName: null
      });
      // Only send to the OTHER user, not the one who ended the call
      io.to(receiverInfo.socketId).emit('call_ended', data);
    }
    
    if (callerInfo) {
      activeUsers.set(data.from, {
        ...callerInfo,
        inCall: false,
        callStartTime: null,
        partnerId: null,
        partnerName: null
      });
      // Don't send call_ended back to the user who initiated end_call
    }
    
    const fromUserType = callerInfo?.userType || 'unknown';
    const toUserType = receiverInfo?.userType || 'unknown';
    console.log(`📞 Call ended between ${fromUserType} (${data.from}) and ${toUserType} (${data.to})`);
    
    // Notify admin panel of call ended
    io.emit('admin_call_update', {
      type: 'call_ended',
      users: [data.from, data.to]
    });
  });

  socket.on('call_rejected', (data) => {
    const receiverInfo = activeUsers.get(data.to);
    if (receiverInfo) {
      io.to(receiverInfo.socketId).emit('call_rejected', data);
    }
  });

  socket.on('disconnect', () => {
    for (let [userId, userInfo] of activeUsers.entries()) {
      if (userInfo.socketId === socket.id) {
        activeUsers.delete(userId);
        io.emit('user_status', { userId, status: 'offline' });
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Legacy blog endpoints for compatibility
const blogController = require('./controllers/blogController');
const { requireAuth, requireLawyer } = require('./utils/middleware');
app.get('/api/blog-categories', blogController.getBlogCategories);
app.get('/api/blog-tags', blogController.getBlogTags);
app.get('/api/blog-authors', blogController.getTopAuthors);
app.get('/api/popular-blogs', blogController.getPopularPosts);

// Lawyer blog management route
app.get('/api/lawyer/blogs', requireAuth, requireLawyer, blogController.getLawyerBlogs);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Legal City API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ message: 'Internal server error' });
  } else {
    res.status(500).json({ 
      message: 'Something went wrong!', 
      error: err.message,
      stack: err.stack 
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Verify email transporter connection
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      console.log('❌ Email transporter verification failed:', error.message);
    } else {
      console.log('✅ Email transporter is ready to send emails');
    }
  });
});

module.exports = app;
