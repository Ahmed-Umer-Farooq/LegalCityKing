# Chat System Documentation

## Overview

The Chat System is a comprehensive real-time communication platform designed specifically for legal professionals and their clients. It provides secure, encrypted messaging, voice calling capabilities, file sharing, and conversation management within the Legal City platform. Built with modern web technologies, it ensures attorney-client privilege compliance and secure communication channels.

## Key Features

- **Real-time Messaging**: Instant text communication with typing indicators
- **Voice Calling**: WebRTC-based voice communication with call history
- **File Sharing**: Secure document exchange with malware scanning
- **Message Encryption**: End-to-end message security and privacy
- **Conversation Management**: Organized chat history and search functionality
- **User Status**: Online/offline presence indicators
- **Security Features**: Rate limiting, spam detection, and content validation
- **Cross-Platform**: Works across user and lawyer dashboards

## System Architecture

### Technology Stack
- **Frontend**: React with hooks and real-time updates
- **Backend**: Node.js with Express and Socket.io
- **Database**: MySQL with Knex.js query builder
- **Real-time Communication**: Socket.io for WebSocket connections
- **Voice Calling**: WebRTC with STUN/TURN servers
- **File Storage**: Secure local file system with scanning
- **Security**: AES-256 encryption and content validation

### Component Structure
```
Chat System/
├── Frontend Components
│   ├── ChatPage (Main chat interface)
│   ├── ChatService (WebSocket client)
│   ├── Message Components
│   └── Voice Call Components
├── Backend Services
│   ├── Chat Routes (REST API)
│   ├── Socket Handlers (Real-time events)
│   ├── Security Middleware
│   └── File Upload System
├── Database Tables
│   ├── chat_messages
│   ├── call_history
│   └── user status tracking
└── Security Features
    ├── Message Encryption
    ├── Content Validation
    └── Rate Limiting
```

## Core Features

### 1. Real-time Messaging

#### Message Types
**Text Messages:**
- **Instant Delivery**: Real-time message transmission
- **Typing Indicators**: User activity feedback
- **Read Receipts**: Message delivery confirmation
- **Message Status**: Sending, sent, delivered, read states

**File Messages:**
- **Document Sharing**: PDF, Word, text files
- **Image Sharing**: JPEG, PNG, GIF formats
- **File Validation**: Size and type restrictions
- **Security Scanning**: Malware detection and quarantine

#### Message Features
```javascript
// Message Data Structure
const message = {
  id: 'unique_message_id',
  sender_id: userId,
  sender_type: 'user|lawyer',
  receiver_id: partnerId,
  receiver_type: 'user|lawyer',
  content: 'encrypted_message_content',
  message_type: 'text|file',
  file_url: '/uploads/chat/filename.pdf',
  file_name: 'document.pdf',
  file_size: 1024000,
  read_status: false,
  created_at: '2024-01-01T12:00:00Z'
};
```

### 2. Voice Calling System

#### WebRTC Implementation
**Call Features:**
- **Audio Calling**: High-quality voice communication
- **Call States**: Ringing, connected, on hold, ended
- **Mute Controls**: Local audio muting capability
- **Call Duration**: Real-time call timer
- **Connection Quality**: Network status monitoring

**Call Flow:**
```javascript
// Call Initiation Process
1. User clicks voice call button
2. Request user media permissions
3. Create WebRTC peer connection
4. Generate offer and send via Socket.io
5. Receiver accepts/rejects call
6. Establish peer-to-peer connection
7. Start call timer and audio streaming
```

#### Call History
**Tracking Features:**
- **Call Logs**: Complete call history with metadata
- **Duration Recording**: Automatic call length tracking
- **Participant Information**: Caller and receiver details
- **Call Types**: Voice call classification
- **Timestamp Recording**: Exact call timing

### 3. Conversation Management

#### Conversation List
**Organization Features:**
- **Partner Display**: Contact name and avatar
- **Last Message Preview**: Recent conversation content
- **Unread Count**: New message indicators
- **Online Status**: User availability indicators
- **Message Timestamp**: Last activity time

#### Search and Filtering
**Discovery Features:**
- **Conversation Search**: Find chats by participant name
- **Message Search**: Content-based message lookup
- **Date Filtering**: Time-based conversation filtering
- **Unread Filter**: Focus on active conversations

#### Conversation Actions
**Management Features:**
- **Delete Conversations**: Remove entire chat history
- **Mark as Read**: Clear unread message indicators
- **Archive Conversations**: Store inactive chats
- **Export History**: Download conversation records

### 4. User Presence System

#### Online Status
**Status Features:**
- **Real-time Updates**: Live user availability
- **Status Indicators**: Visual online/offline display
- **Last Seen**: Recent activity timestamps
- **Status Persistence**: Maintain status across sessions

