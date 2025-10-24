import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Send, Search, MoreVertical, Phone, Video, Paperclip, Smile, MessageSquare, Users, X, Image as ImageIcon, Trash2, UserCircle, Ban, BellOff, Download, Eraser, Bell, Shield, Wallpaper } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import socketService from '../utils/socket';
import { getAvatarUrl } from '../utils/avatarHelper';
import { notifyNewMessage } from '../utils/browserNotifications';
import ChatWallpaperSelector from '../components/ChatWallpaperSelector';
import { getWallpaperStyle, saveWallpaperPreference, getWallpaperPreference } from '../utils/chatWallpapers';
import SocketDebugPanel from '../components/SocketDebugPanel';

const ChatPage = () => {
  const { chatId } = useParams();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const { user } = useAuthStore();
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(null); // messageId for reaction picker
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mutedUsers, setMutedUsers] = useState(new Set());
  const [blockedUsers, setBlockedUsers] = useState(new Set());
  const [showWallpaperSelector, setShowWallpaperSelector] = useState(false);
  const [chatWallpaper, setChatWallpaper] = useState({ wallpaperId: 'default', customImage: null });
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showOnlineUsers, setShowOnlineUsers] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch conversations list
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.get('/messages/chats');
      console.log('💬 Fetched conversations:', response.data.map(c => ({
        name: c.otherUser?.name,
        chatId: c.chatId,
        userId: c.otherUser?._id
      })));
      return response.data;
    },
  });

  // Fetch messages for selected chat
  const { data: chatMessagesResponse, refetch: refetchMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedChat?.chatId],
    queryFn: async () => {
      if (!selectedChat) return { messages: [] };
      console.log('📨 Fetching messages for chat:', selectedChat.chatId, 'User:', selectedChat.otherUser?.name);
      const response = await api.get(`/messages/${selectedChat.chatId}`);
      console.log('✅ Fetched messages:', response.data.messages?.length || 0);
      return response.data;
    },
    enabled: !!selectedChat,
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data
  });

  // Set messages when chat messages are loaded
  useEffect(() => {
    if (chatMessagesResponse?.messages) {
      console.log('📥 Setting messages in state:', chatMessagesResponse.messages.length, 'for chat:', selectedChat?.chatId);
      setMessages(chatMessagesResponse.messages);
    } else if (selectedChat) {
      // If no messages returned, clear messages
      console.log('🧹 Clearing messages for chat:', selectedChat?.chatId);
      setMessages([]);
    }
  }, [chatMessagesResponse, selectedChat?.chatId]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (selectedChat?.chatId && messages.length > 0) {
      // Mark messages as read
      api.put(`/messages/${selectedChat.chatId}/read`)
        .then(({ data }) => {
          // Update local state to show messages as read
          setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
          
          // Notify sender via socket that messages were read
          if (data.senderId) {
            socketService.emit('message:read', {
              chatId: selectedChat.chatId,
              senderId: data.senderId,
            });
          }
        })
        .catch(error => {
          console.error('Failed to mark messages as read:', error);
        });
    }
  }, [selectedChat?.chatId, messages.length]);

  // Select chat based on URL param or userId
  useEffect(() => {
    if (userId && user && conversations.length >= 0) {
      // Check if chat with this user already exists
      const existingChat = conversations.find(
        (c) => c.otherUser?._id === userId
      );
      
      if (existingChat) {
        setSelectedChat(existingChat);
      } else {
        // Create a temporary chat object for new conversation
        const ids = [user._id, userId].sort();
        const newChatId = `${ids[0]}_${ids[1]}`;
        
        // Fetch the other user's details
        api.get(`/users/${userId}`).then(({ data }) => {
          setSelectedChat({
            chatId: newChatId,
            otherUser: data.user,
            lastMessage: null,
            unreadCount: 0,
          });
        }).catch((error) => {
          console.error('Failed to fetch user details:', error);
          toast.error('Failed to start chat');
        });
      }
    } else if (chatId && conversations.length > 0) {
      const chat = conversations.find((c) => c.chatId === chatId);
      if (chat) {
        setSelectedChat(chat);
      }
    } else if (conversations.length > 0 && !selectedChat) {
      setSelectedChat(conversations[0]);
    }
  }, [chatId, userId, conversations, selectedChat, user]);

  // Listen for online users updates
  useEffect(() => {
    const handleOnlineUsers = async (userIds) => {
      console.log('👥 Online users updated:', userIds);
      console.log('📍 Current user ID:', user._id);
      
      // Filter out current user and fetch user details
      const otherUserIds = userIds.filter(id => id !== user._id);
      console.log('🔍 Other users (excluding me):', otherUserIds);
      
      if (otherUserIds.length > 0) {
        try {
          // Fetch details for all online users
          const userPromises = otherUserIds.map(id => 
            api.get(`/users/${id}`).then(res => res.data.user).catch(() => null)
          );
          const users = await Promise.all(userPromises);
          const validUsers = users.filter(u => u !== null);
          console.log('✅ Fetched online users:', validUsers.map(u => u.name));
          setOnlineUsers(validUsers);
        } catch (error) {
          console.error('Failed to fetch online users:', error);
        }
      } else {
        console.log('⚠️ No other users online');
        setOnlineUsers([]);
      }
    };

    console.log('🎧 Setting up users:online listener');
    socketService.on('users:online', handleOnlineUsers);

    return () => {
      console.log('🔇 Removing users:online listener');
      socketService.off('users:online', handleOnlineUsers);
    };
  }, [user._id]);

  // Socket.io listeners
  useEffect(() => {
    if (!selectedChat) return;

    console.log('🎧 Setting up socket listeners for chat:', selectedChat.chatId);

    // Define handlers with unique references
    const handleMessageReceive = (newMessage) => {
      console.log('📥 message:receive event received:', {
        messageId: newMessage._id,
        chatId: newMessage.chatId,
        currentChatId: selectedChat?.chatId,
        matches: newMessage.chatId === selectedChat?.chatId
      });
      
      if (newMessage.chatId === selectedChat.chatId) {
        console.log('✅ Message matches current chat - adding to messages');
        setMessages((prev) => [...prev, newMessage]);
        scrollToBottom();
        
        // Show browser notification if tab is not focused
        if (document.hidden && !mutedUsers.has(selectedChat.otherUser._id)) {
          const senderName = newMessage.senderId?.name || selectedChat.otherUser.name;
          notifyNewMessage(senderName, newMessage.content, selectedChat.chatId);
        }
        
        // Auto mark as read when message is received in active chat
        api.put(`/messages/${selectedChat.chatId}/read`)
          .catch(error => console.error('Failed to mark as read:', error));
      } else {
        console.log('⚠️ Message chatId does not match current chat - ignoring');
      }
    };

    const handleTypingStatus = ({ userId, isTyping: typing }) => {
      if (userId === selectedChat.otherUser?._id) {
        setIsTyping(typing);
        setOtherUserTyping(typing);
      }
    };

    const handleMessageReadConfirm = ({ chatId }) => {
      if (chatId === selectedChat.chatId) {
        setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
      }
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    };

    const handleChatCleared = ({ chatId }) => {
      if (chatId === selectedChat?.chatId) {
        setMessages([]);
        toast.info('Chat has been cleared by the other user', {
          icon: '🧹',
        });
      }
    };

    const handleMessageReact = ({ message }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === message._id ? message : msg
      ));
    };

    // Attach listeners
    socketService.on('message:receive', handleMessageReceive);
    socketService.on('typing:status', handleTypingStatus);
    socketService.on('message:read:confirm', handleMessageReadConfirm);
    socketService.on('message:deleted', handleMessageDeleted);
    socketService.on('chat:cleared', handleChatCleared);
    socketService.on('message:react', handleMessageReact);

    return () => {
      console.log('🔇 Cleaning up socket listeners for chat:', selectedChat.chatId);
      socketService.off('message:receive', handleMessageReceive);
      socketService.off('typing:status', handleTypingStatus);
      socketService.off('message:read:confirm', handleMessageReadConfirm);
      socketService.off('message:deleted', handleMessageDeleted);
      socketService.off('chat:cleared', handleChatCleared);
      socketService.off('message:react', handleMessageReact);
    };
  }, [selectedChat?.chatId]);

  // Load wallpaper preference when chat changes
  useEffect(() => {
    if (selectedChat?.chatId) {
      const preference = getWallpaperPreference(selectedChat.chatId);
      console.log('Loading wallpaper for chat:', selectedChat.chatId, preference);
      setChatWallpaper(preference);
    } else {
      // Set default wallpaper when no chat selected
      setChatWallpaper({ wallpaperId: 'default', customImage: null });
    }
  }, [selectedChat?.chatId]);

  // Handle wallpaper selection
  const handleSelectWallpaper = (wallpaperId, customImage) => {
    console.log('Selecting wallpaper:', wallpaperId, customImage);
    const newWallpaper = { wallpaperId, customImage };
    setChatWallpaper(newWallpaper);
    if (selectedChat?.chatId) {
      saveWallpaperPreference(selectedChat.chatId, wallpaperId, customImage);
    }
  };

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!message.trim() && !selectedImage) || !selectedChat) return;

    try {
      let messageData = {
        receiverId: selectedChat.otherUser._id,
        content: message || '',
      };

      // If image is selected, upload it
      if (selectedImage) {
        const formData = new FormData();
        formData.append('image', selectedImage);
        formData.append('receiverId', selectedChat.otherUser._id);
        if (message.trim()) {
          formData.append('content', message);
        }

        const response = await api.post('/messages/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Add message to local state
        setMessages((prev) => [...prev, response.data]);
        setMessage('');
        setSelectedImage(null);
        setImagePreview(null);

        // Emit socket event
        console.log('📤 Emitting message:send (with image):', {
          chatId: selectedChat.chatId,
          receiverId: selectedChat.otherUser._id,
          messageId: response.data._id
        });
        socketService.emit('message:send', {
          chatId: selectedChat.chatId,
          receiverId: selectedChat.otherUser._id,
          message: response.data,
        });
      } else {
        // Text-only message
        const response = await api.post('/messages', messageData);

        // Add message to local state
        setMessages((prev) => [...prev, response.data]);
        setMessage('');

        // Emit socket event
        console.log('📤 Emitting message:send (text):', {
          chatId: selectedChat.chatId,
          receiverId: selectedChat.otherUser._id,
          messageId: response.data._id
        });
        socketService.emit('message:send', {
          chatId: selectedChat.chatId,
          receiverId: selectedChat.otherUser._id,
          message: response.data,
        });
      }

      // Stop typing
      socketService.emit('typing:stop', {
        receiverId: selectedChat.otherUser._id,
        chatId: selectedChat.chatId,
      });

      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Send message error:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  // Handle emoji selection
  const onEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await api.delete(`/messages/${messageId}`);
      
      // Remove message from local state
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      
      // Emit socket event to notify other user
      socketService.emit('message:delete', {
        chatId: selectedChat.chatId,
        messageId,
        receiverId: selectedChat.otherUser._id,
      });
      
      toast.success('Message deleted');
    } catch (error) {
      console.error('Delete message error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete message');
    }
  };

  // Voice call handler
  const handleVoiceCall = () => {
    toast.success(`Voice call to ${selectedChat?.otherUser?.name}...`, {
      icon: '📞',
      duration: 3000,
    });
    // TODO: Implement WebRTC voice call functionality
  };

  // Video call handler
  const handleVideoCall = () => {
    toast.success(`Video call to ${selectedChat?.otherUser?.name}...`, {
      icon: '📹',
      duration: 3000,
    });
    // TODO: Implement WebRTC video call functionality
  };

  // Clear chat handler
  const handleClearChat = async () => {
    if (!selectedChat || !selectedChat.chatId) return;

    if (!confirm('Are you sure you want to clear all messages in this chat? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/messages/${selectedChat.chatId}/clear`);
      
      // Clear messages from local state
      setMessages([]);
      
      // Emit socket event to notify other user
      socketService.emit('chat:cleared', {
        chatId: selectedChat.chatId,
        receiverId: selectedChat.otherUser._id,
      });
      
      toast.success('Chat cleared successfully', {
        icon: '🧹',
      });
    } catch (error) {
      console.error('Clear chat error:', error);
      toast.error(error.response?.data?.message || 'Failed to clear chat');
    }
  };

  // Block/Unblock user handler
  const handleBlockUser = () => {
    const userId = selectedChat?.otherUser?._id;
    if (!userId) return;

    if (blockedUsers.has(userId)) {
      // Unblock user
      setBlockedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      toast.success(`${selectedChat.otherUser.name} has been unblocked`, {
        icon: '✅',
      });
    } else {
      // Block user
      setBlockedUsers(prev => new Set(prev).add(userId));
      toast.success(`${selectedChat.otherUser.name} has been blocked`, {
        icon: '🚫',
      });
    }
  };

  // Mute/Unmute notifications handler
  const handleMuteNotifications = () => {
    const userId = selectedChat?.otherUser?._id;
    if (!userId) return;

    if (mutedUsers.has(userId)) {
      // Unmute user
      setMutedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      toast.success(`Notifications unmuted for ${selectedChat.otherUser.name}`, {
        icon: '🔔',
      });
    } else {
      // Mute user
      setMutedUsers(prev => new Set(prev).add(userId));
      toast.success(`Notifications muted for ${selectedChat.otherUser.name}`, {
        icon: '🔕',
      });
    }
  };

  // View profile handler
  const handleViewProfile = () => {
    window.location.href = `/profile/${selectedChat?.otherUser?._id}`;
  };

  // Export chat handler
  const handleExportChat = () => {
    if (!selectedChat || messages.length === 0) {
      toast.error('No messages to export');
      return;
    }

    try {
      // Format chat data
      let chatText = `Chat Export\n`;
      chatText += `================================\n`;
      chatText += `Chat with: ${selectedChat.otherUser?.name}\n`;
      chatText += `Exported on: ${new Date().toLocaleString()}\n`;
      chatText += `Total messages: ${messages.length}\n`;
      chatText += `================================\n\n`;

      // Add all messages
      messages.forEach((msg, index) => {
        const sender = msg.senderId?._id === user?._id || msg.senderId === user?._id 
          ? 'You' 
          : selectedChat.otherUser?.name;
        
        const timestamp = new Date(msg.createdAt).toLocaleString();
        
        chatText += `[${timestamp}] ${sender}:\n`;
        
        // Add message content
        if (msg.content) {
          chatText += `${msg.content}\n`;
        }
        
        // Add attachment info
        if (msg.attachments && msg.attachments.length > 0) {
          chatText += `📎 Attachment: ${msg.attachments[0].filename || 'Image'}\n`;
        }
        
        chatText += `\n`;
      });

      // Create blob and download
      const blob = new Blob([chatText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Create filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `chat_${selectedChat.otherUser?.name}_${dateStr}.txt`;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Chat exported successfully!', {
        icon: '💾',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export chat');
    }
  };

  // Handle typing
  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (!selectedChat) return;

    // Emit typing start
    socketService.emit('typing:start', {
      receiverId: selectedChat.otherUser._id,
      chatId: selectedChat._id,
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to emit typing stop
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emit('typing:stop', {
        receiverId: selectedChat.otherUser._id,
        chatId: selectedChat._id,
      });
    }, 1000);
  };

  // Handle add reaction
  const handleAddReaction = async (messageId, emoji) => {
    try {
      const { data } = await api.post(`/messages/${messageId}/react`, { emoji });
      
      // Update local messages
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? data : msg
      ));
      
      setShowReactionPicker(null);
      
      // Emit socket event for real-time update
      socketService.emit('message:react', {
        chatId: selectedChat.chatId,
        receiverId: selectedChat.otherUser._id,
        message: data,
      });
    } catch (error) {
      console.error('Reaction error:', error);
      toast.error('Failed to add reaction');
    }
  };

  // Handle remove reaction
  const handleRemoveReaction = async (messageId) => {
    try {
      const { data } = await api.delete(`/messages/${messageId}/react`);
      
      // Update local messages
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? data : msg
      ));
      
      // Emit socket event
      socketService.emit('message:react', {
        chatId: selectedChat.chatId,
        receiverId: selectedChat.otherUser._id,
        message: data,
      });
    } catch (error) {
      console.error('Remove reaction error:', error);
      toast.error('Failed to remove reaction');
    }
  };

  // Format time
  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Format date
  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 flex">
          <button
            onClick={() => setShowOnlineUsers(false)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              !showOnlineUsers
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare size={16} className="inline mr-2" />
            Chats
          </button>
          <button
            onClick={() => setShowOnlineUsers(true)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
              showOnlineUsers
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Users size={16} className="inline mr-2" />
            Online
            {onlineUsers.length > 0 && (
              <span className="ml-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                {onlineUsers.length}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={showOnlineUsers ? "Search online users..." : "Search conversations..."}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Online Users Tab */}
        {showOnlineUsers && (
          <div className="flex-1 overflow-y-auto">
            {onlineUsers.length === 0 ? (
              <div className="p-6 text-center">
                <Users size={48} className="text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                  No one else online
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Other users will appear here when they come online
                </p>
              </div>
            ) : (
              onlineUsers.map((onlineUser) => (
                <div
                  key={onlineUser._id}
                  onClick={() => {
                    console.log('🖱️ Clicked on online user:', onlineUser.name);
                    
                    // Create or select chat with this user
                    const existingChat = conversations.find(
                      c => c.otherUser._id === onlineUser._id
                    );
                    
                    if (existingChat) {
                      console.log('✅ Found existing chat:', existingChat.chatId);
                      setSelectedChat(existingChat);
                    } else {
                      // Create temporary chat object
                      const ids = [user._id, onlineUser._id].sort();
                      const newChatId = `${ids[0]}_${ids[1]}`;
                      const newChat = {
                        chatId: newChatId,
                        otherUser: onlineUser,
                        lastMessage: null,
                        unreadCount: 0,
                      };
                      console.log('✨ Creating new chat:', newChatId, newChat);
                      setSelectedChat(newChat);
                    }
                    setShowOnlineUsers(false); // Switch to chat view
                    console.log('🔄 Switched to chat view');
                  }}
                  className="p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={getAvatarUrl(onlineUser.avatar)}
                        alt={onlineUser.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {onlineUser.name}
                      </h3>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Online now
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Conversations Tab */}
        {!showOnlineUsers && (
          <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p>Loading chats...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare size={48} className="text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                No conversations yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Browse posts and click "Contact" to start chatting with your neighbors!
              </p>
            </div>
          ) : (
            conversations.map((chat) => (
              <div
                key={chat.chatId}
                onClick={() => {
                  console.log('🖱️ Switching to chat:', chat.otherUser?.name, 'chatId:', chat.chatId);
                  setSelectedChat(chat);
                  setMessages([]); // Clear old messages
                }}
                className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  selectedChat?.chatId === chat.chatId ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <img
                    src={getAvatarUrl(chat.otherUser?.avatar)}
                    alt={chat.otherUser?.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {chat.otherUser?.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatTime(chat.lastMessage?.createdAt || chat.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {chat.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        )}
      </div>

      {/* Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          {console.log('💬 Rendering chat area for:', selectedChat.otherUser?.name, 'chatId:', selectedChat.chatId)}
          {/* Chat Header */}
          <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
            <div className="flex items-center space-x-3">
              <img
                src={getAvatarUrl(selectedChat.otherUser?.avatar)}
                alt={selectedChat.otherUser?.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {selectedChat.otherUser?.name}
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                    ID: {selectedChat.otherUser?._id?.slice(-6)}
                  </span>
                  {/* Show indicators for muted/blocked users */}
                  {mutedUsers.has(selectedChat?.otherUser?._id) && (
                    <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <BellOff size={12} />
                      Muted
                    </span>
                  )}
                  {blockedUsers.has(selectedChat?.otherUser?._id) && (
                    <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Ban size={12} />
                      Blocked
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-500">
                  {isTyping ? 'typing...' : 'Active'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 relative">
              <button 
                onClick={handleVoiceCall}
                className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                title="Voice Call"
              >
                <Phone size={20} />
              </button>
              <button 
                onClick={handleVideoCall}
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                title="Video Call"
              >
                <Video size={20} />
              </button>
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  title="More Options"
                >
                  <MoreVertical size={20} />
                </button>
                
                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <button
                      onClick={() => {
                        handleViewProfile();
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                    >
                      <UserCircle size={18} />
                      <span>View Profile</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        handleMuteNotifications();
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                    >
                      {mutedUsers.has(selectedChat?.otherUser?._id) ? (
                        <>
                          <Bell size={18} />
                          <span>Unmute Notifications</span>
                        </>
                      ) : (
                        <>
                          <BellOff size={18} />
                          <span>Mute Notifications</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        handleExportChat();
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                    >
                      <Download size={18} />
                      <span>Export Chat</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowWallpaperSelector(true);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                    >
                      <Wallpaper size={18} />
                      <span>Change Wallpaper</span>
                    </button>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    
                    <button
                      onClick={() => {
                        handleClearChat();
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-orange-600 dark:text-orange-400"
                    >
                      <Eraser size={18} />
                      <span>Clear Chat</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        handleBlockUser();
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 ${
                        blockedUsers.has(selectedChat?.otherUser?._id)
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {blockedUsers.has(selectedChat?.otherUser?._id) ? (
                        <>
                          <Shield size={18} />
                          <span>Unblock User</span>
                        </>
                      ) : (
                        <>
                          <Ban size={18} />
                          <span>Block User</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div 
            className="flex-1 overflow-y-auto p-6 space-y-4 wallpaper-transition" 
            style={{
              ...getWallpaperStyle(chatWallpaper.wallpaperId, chatWallpaper.customImage),
              transition: 'all 0.5s ease-in-out'
            }}
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No messages yet. Say hello! 👋</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isOwn = msg.senderId?._id === user?._id || msg.senderId === user?._id;
                const showDate =
                  idx === 0 ||
                  formatDate(messages[idx - 1].createdAt) !== formatDate(msg.createdAt);

                return (
                  <div key={msg._id || idx}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="text-xs text-gray-500 bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
                      <div className="relative flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                        {/* Delete button (only for own messages, shown on hover) */}
                        {isOwn && (
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded p-1"
                            title="Delete message"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        
                        {/* React button (shown on hover) */}
                        <button
                          onClick={() => setShowReactionPicker(showReactionPicker === msg._id ? null : msg._id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1"
                          title="React"
                        >
                          <Smile size={14} />
                        </button>
                        
                        <div
                          className={`max-w-md px-4 py-2 rounded-2xl backdrop-blur-sm shadow-lg ${
                            isOwn
                              ? 'bg-primary-600/90 text-white rounded-br-none'
                              : 'bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white rounded-bl-none'
                          }`}
                        >
                          {/* Display image if exists */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <img 
                              src={`http://localhost:5000${msg.attachments[0].url}`}
                              alt="Attachment"
                              className="rounded-lg mb-2 max-w-xs cursor-pointer hover:opacity-90 transition"
                              onClick={() => window.open(`http://localhost:5000${msg.attachments[0].url}`, '_blank')}
                            />
                          )}
                          
                          {/* Display text content if exists */}
                          {msg.content && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}
                          
                          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span
                            className={`text-xs ${
                              isOwn ? 'text-primary-100' : 'text-gray-500'
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                          </span>
                          {/* Show read status only for own messages */}
                          {isOwn && (
                            <span className="text-xs">
                              {msg.read ? (
                                // Double tick for read
                                <span className="text-blue-300" title="Read">✓✓</span>
                              ) : (
                                // Single tick for sent/delivered
                                <span className="text-primary-100" title="Delivered">✓</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      </div>

                      {/* Reaction Picker */}
                      {showReactionPicker === msg._id && (
                        <div className="absolute bottom-full mb-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 flex gap-1 z-10 border border-gray-200 dark:border-gray-700">
                          {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => handleAddReaction(msg._id, emoji)}
                              className="text-2xl hover:scale-125 transition-transform p-1"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Display Reactions */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          {/* Group reactions by emoji */}
                          {Object.entries(
                            msg.reactions.reduce((acc, reaction) => {
                              acc[reaction.emoji] = acc[reaction.emoji] || [];
                              acc[reaction.emoji].push(reaction);
                              return acc;
                            }, {})
                          ).map(([emoji, reactions]) => {
                            const userReacted = reactions.some(r => r.userId._id === user._id || r.userId === user._id);
                            return (
                              <button
                                key={emoji}
                                onClick={() => userReacted ? handleRemoveReaction(msg._id) : handleAddReaction(msg._id, emoji)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                                  userReacted
                                    ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                                    : 'bg-gray-100 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                                title={reactions.map(r => r.userId.name || 'Unknown').join(', ')}
                              >
                                <span>{emoji}</span>
                                <span className="font-medium">{reactions.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            
            {/* Typing Indicator */}
            {otherUserTyping && (
              <div className="flex items-center space-x-2 mb-2 px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                  {selectedChat?.otherUser?.name} is typing...
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-3 relative inline-block">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="h-20 w-20 object-cover rounded-lg"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-24 right-6 z-50">
                <EmojiPicker 
                  onEmojiClick={onEmojiClick}
                  theme="auto"
                  width={350}
                  height={400}
                />
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              {/* Image upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                title="Attach image"
              >
                <Paperclip size={22} />
              </button>
              
              {/* Message input */}
              <input
                type="text"
                value={message}
                onChange={handleTyping}
                placeholder="Type a message..."
                className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              
              {/* Emoji button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`transition-colors ${
                  showEmojiPicker 
                    ? 'text-primary-600' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
                title="Add emoji"
              >
                <Smile size={22} />
              </button>
              
              {/* Send button */}
              <button
                type="submit"
                disabled={!message.trim() && !selectedImage}
                className="bg-primary-600 text-white rounded-full p-2.5 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send message"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center max-w-md px-6">
            <div className="bg-primary-100 dark:bg-primary-900/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare size={48} className="text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {conversations.length === 0 ? 'No Conversations Yet' : 'Select a Conversation'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {conversations.length === 0 
                ? "Start helping your neighbors! When you contact someone from a post, your conversation will appear here."
                : "Choose a conversation from the left to start chatting"
              }
            </p>
            {conversations.length === 0 && (
              <div className="space-y-3">
                <a
                  href="/posts"
                  className="btn btn-primary inline-flex items-center"
                >
                  <Users size={20} className="mr-2" />
                  Browse Posts
                </a>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  💡 Tip: Click "Contact" on any post to start a conversation
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wallpaper Selector Modal */}
      <ChatWallpaperSelector
        isOpen={showWallpaperSelector}
        onClose={() => setShowWallpaperSelector(false)}
        currentWallpaper={chatWallpaper}
        onSelectWallpaper={handleSelectWallpaper}
      />

      {/* Socket Debug Panel */}
      <SocketDebugPanel />
    </div>
  );
};

export default ChatPage;
