import React, { useState, useEffect, useRef } from 'react';
import chatService from '../utils/chatService';

const Chat = ({ currentUser }) => {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Connect to socket
    const socket = chatService.connect({ 
      userId: currentUser.id, 
      userType: currentUser.role === 'lawyer' ? 'lawyer' : 'user' 
    });

    // Load conversations
    loadConversations();

    // Socket event listeners
    chatService.onMessageReceived((message) => {
      if (activeChat && 
          ((message.sender_id === activeChat.partner_id && message.sender_type === activeChat.partner_type) ||
           (message.receiver_id === activeChat.partner_id && message.receiver_type === activeChat.partner_type))) {
        setMessages(prev => [...prev, message]);
        // Auto-mark as read if chat is active
        chatService.markAsRead(activeChat.partner_id, activeChat.partner_type);
      }
      loadConversations(); // Refresh conversations
    });

    chatService.onMessageSent((message) => {
      setMessages(prev => [...prev, message]);
      loadConversations(); // Refresh conversations
    });

    chatService.onUserStatus(({ userId, status }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (status === 'online') {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    chatService.onTyping(({ userId, isTyping }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    // Listen for refresh events
    chatService.onRefreshConversations(() => {
      loadConversations();
    });

    return () => {
      chatService.disconnect();
    };
  }, [currentUser.id, currentUser.role, activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const convs = await chatService.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (partnerId, partnerType) => {
    try {
      const msgs = await chatService.getMessages(partnerId, partnerType);
      setMessages(msgs);
      // Mark as read
      await chatService.markAsRead(partnerId, partnerType);
      loadConversations(); // Refresh to update unread counts
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!newMessage.trim() || !activeChat) return;

    const messageData = {
      sender_id: currentUser.id,
      sender_type: currentUser.role === 'lawyer' ? 'lawyer' : 'user',
      receiver_id: activeChat.partner_id,
      receiver_type: activeChat.partner_type,
      content: newMessage.trim()
    };

    chatService.sendMessage(messageData);
    setNewMessage('');
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (activeChat) {
      chatService.sendTyping(activeChat.partner_id);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        chatService.stopTyping(activeChat.partner_id);
      }, 1000);
    }
  };

  const selectChat = (conversation) => {
    setActiveChat(conversation);
    loadMessages(conversation.partner_id, conversation.partner_type);
  };

  const deleteChat = async (conversation, e) => {
    e.stopPropagation();
    if (window.confirm(`Delete conversation with ${conversation.partner_name}?`)) {
      try {
        await chatService.deleteConversation(conversation.partner_id, conversation.partner_type);
        if (activeChat?.partner_id === conversation.partner_id) {
          setActiveChat(null);
          setMessages([]);
        }
        loadConversations();
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex h-96 bg-white rounded-lg shadow-md">
      <div className="w-1/3 border-r border-gray-200 p-4">
        <h3 className="text-lg font-semibold mb-4">Conversations</h3>
        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="mb-2">No conversations yet</p>
            <p className="text-sm">Messages will appear here automatically</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={`${conv.partner_id}-${conv.partner_type}`}
              className={`p-3 cursor-pointer rounded-lg mb-2 relative group ${activeChat?.partner_id === conv.partner_id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
              onClick={() => selectChat(conv)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{conv.partner_name}</span>
                <div className="flex items-center gap-2">
                  {onlineUsers.has(conv.partner_id) && <span className="text-green-500">●</span>}
                  <button
                    onClick={(e) => deleteChat(conv, e)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded px-1 text-lg font-bold"
                    title="Delete conversation"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600 truncate">{conv.last_message || 'Tap to start messaging'}</div>
              {conv.unread_count > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">{conv.unread_count}</span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="w-2/3 flex flex-col">
        {activeChat ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-semibold">{activeChat.partner_name}</h4>
              <div className="text-sm">
                {onlineUsers.has(activeChat.partner_id) && <span className="text-green-500">Online</span>}
                {typingUsers.has(activeChat.partner_id) && <span className="text-blue-500 ml-2">Typing...</span>}
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-3 ${message.sender_id === currentUser.id ? 'text-right' : 'text-left'}`}
                >
                  <div className={`inline-block p-3 rounded-lg max-w-xs ${
                    message.sender_id === currentUser.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {message.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 flex">
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    sendMessage(e);
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 mr-2"
              />
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  sendMessage(e);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="mb-2">Welcome to Legal City Chat</p>
              <p className="text-sm">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;