#### Status Management
```javascript
// User Status States
const userStatus = {
  online: 'Currently active and available',
  offline: 'Not currently online',
  away: 'Temporarily away',
  busy: 'In a call or meeting',
  invisible: 'Appear offline to others'
};
```

## Security Implementation

### Message Encryption
**Encryption Features:**
- **AES-256-CBC**: Strong symmetric encryption
- **Random IV**: Unique initialization vectors
- **Key Management**: Secure encryption key handling
- **Content Protection**: Message confidentiality

**Encryption Process:**
```javascript
// Message Encryption Flow
const encryptMessage = (content, key) => {
  const algorithm = 'aes-256-cbc';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(content, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};
```

### Content Validation
**Security Filters:**
- **Spam Detection**: Pattern-based spam identification
- **Malicious Links**: URL validation and blocking
- **Content Length**: Message size restrictions
- **Character Validation**: Input sanitization

**Spam Patterns:**
```javascript
const spamPatterns = [
  /\b(viagra|cialis|casino|lottery)\b/i,
  /\b(click here|free money|make money fast)\b/i,
  /\b(nigerian prince|inheritance|million dollars)\b/i,
  /(.)\1{10,}/, // Repeated characters
  /[A-Z]{5,}.*[A-Z]{5,}/ // Excessive caps
];
```

### Rate Limiting
**Protection Features:**
- **Message Limits**: 30 messages per minute per user
- **File Upload Limits**: Size and frequency restrictions
- **Connection Limits**: WebSocket connection throttling
- **IP-based Blocking**: Suspicious activity detection

### File Security
**Upload Protection:**
- **Type Validation**: Allowed file format restrictions
- **Size Limits**: 10MB maximum file size
- **Malware Scanning**: Automated threat detection
- **Quarantine System**: Suspicious file isolation

## API Endpoints

### REST API Routes

#### Conversation Management
```javascript
// Get user conversations
GET /api/chat/conversations
Headers: { Authorization: Bearer <token> }
Response: Array of conversation objects

// Get messages between users
GET /api/chat/messages/:partnerId/:partnerType
Query: { limit: 50, offset: 0 }
Response: Array of message objects

// Mark conversation as read
PUT /api/chat/messages/read/:partnerId/:partnerType
Response: { success: true, markedCount: number }

// Get unread message count
GET /api/chat/unread-count
Response: { count: number }
```

#### File Operations
```javascript
// Upload file attachment
POST /api/chat/upload
Content-Type: multipart/form-data
Body: { file: <file> }
Response: { file_url: string, file_name: string, file_size: number }

// Send message with file
POST /api/chat/send
Body: {
  sender_id: number,
  sender_type: 'user|lawyer',
  receiver_id: number,
  receiver_type: 'user|lawyer',
  content: string,
  message_type: 'file',
  file_url: string,
  file_name: string,
  file_size: number
}
```

#### Call Management
```javascript
// Save call history
POST /api/chat/call-history
Body: {
  partner_id: number,
  partner_name: string,
  partner_type: 'user|lawyer',
  duration: number,
  timestamp: string,
  type: 'voice'
}

// Get call history
GET /api/chat/call-history
Response: Array of call records
```

### WebSocket Events

#### Connection Events
```javascript
// User connection
socket.emit('user_connected', {
  userId: number,
  userType: 'user|lawyer'
});

// Connection status
socket.on('connect', () => { /* Connected */ });
socket.on('disconnect', () => { /* Disconnected */ });
```

#### Message Events
```javascript
// Send message
socket.emit('send_message', messageData);

// Receive message
socket.on('receive_message', (message) => {
  // Handle incoming message
});

// Message delivery confirmation
socket.on('message_sent', (message) => {
  // Update message status
});

// Message error
socket.on('message_error', (error) => {
  // Handle send failure
});
```

#### Voice Call Events
```javascript
// Initiate voice call
socket.emit('voice_call_offer', {
  offer: RTCSessionDescription,
  to: partnerId,
  from: userId,
  fromName: userName,
  toName: partnerName
});

// Receive call offer
socket.on('voice_call_offer', (data) => {
  // Show incoming call UI
});

// Accept call
socket.emit('voice_call_answer', {
  answer: RTCSessionDescription,
  to: callerId,
  from: userId
});

// ICE candidate exchange
socket.emit('ice_candidate', {
  candidate: RTCIceCandidate,
  to: partnerId,
  from: userId
});

// End call
socket.emit('end_call', {
  to: partnerId,
  from: userId
});
```

## Database Schema

