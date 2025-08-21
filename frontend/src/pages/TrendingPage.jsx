// [EDIT] - 2024-01-15 - Created TrendingPage component - Ediens Team
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { useQuery } from 'react-query';
import { 
  TrendingUp, 
  Flame, 
  Star, 
  Heart, 
  Eye, 
  MessageCircle, 
  MapPin, 
  Clock, 
  Tag, 
  Filter,
  Sliders,
  Calendar,
  Users,
  Award,
  Leaf,
  ArrowRight,
  Search,
  X,
  Building
} from 'lucide-react';
import { api } from '@api/auth';
import toast from 'react-hot-toast';

const TrendingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('trending');
  const [filters, setFilters] = useState({
    timeRange: 'week',
    category: '',
    city: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch trending posts
  const { data: trendingPosts, isLoading: trendingLoading } = useQuery({
    queryKey: ['trendingPosts', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeRange: filters.timeRange,
        ...(filters.category && { category: filters.category }),
        ...(filters.city && { city: filters.city })
      });
      
      const response = await api.get(`/api/posts/trending?${params}`);
      return response.data;
    }
  });

  // Fetch popular categories
  const { data: popularCategories } = useQuery({
    queryKey: ['popularCategories'],
    queryFn: async () => {
      const response = await api.get('/api/posts/categories/popular');
      return response.data;
    }
  });

  // Fetch top contributors
  const { data: topContributors } = useQuery({
    queryKey: ['topContributors'],
    queryFn: async () => {
      const response = await api.get('/api/users/leaderboard?limit=10');
      return response.data;
    }
  });

  // Time range options
  const timeRanges = [
    { value: 'day', label: 'Today', icon: '🌅' },
    { value: 'week', label: 'This Week', icon: '📅' },
    { value: 'month', label: 'This Month', icon: '🗓️' },
    { value: 'year', label: 'This Year', icon: '📊' }
  ];

  // Categories for filtering
  const categories = [
    { value: '', label: 'All Categories', icon: '🍽️' },
    { value: 'fresh', label: 'Fresh Produce', icon: '🥬' },
    { value: 'cooked', label: 'Cooked Meals', icon: '🍲' },
    { value: 'bakery', label: 'Bakery', icon: '🥖' },
    { value: 'packaged', label: 'Packaged Food', icon: '📦' },
    { value: 'dairy', label: 'Dairy & Eggs', icon: '🥛' },
    { value: 'frozen', label: 'Frozen Food', icon: '🧊' },
    { value: 'beverages', label: 'Beverages', icon: '🥤' },
    { value: 'snacks', label: 'Snacks', icon: '🍿' }
  ];

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      timeRange: 'week',
      category: '',
      city: ''
    });
  };

  // Get urgency color
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'reserved': return 'text-blue-600 bg-blue-100';
      case 'claimed': return 'text-purple-600 bg-purple-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('lv-LV');
  };

  // Get time until expiry
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

  // Handle post actions
  const handleClaim = (post) => {
    if (!user) {
      toast.error('Please log in to claim food');
      navigate('/login');
      return;
    }
    navigate(`/posts/${post.id}`);
  };

  const handleMessage = (post) => {
    if (!user) {
      toast.error('Please log in to send messages');
      navigate('/login');
      return;
    }
    navigate(`/messages?user=${post.user.id}`);
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trending & Popular</h1>
              <p className="text-gray-600 mt-1">
                Discover the most popular food items and top contributors
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Sliders className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/create-post')}
                className="btn-primary"
              >
                Share Food
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Time Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Range
                </label>
                <select
                  value={filters.timeRange}
                  onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                  className="form-select"
                >
                  {timeRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.icon} {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="form-select"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  placeholder="Enter city name"
                  className="form-input"
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="btn-outline w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'trending', label: 'Trending Posts', icon: TrendingUp },
                { id: 'categories', label: 'Popular Categories', icon: Tag },
                { id: 'contributors', label: 'Top Contributors', icon: Award }
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
            {/* Trending Posts Tab */}
            {activeTab === 'trending' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Trending Food Posts
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>Based on views, claims, and engagement</span>
                  </div>
                </div>

                {trendingLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-64 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : trendingPosts?.posts?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trendingPosts.posts.map((post, index) => (
                      <div
                        key={post.id}
                        className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-large transition-shadow"
                      >
                        {/* Trending Badge */}
                        {index < 3 && (
                          <div className="absolute top-3 left-3 z-10">
                            <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                              index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                            }`}>
                              #{index + 1}
                            </div>
                          </div>
                        )}

                        {/* Post Image */}
                        <div className="h-48 bg-gray-200 relative">
                          <div className="absolute top-3 right-3 flex space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(post.urgency)}`}>
                              {post.urgency}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                              {post.status}
                            </span>
                          </div>
                        </div>

                        {/* Post Content */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 line-clamp-2">
                              {post.title}
                            </h3>
                            <div className="text-right ml-3">
                              <div className="text-xl font-bold text-primary-600">
                                {post.price === 0 ? 'Free' : `€${post.price}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                Qty: {post.quantity}
                              </div>
                            </div>
                          </div>

                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                            {post.description}
                          </p>

                          {/* Post Meta */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span>{post.location?.address}, {post.location?.city}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="w-4 h-4 mr-2" />
                              <span>Expires: {formatDate(post.expiryDate)}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>Posted: {formatDate(post.createdAt)}</span>
                            </div>
                          </div>

                          {/* User Info */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-600">
                                  {post.user?.firstName?.[0]}{post.user?.lastName?.[0]}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {post.user?.firstName} {post.user?.lastName}
                                </p>
                                {post.user?.isBusiness && (
                                  <p className="text-xs text-blue-600">Business Account</p>
                                )}
                              </div>
                            </div>
                            {post.user?.rating && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                <span>{post.user.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleClaim(post)}
                              className="btn-primary flex-1"
                            >
                              <Heart className="w-4 h-4 mr-2" />
                              Claim
                            </button>
                            <button
                              onClick={() => handleMessage(post)}
                              className="btn-outline"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No trending posts found</p>
                    <p className="mb-4">Try adjusting your filters or check back later</p>
                    <button
                      onClick={clearFilters}
                      className="btn-primary"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Popular Categories Tab */}
            {activeTab === 'categories' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Popular Food Categories
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Tag className="w-4 h-4 text-blue-500" />
                    <span>Based on post volume and engagement</span>
                  </div>
                </div>

                {popularCategories?.categories?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {popularCategories.categories.map((category, index) => (
                      <div
                        key={category.name}
                        className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 hover:shadow-large transition-shadow cursor-pointer"
                        onClick={() => {
                          setFilters(prev => ({ ...prev, category: category.value }));
                          setActiveTab('trending');
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-3xl">{category.icon}</div>
                          {index < 3 && (
                            <div className={`px-2 py-1 rounded-full text-xs font-bold text-white ${
                              index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                            }`}>
                              #{index + 1}
                            </div>
                          )}
                        </div>
                        
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {category.label}
                        </h4>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center justify-between">
                            <span>Total Posts:</span>
                            <span className="font-medium">{category.postCount}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Success Rate:</span>
                            <span className="font-medium">{category.successRate}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Avg. Views:</span>
                            <span className="font-medium">{category.avgViews}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center text-primary-600 text-sm font-medium">
                          <span>Browse category</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Tag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No category data available</p>
                    <p className="mb-4">Category statistics will appear as more food is shared</p>
                  </div>
                )}
              </div>
            )}

            {/* Top Contributors Tab */}
            {activeTab === 'contributors' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Top Contributors
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span>Based on eco points and successful pickups</span>
                  </div>
                </div>

                {topContributors?.users?.length > 0 ? (
                  <div className="space-y-4">
                    {topContributors.users.map((contributor, index) => (
                      <div
                        key={contributor.id}
                        className="bg-white rounded-xl shadow-soft border border-gray-100 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-4">
                          {/* Rank */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-500' : 'bg-primary-500'
                          }`}>
                            #{index + 1}
                          </div>

                          {/* User Info */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-lg font-medium text-primary-600">
                                  {contributor.firstName?.[0]}{contributor.lastName?.[0]}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {contributor.firstName} {contributor.lastName}
                                </h4>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  {contributor.isBusiness && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      <Building className="w-3 h-3 mr-1" />
                                      Business
                                    </span>
                                  )}
                                  <span className="flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {contributor.city}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="text-right">
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="text-center">
                                <div className="text-lg font-bold text-primary-600">
                                  {contributor.totalEcoPoints}
                                </div>
                                <div className="text-gray-500">Eco Points</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-secondary-600">
                                  {contributor.successfulPickups}
                                </div>
                                <div className="text-gray-500">Pickups</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-success-600">
                                  {contributor.totalPosts}
                                </div>
                                <div className="text-gray-500">Posts</div>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => handleViewProfile(contributor.id)}
                              className="btn-outline text-sm px-3 py-1"
                            >
                              View Profile
                            </button>
                            <button
                              onClick={() => navigate(`/map?user=${contributor.id}`)}
                              className="btn-outline text-sm px-3 py-1"
                            >
                              View Posts
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No contributor data available</p>
                    <p className="mb-4">Leaderboard will populate as users start sharing food</p>
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

export default TrendingPage;