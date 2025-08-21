// [EDIT] - 2024-01-15 - Created MessagesPage component - Ediens Team
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  MessageCircle, 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  MapPin, 
  Clock, 
  Star, 
  User, 
  Building,
  ArrowLeft,
  Trash2,
  Edit,
  Check,
  X,
  Image as ImageIcon,
  Paperclip,
  Smile,
  Mic,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '@api/auth';
import toast from 'react-hot-toast';

const MessagesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  // Get user ID from URL params for direct messaging
  const targetUserId = searchParams.get('user');

  // Fetch user conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.get('/api/messages/conversations');
      return response.data;
    },
    enabled: !!user
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation) return null;
      const response = await api.get(`/api/messages/conversation/${selectedConversation.id}`);
      return response.data;
    },
    enabled: !!selectedConversation?.id
  });

  // Fetch unread message count
  const { data: unreadCount } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const response = await api.get('/api/messages/unread/count');
      return response.data;
    },
    enabled: !!user
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/api/messages', data);
      return response.data;
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries(['messages', selectedConversation?.id]);
      queryClient.invalidateQueries(['conversations']);
      queryClient.invalidateQueries(['unreadCount']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  });

  // Update message mutation
  const updateMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }) => {
      const response = await api.put(`/api/messages/${messageId}`, { content });
      return response.data;
    },
    onSuccess: () => {
      setEditingMessage(null);
      queryClient.invalidateQueries(['messages', selectedConversation?.id]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update message');
    }
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId) => {
      const response = await api.delete(`/api/messages/${messageId}`);
      return response.data;
    },
    onSuccess: () => {
      setShowDeleteConfirm(false);
      setMessageToDelete(null);
      queryClient.invalidateQueries(['messages', selectedConversation?.id]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete message');
    }
  });

  // Mark conversation as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await api.put(`/api/messages/conversation/${userId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations']);
      queryClient.invalidateQueries(['unreadCount']);
    }
  });

  // Set initial conversation if user ID is provided
  useEffect(() => {
    if (targetUserId && conversations?.conversations) {
      const conversation = conversations.conversations.find(
        conv => conv.user.id === targetUserId
      );
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [targetUserId, conversations]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversation && selectedConversation.unreadCount > 0) {
      markAsReadMutation.mutate(selectedConversation.user.id);
    }
  }, [selectedConversation]);

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setSearchQuery('');
  };

  // Handle send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      receiverId: selectedConversation.user.id,
      content: newMessage.trim(),
      type: 'text'
    });
  };

  // Handle message edit
  const handleEditMessage = (messageId, content) => {
    updateMessageMutation.mutate({ messageId, content });
  };

  // Handle message delete
  const handleDeleteMessage = (messageId) => {
    setMessageToDelete(messageId);
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (messageToDelete) {
      deleteMessageMutation.mutate(messageToDelete);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString('lv-LV');
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('lv-LV', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Filter conversations based on search
  const filteredConversations = conversations?.conversations?.filter(conv => 
    conv.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {selectedConversation && (
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-xl font-bold text-gray-900">
                {selectedConversation ? 'Messages' : 'Conversations'}
              </h1>
              {unreadCount?.unreadCount > 0 && (
                <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                  {unreadCount.unreadCount} unread
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations Sidebar */}
          {!selectedConversation && (
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-soft border border-gray-100">
                {/* Search Bar */}
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
                    />
                  </div>
                </div>

                {/* Conversations List */}
                <div className="p-4">
                  {conversationsLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-16 bg-gray-200 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredConversations.length > 0 ? (
                    <div className="space-y-3">
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.user.id}
                          onClick={() => handleConversationSelect(conversation)}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          {/* User Avatar */}
                          <div className="relative">
                            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-lg font-medium text-primary-600">
                                {conversation.user.firstName?.[0]}{conversation.user.lastName?.[0]}
                              </span>
                            </div>
                            {conversation.unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {conversation.unreadCount}
                              </div>
                            )}
                          </div>

                          {/* Conversation Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-gray-900 truncate">
                                {conversation.user.firstName} {conversation.user.lastName}
                              </h3>
                              {conversation.lastMessage && (
                                <span className="text-xs text-gray-500">
                                  {formatTime(conversation.lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {conversation.user.isBusiness && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <Building className="w-3 h-3 mr-1" />
                                  Business
                                </span>
                              )}
                              {conversation.lastMessage && (
                                <p className="text-sm text-gray-600 truncate">
                                  {conversation.lastMessage.content}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No conversations yet</p>
                      <p className="mb-4">Start sharing food to begin conversations</p>
                      <button
                        onClick={() => navigate('/create-post')}
                        className="btn-primary"
                      >
                        Share Food
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chat Interface */}
          {selectedConversation && (
            <>
              {/* Chat Header */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-xl shadow-soft border border-gray-100">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {selectedConversation.user.firstName?.[0]}{selectedConversation.user.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {selectedConversation.user.firstName} {selectedConversation.user.lastName}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            {selectedConversation.user.isBusiness && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Building className="w-3 h-3 mr-1" />
                                Business
                              </span>
                            )}
                            {selectedConversation.user.rating && (
                              <span className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                {selectedConversation.user.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Phone className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <MapPin className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="h-96 overflow-y-auto p-4">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-16 bg-gray-200 rounded-lg"></div>
                          </div>
                        ))}
                      </div>
                    ) : messages?.messages?.length > 0 ? (
                      <div className="space-y-4">
                        {messages.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md ${message.senderId === user.id ? 'order-2' : 'order-1'}`}>
                              {editingMessage?.id === message.id ? (
                                /* Edit Message Form */
                                <div className="bg-white border border-primary-300 rounded-lg p-3 shadow-sm">
                                  <textarea
                                    value={editingMessage.content}
                                    onChange={(e) => setEditingMessage(prev => ({ ...prev, content: e.target.value }))}
                                    className="w-full border-none resize-none focus:ring-0 text-sm"
                                    rows={2}
                                    autoFocus
                                  />
                                  <div className="flex justify-end space-x-2 mt-2">
                                    <button
                                      onClick={() => setEditingMessage(null)}
                                      className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleEditMessage(message.id, editingMessage.content)}
                                      className="p-1 text-primary-600 hover:text-primary-700"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* Message Content */
                                <div className={`rounded-lg p-3 ${
                                  message.senderId === user.id
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}>
                                  <p className="text-sm">{message.content}</p>
                                  <div className={`flex items-center justify-between mt-2 text-xs ${
                                    message.senderId === user.id ? 'text-primary-100' : 'text-gray-500'
                                  }`}>
                                    <span>{formatTime(message.createdAt)}</span>
                                    {message.senderId === user.id && (
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={() => setEditingMessage({ id: message.id, content: message.content })}
                                          className="hover:opacity-80"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteMessage(message.id)}
                                          className="hover:opacity-80"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                      <div className="flex-1">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                          rows={2}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(e);
                            }
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Smile className="w-5 h-5" />
                        </button>
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || sendMessageMutation.isLoading}
                          className="btn-primary px-4 py-2"
                        >
                          {sendMessageMutation.isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </form>
                    
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        // Handle file upload
                        const file = e.target.files[0];
                        if (file) {
                          // TODO: Implement file upload
                          toast.info('File upload coming soon!');
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Delete Message</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMessageMutation.isLoading}
                className="btn-danger flex-1"
              >
                {deleteMessageMutation.isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;