### Chat Messages Table
```sql
CREATE TABLE chat_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sender_id INT NOT NULL,
  sender_type ENUM('user', 'lawyer') NOT NULL,
  receiver_id INT NOT NULL,
  receiver_type ENUM('user', 'lawyer') NOT NULL,
  content TEXT,
  message_type ENUM('text', 'file') DEFAULT 'text',
  file_url VARCHAR(500),
  file_name VARCHAR(255),
  file_size INT,
  read_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conversation (sender_id, receiver_id, sender_type, receiver_type),
  INDEX idx_created_at (created_at),
  INDEX idx_read_status (read_status)
);
```

### Call History Table
```sql
CREATE TABLE call_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  user_type ENUM('user', 'lawyer') NOT NULL,
  partner_id INT NOT NULL,
  partner_name VARCHAR(255),
  partner_type ENUM('user', 'lawyer') NOT NULL,
  duration INT NOT NULL, -- in seconds
  call_type ENUM('voice', 'video') DEFAULT 'voice',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id, user_type),
  INDEX idx_created_at (created_at)
);
```

## Frontend Implementation

### Chat Service Class
```javascript
class ChatService {
  constructor() {
    this.socket = null;
  }

  connect(userData) {
    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      this.socket.emit('user_connected', userData);
    });

    return this.socket;
  }

  sendMessage(messageData) {
    if (this.socket?.connected) {
      this.socket.emit('send_message', messageData);
      return true;
    }
    return false;
  }

  // Additional methods for conversations, messages, etc.
}
```

### React Components

#### ChatPage Component
```javascript
const ChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isInCall, setIsInCall] = useState(false);

  useEffect(() => {
    // Initialize chat service
    const socket = chatService.connect(userData);
    
    // Load conversations
    loadConversations();
    
    // Set up event listeners
    setupSocketListeners(socket);
    
    return () => {
      chatService.disconnect();
    };
  }, []);

  // Component implementation
};
```

## Security Considerations

### Data Protection
- **Message Encryption**: All messages encrypted at rest and in transit
- **File Scanning**: Automated malware detection for uploads
- **Rate Limiting**: Protection against abuse and spam
- **Input Validation**: Comprehensive content and format validation

### Privacy Compliance
- **Attorney-Client Privilege**: Legal communication confidentiality
- **Data Retention**: Configurable message history storage
- **Access Controls**: User-specific conversation isolation
- **Audit Logging**: Security event monitoring and logging

### Network Security
- **WebSocket Security**: Secure WebSocket connections
- **CORS Configuration**: Cross-origin request protection
- **IP Filtering**: Geographic and IP-based access controls
- **Session Management**: Secure authentication token handling

## Performance Optimization

### Frontend Optimizations
- **Lazy Loading**: Component-based code splitting
- **Message Pagination**: Efficient large conversation handling
- **Virtual Scrolling**: Performance for long message lists
- **Connection Pooling**: Optimized WebSocket connections

### Backend Optimizations
- **Database Indexing**: Optimized query performance
- **Message Caching**: Frequently accessed conversation caching
- **File Compression**: Optimized file storage and transfer
- **Load Balancing**: Distributed WebSocket connections

### Real-time Performance
- **Message Batching**: Reduced network overhead
- **Connection Monitoring**: Automatic reconnection handling
- **Resource Cleanup**: Memory leak prevention
- **Bandwidth Optimization**: Compressed message transmission

## Troubleshooting Guide

### Connection Issues

1. **WebSocket Connection Failed**
   - Check network connectivity
   - Verify firewall settings
   - Update browser to latest version
   - Check WebSocket server status

2. **Messages Not Sending**
   - Verify user authentication
   - Check rate limiting status
   - Validate message content
   - Review network connection

3. **Voice Call Issues**
   - Check microphone permissions
   - Verify WebRTC support
   - Test network bandwidth
   - Check firewall settings

### Performance Issues

1. **Slow Message Loading**
   - Clear browser cache
   - Check database performance
   - Review network latency
   - Optimize message pagination

2. **High Memory Usage**
   - Close unused browser tabs
   - Clear message cache
   - Update browser version
   - Check for memory leaks

### Security Alerts

1. **Message Blocked**
   - Review content for spam patterns
   - Check for malicious links
   - Verify file attachments
   - Contact support if legitimate

2. **Rate Limit Exceeded**
   - Reduce message frequency
   - Wait for limit reset
   - Contact support for increases
   - Check for automated sending

## Future Enhancements

- **Video Calling**: Full video conference capabilities
- **Group Chats**: Multi-party conversations
- **Message Reactions**: Emoji and reaction support
- **Advanced File Sharing**: Cloud storage integration
- **Message Scheduling**: Scheduled message delivery
- **Translation Features**: Multi-language support
- **Voice Messages**: Audio message recording
- **Screen Sharing**: Visual collaboration tools

## Conclusion

The Chat System provides a secure, reliable, and feature-rich communication platform specifically designed for legal professionals and their clients. Its comprehensive security measures, real-time capabilities, and professional features ensure confidential and efficient attorney-client communication within the Legal City platform.
