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
    if (!currentUser?.id) return;

    // Connect to socket
    const socket = chatService.connect({ 
      userId: currentUser.id, 
      userType: currentUser.role === 'lawyer' ? 'lawyer' : 'user' 
    });

    // Load conversations
    loadConversations();

    // Check for pending payment link to send
    const pendingPaymentLink = localStorage.getItem('pendingPaymentLink');
    if (pendingPaymentLink) {
      const linkData = JSON.parse(pendingPaymentLink);
      setNewMessage(`💳 Payment Request: ${linkData.service_name} - $${linkData.amount}\n\nSecure Payment Link: ${window.location.origin}${linkData.secure_url}\n\nThis link is for: ${linkData.client_email}`);
      localStorage.removeItem('pendingPaymentLink');
    }

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
  }, [currentUser?.id, currentUser?.role, activeChat]);

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
    
    if (!newMessage.trim() || !activeChat || !currentUser?.id) return;

    const messageData = {
      sender_id: currentUser.id,
      sender_type: currentUser.role === 'lawyer' ? 'lawyer' : 'user',
      receiver_id: activeChat.partner_id,
      receiver_type: activeChat.partner_type,
      content: newMessage.trim()
    };

    // Add message to UI immediately (optimistic update)
    const tempMessage = {
      id: Date.now(),
      ...messageData,
      created_at: new Date().toISOString(),
      read_status: false
    };
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    
    // Send via socket
    chatService.sendMessage(messageData);
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



  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">Messages</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="mb-2">No conversations yet</p>
            <p className="text-sm">Messages will appear here automatically</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={`${conv.partner_id}-${conv.partner_type}`}
              className={`p-3 cursor-pointer rounded-lg mb-2 relative group transition-colors ${
                activeChat?.partner_id === conv.partner_id ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
              }`}
              onClick={() => selectChat(conv)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800">{conv.partner_name}</span>
                <div className="flex items-center gap-2">
                  {onlineUsers.has(conv.partner_id) && <span className="text-green-500 text-xs">●</span>}
                  <button
                    onClick={(e) => deleteChat(conv, e)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded px-1 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete conversation"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600 truncate mt-1">{conv.last_message || 'Start messaging'}</div>
              {conv.unread_count > 0 && (
                <span className="absolute top-2 right-8 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {conv.unread_count}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="w-2/3 flex flex-col">
        {activeChat ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h4 className="font-semibold text-gray-800">{activeChat.partner_name}</h4>
              <div className="text-sm text-gray-600">
                {onlineUsers.has(activeChat.partner_id) && <span className="text-green-500">● Online</span>}
                {typingUsers.has(activeChat.partner_id) && <span className="text-blue-500 ml-2">Typing...</span>}
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`inline-block p-3 rounded-lg max-w-xs break-words shadow-sm ${
                    message.sender_id === currentUser?.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}>
                    {message.content.includes('💳 Payment Request:') ? (
                      <div className="space-y-2">
                        <div className="font-semibold text-sm">💳 Payment Request</div>
                        <div className="whitespace-pre-line text-sm break-words">
                          {message.content.replace('💳 Payment Request:', '').split('\n').map((line, index) => {
                            const urlRegex = /(https?:\/\/[^\s]+)/g;
                            const parts = line.split(urlRegex);
                            return (
                              <div key={index}>
                                {parts.map((part, partIndex) => {
                                  if (urlRegex.test(part)) {
                                    return (
                                      <a
                                        key={partIndex}
                                        href={part}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`underline hover:no-underline break-all ${
                                          message.sender_id === currentUser?.id ? 'text-blue-100' : 'text-blue-600'
                                        }`}
                                      >
                                        {part}
                                      </a>
                                    );
                                  }
                                  return part;
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="break-words">
                        {message.content.split('\n').map((line, index) => {
                          const urlRegex = /(https?:\/\/[^\s]+)/g;
                          const parts = line.split(urlRegex);
                          return (
                            <div key={index}>
                              {parts.map((part, partIndex) => {
                                if (urlRegex.test(part)) {
                                  return (
                                    <a
                                      key={partIndex}
                                      href={part}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`underline hover:no-underline break-all ${
                                        message.sender_id === currentUser?.id ? 'text-blue-100' : 'text-blue-600'
                                      }`}
                                    >
                                      {part}
                                    </a>
                                  );
                                }
                                return part;
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="text-xs mt-2 opacity-75">
                      {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                    </div>
                  </div>
                </div>
              ))}}

            </div>

            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
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
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sendMessage(e);
                  }}
                  disabled={!newMessage.trim()}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    newMessage.trim() 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Send
                </button>
              </div>
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