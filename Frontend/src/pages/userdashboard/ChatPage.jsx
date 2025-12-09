import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import chatService from '../../utils/chatService';
import { Send, Search, MoreVertical, Phone, Paperclip, CheckCheck, MessageCircle, Mic, MicOff } from 'lucide-react';

const ChatPage = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isInCall, setIsInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callHistory, setCallHistory] = useState([]);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const userType = (user?.role === 'lawyer' || user?.registration_id || window.location.pathname.includes('lawyer')) ? 'lawyer' : 'user';

  useEffect(() => {
    if (!user) return;

    console.log('🚀 Chat initialized for user:', user.id, 'as type:', userType);
    
    chatService.disconnect();
    
    const socketInstance = chatService.connect({ 
      userId: user.id, 
      userType: userType 
    });
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setConnectionAttempts(0);
      console.log('✅ Socket connected!');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      setConnectionAttempts(prev => prev + 1);
    });

    socketInstance.on('connect_error', () => {
      setConnectionAttempts(prev => prev + 1);
    });

    loadConversations();

    // Check if user came from lawyer profile with a specific chat partner
    const chatPartner = localStorage.getItem('chatPartner');
    const pendingChat = localStorage.getItem('pendingChat');
    
    if (chatPartner) {
      const partner = JSON.parse(chatPartner);
      console.log('🎯 Auto-selecting conversation from chatPartner:', partner);
      
      // Convert secure_id to actual id if needed
      let partnerId = partner.partner_id;
      if (partner.partner_type === 'lawyer' && isNaN(partnerId)) {
        // Fetch actual lawyer id from secure_id
        fetch(`/api/lawyers/${partnerId}`)
          .then(res => res.json())
          .then(lawyer => {
            setSelectedConversation({
              partner_id: lawyer.id,
              partner_type: partner.partner_type,
              partner_name: partner.partner_name || lawyer.name,
              last_message: null,
              unread_count: 0
            });
          });
      } else {
        setSelectedConversation({
          partner_id: partnerId,
          partner_type: partner.partner_type,
          partner_name: partner.partner_name,
          last_message: null,
          unread_count: 0
        });
      }
      localStorage.removeItem('chatPartner'); // Clear after use
    } else if (pendingChat) {
      const partner = JSON.parse(pendingChat);
      console.log('🎯 Auto-selecting conversation from pendingChat:', partner);
      
      // Convert secure_id to actual id if needed
      let partnerId = partner.partner_id;
      if (partner.partner_type === 'lawyer' && isNaN(partnerId)) {
        // Fetch actual lawyer id from secure_id
        fetch(`/api/lawyers/${partnerId}`)
          .then(res => res.json())
          .then(lawyer => {
            setSelectedConversation({
              partner_id: lawyer.id,
              partner_type: partner.partner_type,
              partner_name: partner.partner_name || lawyer.name,
              last_message: null,
              unread_count: 0
            });
          });
      } else {
        setSelectedConversation({
          partner_id: partnerId,
          partner_type: partner.partner_type,
          partner_name: partner.partner_name,
          last_message: null,
          unread_count: 0
        });
      }
      localStorage.removeItem('pendingChat'); // Clear after use
    }

    return () => {
      chatService.removeAllListeners();
      chatService.disconnect();
    };
  }, [user?.id, userType]);

  const loadConversations = async () => {
    try {
      const conversations = await chatService.getConversations();
      setConversations(Array.isArray(conversations) ? conversations : []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    }
  };
  
  const loadCallHistory = async () => {
    try {
      const response = await fetch('/api/chat/call-history', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const calls = await response.json();
      setCallHistory(calls || []);
    } catch (error) {
      console.error('Error loading call history:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;
    
    try {
      const messages = await chatService.getMessages(
        selectedConversation.partner_id,
        selectedConversation.partner_type
      );
      setMessages(Array.isArray(messages) ? messages : []);
      
      // Mark as read
      await chatService.markAsRead(
        selectedConversation.partner_id,
        selectedConversation.partner_type
      );
      loadConversations();
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]); // Set empty array on error
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
    }
  }, [selectedConversation]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    chatService.onMessageReceived((message) => {
      console.log('📨 Received message:', message);
      
      const isForCurrentUser = message.receiver_id === user.id && message.receiver_type === userType;
      
      if (isForCurrentUser) {
        if (selectedConversation && 
            message.sender_id === selectedConversation.partner_id && 
            message.sender_type === selectedConversation.partner_type) {
          setMessages(prev => [...prev, message]);
        }
        loadConversations();
      }
    });

    chatService.onMessageSent((message) => {
      console.log('✅ Message sent:', message);
      // Replace temp message with real message
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.id.toString().startsWith('temp-'));
        return [...filtered, { ...message, status: 'sent' }];
      });
      setSending(false);
      loadConversations();
    });
    
    chatService.onMessageError((error) => {
      console.error('❌ Message error:', error);
      setSending(false);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.id.toString().startsWith('temp-')));
    });

    chatService.onUserStatus(({ userId, status }) => {
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        if (status === 'online') {
          updated.add(userId);
        } else {
          updated.delete(userId);
        }
        return updated;
      });
    });

    chatService.onTyping((data) => {
      if (selectedConversation && data.sender_id === selectedConversation.partner_id) {
        setIsTyping(data.isTyping);
      }
    });

    chatService.onRefreshConversations(() => {
      loadConversations();
    });

    // Voice call listeners
    socket.on('voice_call_offer', (data) => {
      console.log('Received call offer from:', data.fromName);
      setIncomingCall(data);
      
      // Set selected conversation if not already set
      if (!selectedConversation) {
        setSelectedConversation({
          partner_id: data.from,
          partner_type: 'lawyer', // Assuming call is from lawyer
          partner_name: data.fromName,
          last_message: null,
          unread_count: 0
        });
      }
    });

    socket.on('voice_call_answer', async (data) => {
      console.log('Call answered by:', data.from);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(data.answer);
        console.log('Remote description set, starting timer');
        // Start timer when call is answered
        startCallTimer();
      }
    });

    socket.on('ice_candidate', async (data) => {
      console.log('Received ICE candidate');
      if (peerConnection) {
        await peerConnection.addIceCandidate(data.candidate);
      }
    });

    socket.on('call_ended', () => {
      console.log('Call ended by other party');
      // Don't call endCall() here to prevent loop - just clean up UI
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      if (peerConnection) {
        peerConnection.close();
        setPeerConnection(null);
      }
      setIsInCall(false);
      setIncomingCall(null);
      setRemoteStream(null);
      setCallStartTime(null);
      setCallDuration(0);
      setIsMuted(false);
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    });

    socket.on('call_rejected', () => {
      endCall();
      alert('Call was rejected');
    });

    return () => {
      chatService.removeAllListeners();
    };
  }, [socket, selectedConversation, user.id, userType]);

  const sendMessage = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || !socket || sending) return;

    setSending(true);
    let messageData = {
      sender_id: user.id,
      sender_type: userType,
      receiver_id: selectedConversation.partner_id,
      receiver_type: selectedConversation.partner_type,
      content: newMessage.trim() || 'File attachment',
      message_type: selectedFile ? 'file' : 'text'
    };

    // Handle file upload
    if (selectedFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('sender_id', user.id);
        formData.append('sender_type', userType);
        formData.append('receiver_id', selectedConversation.partner_id);
        formData.append('receiver_type', selectedConversation.partner_type);
        
        const response = await fetch('http://localhost:5001/api/chat/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        const result = await response.json();
        messageData.file_url = result.file_url;
        messageData.file_name = selectedFile.name;
        messageData.file_size = selectedFile.size;
        messageData.content = `📎 ${selectedFile.name}`;
      } catch (error) {
        console.error('File upload failed:', error);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    // Add message locally for instant feedback with pending status
    const tempMessage = {
      id: `temp-${Date.now()}`,
      ...messageData,
      created_at: new Date().toISOString(),
      status: 'sending'
    };
    console.log('Adding temp message to UI:', tempMessage);
    setMessages(prev => {
      const updated = [...prev, tempMessage];
      console.log('Messages after adding temp:', updated.length);
      return updated;
    });
    
    try {
      chatService.sendMessage(messageData);
      setNewMessage('');
      setSelectedFile(null);
      stopTyping();
      
      // Auto-clear sending state after 2 seconds if no response
      setTimeout(() => {
        setSending(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to send message:', error);
      setSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!socket || !selectedConversation) return;

    chatService.sendTyping(user.id, selectedConversation.partner_id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const stopTyping = () => {
    if (socket && selectedConversation) {
      chatService.stopTyping(user.id, selectedConversation.partner_id);
    }
  };

  // Removed auto-scroll functionality
  
  // Handle audio streams
  useEffect(() => {
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream;
      localAudioRef.current.muted = true; // Always mute local to prevent feedback
      console.log('✅ Local stream connected, tracks:', localStream.getTracks().length);
      localStream.getTracks().forEach(track => {
        console.log('Local track:', track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState);
      });
    }
  }, [localStream]);
  
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      
      console.log('🔊 Remote stream connected, tracks:', remoteStream.getTracks().length);
      remoteStream.getTracks().forEach(track => {
        console.log('Remote track:', track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState);
      });
      
      // Force play audio with user interaction
      const playAudio = async () => {
        try {
          await remoteAudioRef.current.play();
          console.log('✅ Remote audio playing');
        } catch (e) {
          console.log('❌ Audio autoplay prevented:', e.message);
        }
      };
      playAudio();
    }
  }, [remoteStream]);

  const isUserOnline = (partnerId) => {
    return onlineUsers.has(partnerId);
  };

  const handleVoiceCall = async () => {
    if (!selectedConversation || isInCall) {
      console.log('Cannot start call: no conversation selected or already in call');
      return;
    }
    
    console.log('Starting voice call to:', selectedConversation.partner_name);
    
    try {
      // Get user media with better audio constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false 
      });
      console.log('Got local stream with tracks:', stream.getTracks().length);
      setLocalStream(stream);
      
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('🎧 Received remote stream with tracks:', event.streams[0].getTracks().length);
        event.streams[0].getTracks().forEach(track => {
          console.log('Incoming track:', track.kind, 'enabled:', track.enabled);
        });
        setRemoteStream(event.streams[0]);
      };
      
      // Handle connection state
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          // Start timer when connection is fully established
          if (!callStartTime) {
            startCallTimer();
          }
        }
      };
      
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
      };
      
      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice_candidate', {
            candidate: event.candidate,
            to: selectedConversation.partner_id,
            from: user.id
          });
        }
      };
      
      setPeerConnection(pc);
      
      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Send call invitation
      socket.emit('voice_call_offer', {
        offer,
        to: selectedConversation.partner_id,
        from: user.id,
        fromName: user.name,
        toName: selectedConversation.partner_name
      });
      
      console.log('Call initiated to:', selectedConversation.partner_name);
      
      setIsInCall(true);
    } catch (error) {
      console.error('Error starting voice call:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };
  
  const startCallTimer = () => {
    const startTime = Date.now();
    setCallStartTime(startTime);
    setCallDuration(0);
    
    callTimerRef.current = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  };
  
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  
  const endCall = async () => {
    // Save call history
    if (callStartTime && selectedConversation && callDuration > 0) {
      try {
        await fetch('/api/chat/call-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            partner_id: selectedConversation.partner_id,
            partner_name: selectedConversation.partner_name,
            partner_type: selectedConversation.partner_type,
            duration: callDuration,
            timestamp: new Date().toISOString(),
            type: 'voice'
          })
        });
      } catch (error) {
        console.error('Failed to save call history:', error);
      }
    }
    
    // Clear timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    setIsInCall(false);
    setIncomingCall(null);
    setRemoteStream(null);
    setCallStartTime(null);
    setCallDuration(0);
    setIsMuted(false);
    
    if (socket) {
      socket.emit('end_call', {
        to: selectedConversation?.partner_id,
        from: user.id
      });
    }
  };
  
  const acceptCall = async () => {
    if (!incomingCall) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false 
      });
      console.log('Got local stream for answer with tracks:', stream.getTracks().length);
      setLocalStream(stream);
      
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      pc.ontrack = (event) => {
        console.log('🎧 Received remote stream in accept with tracks:', event.streams[0].getTracks().length);
        event.streams[0].getTracks().forEach(track => {
          console.log('Accept - Incoming track:', track.kind, 'enabled:', track.enabled);
        });
        setRemoteStream(event.streams[0]);
      };
      
      pc.onconnectionstatechange = () => {
        console.log('Accept - Connection state:', pc.connectionState);
      };
      
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice_candidate', {
            candidate: event.candidate,
            to: incomingCall.from,
            from: user.id
          });
        }
      };
      
      await pc.setRemoteDescription(incomingCall.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket.emit('voice_call_answer', {
        answer,
        to: incomingCall.from,
        from: user.id
      });
      
      setPeerConnection(pc);
      setIsInCall(true);
      setIncomingCall(null);
      // Start timer immediately when accepting call
      startCallTimer();
      console.log('Timer started on call accept');
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };
  
  const rejectCall = () => {
    if (socket && incomingCall) {
      socket.emit('call_rejected', {
        to: incomingCall.from,
        from: user.id
      });
    }
    setIncomingCall(null);
  };

  const deleteConversation = async (conv, e) => {
    e.stopPropagation();
    if (window.confirm(`Delete conversation with ${conv.partner_name}?`)) {
      try {
        await chatService.deleteConversation(conv.partner_id, conv.partner_type);
        if (selectedConversation?.partner_id === conv.partner_id) {
          setSelectedConversation(null);
          setMessages([]);
        }
        loadConversations();
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    }
  };

  const filteredConversations = (conversations || []).filter(conv =>
    conv.partner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 shadow-lg flex flex-col">

        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">{user?.name?.charAt(0) || 'U'}</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                <p className="text-gray-500 text-sm">{userType === 'lawyer' ? 'Attorney' : 'Client'}</p>
              </div>
            </div>
            <button 
              onClick={() => { setShowCallHistory(!showCallHistory); loadCallHistory(); }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Call History"
            >
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No conversations yet</h3>
              <p className="text-center text-sm text-gray-500">Start connecting with {userType === 'lawyer' ? 'clients' : 'legal professionals'}</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredConversations.map((conv) => (
                <div
                  key={`${conv.partner_id}-${conv.partner_type}`}
                  className={`group relative mb-1 rounded-lg transition-colors cursor-pointer ${
                    selectedConversation?.partner_id === conv.partner_id 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  {/* Three-dots menu */}
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const menu = e.currentTarget.nextElementSibling;
                        menu.classList.toggle('hidden');
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                    <div className="hidden absolute right-0 top-6 bg-white rounded-lg shadow-lg border py-1 min-w-[120px] z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.currentTarget.parentElement.classList.add('hidden');
                          deleteConversation(conv, e);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete chat
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {conv.partner_name?.charAt(0) || 'U'}
                        </div>
                        {isUserOnline(conv.partner_id) && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {conv.partner_name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {conv.last_message_time && (
                              <span className="text-xs text-gray-500">
                                {new Date(conv.last_message_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            )}
                            {conv.unread_count > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {conv.last_message || 'Start conversation'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audio elements for WebRTC */}
      <audio ref={localAudioRef} muted autoPlay />
      <audio ref={remoteAudioRef} autoPlay />
      
      {/* Call History Modal */}
      {showCallHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Call History</h3>
              <button 
                onClick={() => setShowCallHistory(false)}
                className="p-1 hover:bg-gray-100 rounded text-gray-500"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {callHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No calls yet</p>
              ) : (
                callHistory.map((call, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="font-medium text-sm">{call.partner_name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(call.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center shadow-xl">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Incoming Call</h3>
            <p className="text-gray-600 mb-6">{incomingCall.fromName}</p>
            <div className="flex space-x-3">
              <button 
                onClick={rejectCall}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
              >
                Decline
              </button>
              <button 
                onClick={acceptCall}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Active Call Overlay */}
      {isInCall && (
        <div className="fixed top-4 right-4 bg-white rounded-lg p-4 shadow-lg border z-40">
          <div className="text-center mb-3">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium text-gray-800 text-sm">In call with {selectedConversation?.partner_name || incomingCall?.fromName || 'Unknown'}</span>
            </div>
            <div className="text-lg font-mono text-gray-600">
              {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <button 
              onClick={toggleMute}
              className={`p-2 rounded-lg transition-colors ${
                isMuted 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            
            <button 
              onClick={endCall}
              className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
              title="End Call"
            >
              <Phone className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedConversation.partner_name?.charAt(0) || 'U'}
                    </div>
                    {isUserOnline(selectedConversation.partner_id) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.partner_name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {isUserOnline(selectedConversation.partner_id) ? (
                        <span className="text-sm text-green-600">Online</span>
                      ) : (
                        <span className="text-sm text-gray-500">Offline</span>
                      )}
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {selectedConversation.partner_type === 'lawyer' ? 'Attorney' : 'Client'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleVoiceCall}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Voice Call"
                  >
                    <Phone size={20} className="text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical size={20} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.map((message, index) => {
                const isMine = message.sender_id === user.id && message.sender_type === userType;
                const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
                
                return (
                  <div
                    key={message.id}
                    className={`mb-3 flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Message Bubble */}
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      isMine 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}>
                      {message.message_type === 'file' ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="w-4 h-4" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {message.file_name || 'File attachment'}
                              </p>
                              {message.file_size && (
                                <p className="text-xs opacity-75">
                                  {(message.file_size / 1024).toFixed(1)} KB
                                </p>
                              )}
                            </div>
                            {message.file_url && (
                              <a 
                                href={`http://localhost:5001${message.file_url}`} 
                                download={message.file_name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-600"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </a>
                            )}
                          </div>
                          {message.content !== `📎 ${message.file_name}` && (
                            <p className="text-sm">{message.content}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                      
                      {/* Message Footer */}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-75">
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {isMine && (
                          <div className="ml-2">
                            {message.status === 'sending' ? (
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin opacity-50" />
                            ) : message.read_status === 1 ? (
                              <CheckCheck size={14} className="opacity-75" />
                            ) : (
                              <CheckCheck size={14} className="opacity-50" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isTyping && (
                <div className="flex justify-start mb-3">
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
                    <div className="flex space-x-1 items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <span className="text-xs text-gray-500 ml-2">typing...</span>
                    </div>
                  </div>
                </div>
              )}
        
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              {/* File Preview */}
              {selectedFile && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Paperclip className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={removeSelectedFile}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              
              <form onSubmit={sendMessage} className="flex items-center space-x-3">
                {/* Attachment Button */}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Paperclip size={20} />
                </button>
                
                {/* Message Input */}
                <div className="flex-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                    placeholder="Type your message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Send Button */}
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedFile) || uploading || sending}
                  className={`p-2 rounded-lg transition-colors ${
                    (newMessage.trim() || selectedFile) && !uploading && !sending
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {(uploading || sending) ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </form>
              
              {/* Connection Status */}
              <div className="flex items-center justify-center mt-3">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
                  isConnected 
                    ? 'text-green-600 bg-green-50' 
                    : 'text-red-600 bg-red-50'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span>
                    {isConnected 
                      ? 'Connected' 
                      : connectionAttempts > 0 
                        ? `Reconnecting...` 
                        : 'Connecting...'
                    }
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Legal City Chat
              </h3>
              <p className="text-gray-500 mb-4">
                Select a conversation to start messaging
              </p>
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Secure & Private</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



export default ChatPage;