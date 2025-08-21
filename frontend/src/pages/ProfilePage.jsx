// [EDIT] - 2024-01-15 - Created ProfilePage component - Ediens Team
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  Calendar, 
  Star, 
  Leaf, 
  Edit, 
  Save, 
  X, 
  Camera, 
  Settings, 
  Shield, 
  Bell, 
  Globe,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Heart,
  Plus,
  MessageCircle,
  Eye,
  EyeOff,
  Lock,
  Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '@api/auth';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch user profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      const response = await api.get(`/api/users/${user.id}`);
      return response.data;
    },
    enabled: !!user?.id
  });

  // Fetch user statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const response = await api.get('/api/users/stats/me');
      return response.data;
    },
    enabled: !!user
  });

  // Fetch user posts
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['userPosts'],
    queryFn: async () => {
      const response = await api.get('/api/posts/user/posts');
      return response.data;
    },
    enabled: !!user
  });

  // Fetch user claims
  const { data: claims, isLoading: claimsLoading } = useQuery({
    queryKey: ['userClaims'],
    queryFn: async () => {
      const response = await api.get('/api/claims/user');
      return response.data;
    },
    enabled: !!user
  });

  useEffect(() => {
    if (profileData?.user) {
      setFormData({
        firstName: profileData.user.firstName || '',
        lastName: profileData.user.lastName || '',
        email: profileData.user.email || '',
        phone: profileData.user.phone || '',
        city: profileData.user.city || '',
        address: profileData.user.address || '',
        isBusiness: profileData.user.isBusiness || false,
        businessName: profileData.user.businessName || '',
        businessType: profileData.user.businessType || '',
        preferences: profileData.user.preferences || {}
      });
    }
  }, [profileData]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/api/users/profile', data);
      return response.data;
    },
    onSuccess: (data) => {
      updateProfile(data.user);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries(['userProfile']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/api/users/change-password', data);
      return response.data;
    },
    onSuccess: () => {
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/api/users/delete-account');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Account deleted successfully');
      logout();
      navigate('/');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    }
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  const handleDeleteAccount = () => {
    if (passwordData.currentPassword) {
      deleteAccountMutation.mutate({ password: passwordData.currentPassword });
    } else {
      toast.error('Please enter your password to confirm deletion');
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'reserved': return 'text-blue-600 bg-blue-100';
      case 'claimed': return 'text-purple-600 bg-purple-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getClaimStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'picked_up': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('lv-LV');
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
              <p className="text-gray-600 mt-1">
                Manage your account and preferences
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="btn-outline"
            >
              <X className="w-4 h-4 mr-2" />
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 mb-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border-2 border-gray-200 hover:border-primary-500 transition-colors">
                    <Camera className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mt-4">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                {user.isBusiness && (
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <Building className="w-4 h-4 mr-1" />
                    Business Account
                  </div>
                )}
                <div className="mt-4 flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {stats?.stats?.totalEcoPoints || 0}
                    </div>
                    <div className="text-sm text-gray-600">Eco Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary-600">
                      {stats?.stats?.totalPosts || 0}
                    </div>
                    <div className="text-sm text-gray-600">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600">
                      {stats?.stats?.successfulPickups || 0}
                    </div>
                    <div className="text-sm text-gray-600">Pickups</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl shadow-soft border border-gray-100">
              <nav className="flex flex-col">
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'posts', label: 'My Posts', icon: Plus },
                  { id: 'claims', label: 'My Claims', icon: Heart },
                  { id: 'settings', label: 'Settings', icon: Settings },
                  { id: 'security', label: 'Security', icon: Shield }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-3 px-4 py-3 text-left font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn-outline"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="btn-outline"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                      <button
                        onClick={handleProfileSubmit}
                        disabled={updateProfileMutation.isLoading}
                        className="btn-primary"
                      >
                        {updateProfileMutation.isLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="form-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="form-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="form-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {formData.isBusiness && (
                    <div className="border-t pt-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Business Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Name
                          </label>
                          <input
                            type="text"
                            name="businessName"
                            value={formData.businessName || ''}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Type
                          </label>
                          <input
                            type="text"
                            name="businessType"
                            value={formData.businessType || ''}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="form-input"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">My Food Posts</h3>
                  <button className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    New Post
                  </button>
                </div>
                
                {postsLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                ) : posts?.posts?.length > 0 ? (
                  <div className="space-y-4">
                    {posts.posts.map((post) => (
                      <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-2">{post.title}</h4>
                            <p className="text-gray-600 text-sm mb-3">{post.description}</p>
                            <div className="flex items-center space-x-3 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {formatDate(post.createdAt)}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                Expires: {formatDate(post.expiryDate)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary-600">
                                {post.price === 0 ? 'Free' : `€${post.price}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                Qty: {post.quantity}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                                {post.status}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(post.urgency)}`}>
                                {post.urgency}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Plus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No food posts yet</p>
                    <p className="mb-4">Start sharing your leftover food with the community</p>
                    <button className="btn-primary">
                      Share Your First Food Item
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Claims Tab */}
            {activeTab === 'claims' && (
              <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">My Claims</h3>
                  <button className="btn-outline">
                    <MapPin className="w-4 h-4 mr-2" />
                    Browse Food
                  </button>
                </div>
                
                {claimsLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                ) : claims?.claims?.length > 0 ? (
                  <div className="space-y-4">
                    {claims.claims.map((claim) => (
                      <div key={claim.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-2">
                              {claim.foodPost?.title || 'Food Item'}
                            </h4>
                            <p className="text-gray-600 text-sm mb-3">
                              From: {claim.foodPost?.user?.firstName} {claim.foodPost?.user?.lastName}
                            </p>
                            <div className="flex items-center space-x-3 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Claimed: {formatDate(claim.createdAt)}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                Pickup: {formatDate(claim.pickupDate)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <div className="text-right">
                              <div className="text-lg font-bold text-secondary-600">
                                Qty: {claim.quantity}
                              </div>
                              <div className="text-sm text-gray-500">
                                {claim.foodPost?.price === 0 ? 'Free' : `€${claim.foodPost?.price}`}
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClaimStatusColor(claim.status)}`}>
                              {claim.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No claims yet</p>
                    <p className="mb-4">Start claiming food items from your community</p>
                    <button className="btn-primary">
                      Browse Available Food
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Preferences & Settings</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Notifications</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox" defaultChecked />
                        <span className="ml-3 text-sm text-gray-700">New food posts nearby</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox" defaultChecked />
                        <span className="ml-3 text-sm text-gray-700">Claim updates</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox" defaultChecked />
                        <span className="ml-3 text-sm text-gray-700">New messages</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox" />
                        <span className="ml-3 text-sm text-gray-700">Weekly digest</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Privacy</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox" defaultChecked />
                        <span className="ml-3 text-sm text-gray-700">Show my location to others</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox" defaultChecked />
                        <span className="ml-3 text-sm text-gray-700">Allow messages from other users</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox" />
                        <span className="ml-3 text-sm text-gray-700">Show my activity to others</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Language & Region</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Language
                        </label>
                        <select className="form-select">
                          <option>Latvian (LV)</option>
                          <option>English (EN)</option>
                          <option>Russian (RU)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Zone
                        </label>
                        <select className="form-select">
                          <option>Europe/Riga (UTC+2)</option>
                          <option>Europe/Riga (UTC+3)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Change Password */}
                <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                    {!isChangingPassword ? (
                      <button
                        onClick={() => setIsChangingPassword(true)}
                        className="btn-outline"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Change Password
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setIsChangingPassword(false)}
                          className="btn-outline"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </button>
                        <button
                          onClick={handlePasswordSubmit}
                          disabled={changePasswordMutation.isLoading}
                          className="btn-primary"
                        >
                          {changePasswordMutation.isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Update Password
                        </button>
                      </div>
                    )}
                  </div>

                  {isChangingPassword && (
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="form-input"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="form-input"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="form-input"
                          required
                        />
                      </div>
                    </form>
                  )}
                </div>

                {/* Delete Account */}
                <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-red-600">Delete Account</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        This action cannot be undone. All your data will be permanently deleted.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="btn-danger"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                      <h3 className="text-lg font-semibold text-red-600 mb-4">Confirm Account Deletion</h3>
                      <p className="text-gray-600 mb-6">
                        This action cannot be undone. Please enter your password to confirm.
                      </p>
                      <input
                        type="password"
                        placeholder="Enter your password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="form-input mb-4"
                      />
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="btn-outline flex-1"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteAccountMutation.isLoading}
                          className="btn-danger flex-1"
                        >
                          {deleteAccountMutation.isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                          ) : (
                            'Delete Account'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;