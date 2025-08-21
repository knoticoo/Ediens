// [EDIT] - 2024-01-15 - Created DashboardPage component - Ediens Team
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { 
  Plus, 
  MapPin, 
  Heart, 
  MessageCircle, 
  Star, 
  Leaf, 
  TrendingUp,
  Clock,
  Calendar,
  Users,
  Award,
  Settings,
  Bell,
  Search,
  Filter,
  ArrowRight,
  Eye,
  Clock as ClockIcon,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@api/auth';

const DashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentClaims, setRecentClaims] = useState([]);

  // Fetch user statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const response = await api.get('/api/users/stats/me');
      return response.data;
    },
    enabled: !!user
  });

  // Fetch recent posts
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['userPosts'],
    queryFn: async () => {
      const response = await api.get('/api/posts/user/posts?limit=5');
      return response.data;
    },
    enabled: !!user
  });

  // Fetch recent claims
  const { data: claims, isLoading: claimsLoading } = useQuery({
    queryKey: ['userClaims'],
    queryFn: async () => {
      const response = await api.get('/api/claims/user?limit=5');
      return response.data;
    },
    enabled: !!user
  });

  useEffect(() => {
    if (posts) {
      setRecentPosts(posts.posts || []);
    }
  }, [posts]);

  useEffect(() => {
    if (claims) {
      setRecentClaims(claims.claims || []);
    }
  }, [claims]);

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
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString('lv-LV');
  };

  const getTimeUntilExpiry = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffHours <= 0) return 'Expired';
    if (diffHours <= 24) return `${diffHours}h left`;
    const diffDays = Math.ceil(diffHours / 24);
    return `${diffDays}d left`;
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
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.firstName}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your food sharing activities
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/create-post"
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Share Food</span>
              </Link>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Leaf className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Eco Points</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.stats?.totalEcoPoints || 0}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+{Math.floor((stats?.stats?.totalEcoPoints || 0) / 10)} this week</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-secondary-100 rounded-lg">
                <Plus className="w-6 h-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Food Posts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.stats?.totalPosts || 0}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-blue-600">
              <Clock className="w-4 h-4 mr-1" />
              <span>{stats?.stats?.availablePosts || 0} available</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Successful Pickups</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.stats?.successfulPickups || 0}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-success-600">
              <Award className="w-4 h-4 mr-1" />
              <span>Top contributor</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-accent-100 rounded-lg">
                <Users className="w-6 h-6 text-accent-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Claims Received</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.stats?.claimsReceived || 0}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-accent-600">
              <MessageCircle className="w-4 h-4 mr-1" />
              <span>Active conversations</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'posts', label: 'My Posts', icon: Plus },
                { id: 'claims', label: 'My Claims', icon: Heart },
                { id: 'messages', label: 'Messages', icon: MessageCircle }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Posts */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Food Posts</h3>
                      <Link to="/profile" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                        View all
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {postsLoading ? (
                        <div className="animate-pulse space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                          ))}
                        </div>
                      ) : recentPosts.length > 0 ? (
                        recentPosts.slice(0, 3).map((post) => (
                          <div key={post.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                                  {post.status}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(post.urgency)}`}>
                                  {post.urgency}
                                </span>
                              </div>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                              <div>{formatDate(post.createdAt)}</div>
                              <div className="mt-1">{getTimeUntilExpiry(post.expiryDate)}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Plus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No food posts yet</p>
                          <Link to="/create-post" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                            Share your first food item
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Claims */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Claims</h3>
                      <Link to="/claims" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                        View all
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {claimsLoading ? (
                        <div className="animate-pulse space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                          ))}
                        </div>
                      ) : recentClaims.length > 0 ? (
                        recentClaims.slice(0, 3).map((claim) => (
                          <div key={claim.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {claim.foodPost?.title || 'Food Item'}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClaimStatusColor(claim.status)}`}>
                                  {claim.status}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Qty: {claim.quantity}
                                </span>
                              </div>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                              <div>{formatDate(claim.createdAt)}</div>
                              <div className="mt-1">{getTimeUntilExpiry(claim.pickupDate)}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No claims yet</p>
                          <Link to="/map" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                            Browse available food
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                      to="/create-post"
                      className="flex items-center p-4 bg-white rounded-lg shadow-soft hover:shadow-large transition-shadow"
                    >
                      <div className="p-2 bg-primary-100 rounded-lg mr-3">
                        <Plus className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Share Food</p>
                        <p className="text-sm text-gray-600">Post leftover food</p>
                      </div>
                    </Link>

                    <Link
                      to="/map"
                      className="flex items-center p-4 bg-white rounded-lg shadow-soft hover:shadow-large transition-shadow"
                    >
                      <div className="p-2 bg-secondary-100 rounded-lg mr-3">
                        <MapPin className="w-5 h-5 text-secondary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Browse Food</p>
                        <p className="text-sm text-gray-600">Find nearby offers</p>
                      </div>
                    </Link>

                    <Link
                      to="/messages"
                      className="flex items-center p-4 bg-white rounded-lg shadow-soft hover:shadow-large transition-shadow"
                    >
                      <div className="p-2 bg-accent-100 rounded-lg mr-3">
                        <MessageCircle className="w-5 h-5 text-accent-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Messages</p>
                        <p className="text-sm text-gray-600">Check conversations</p>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">My Food Posts</h3>
                  <Link to="/create-post" className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    New Post
                  </Link>
                </div>
                {/* Posts list will be implemented here */}
                <div className="text-center py-12 text-gray-500">
                  <Plus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No food posts yet</p>
                  <p className="mb-4">Start sharing your leftover food with the community</p>
                  <Link to="/create-post" className="btn-primary">
                    Share Your First Food Item
                  </Link>
                </div>
              </div>
            )}

            {/* Claims Tab */}
            {activeTab === 'claims' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">My Claims</h3>
                  <Link to="/map" className="btn-outline">
                    <MapPin className="w-4 h-4 mr-2" />
                    Browse Food
                  </Link>
                </div>
                {/* Claims list will be implemented here */}
                <div className="text-center py-12 text-gray-500">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No claims yet</p>
                  <p className="mb-4">Start claiming food items from your community</p>
                  <Link to="/map" className="btn-primary">
                    Browse Available Food
                  </Link>
                </div>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
                  <Link to="/messages" className="btn-outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    View All
                  </Link>
                </div>
                {/* Messages list will be implemented here */}
                <div className="text-center py-12 text-gray-500">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No messages yet</p>
                  <p className="mb-4">Start conversations when you share or claim food</p>
                  <Link to="/create-post" className="btn-primary">
                    Share Food to Get Started
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;