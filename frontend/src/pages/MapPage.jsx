// [EDIT] - 2024-01-15 - Created MapPage component - Ediens Team
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { useQuery } from 'react-query';
import { 
  MapPin, 
  Search, 
  Filter, 
  X, 
  Heart, 
  Clock, 
  Tag, 
  Star, 
  Navigation,
  Sliders,
  List,
  Map as MapIcon,
  Eye,
  MessageCircle,
  Phone,
  Calendar,
  Leaf
} from 'lucide-react';
import { api } from '@api/auth';
import toast from 'react-hot-toast';

const MapPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mapRef = useRef(null);
  
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    urgency: '',
    radius: 10,
    searchQuery: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 56.9496, lng: 24.1052 }); // Riga, Latvia

  // Fetch nearby food posts
  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ['nearbyPosts', filters, userLocation],
    queryFn: async () => {
      const params = new URLSearchParams({
        radius: filters.radius,
        ...(filters.category && { category: filters.category }),
        ...(filters.priceRange && { priceRange: filters.priceRange }),
        ...(filters.urgency && { urgency: filters.urgency }),
        ...(filters.searchQuery && { search: filters.searchQuery })
      });
      
      if (userLocation) {
        params.append('lat', userLocation.lat);
        params.append('lng', userLocation.lng);
      }
      
      const response = await api.get(`/api/posts/nearby?${params}`);
      return response.data;
    },
    enabled: !!userLocation || !!filters.searchQuery
  });

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          setUserLocation({ lat, lng });
          setMapCenter({ lat, lng });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Default to Riga, Latvia
          setUserLocation({ lat: 56.9496, lng: 24.1052 });
        }
      );
    }
  }, []);

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

  // Price ranges for filtering
  const priceRanges = [
    { value: '', label: 'All Prices' },
    { value: 'free', label: 'Free Only' },
    { value: '0-5', label: '€0 - €5' },
    { value: '5-10', label: '€5 - €10' },
    { value: '10+', label: '€10+' }
  ];

  // Urgency levels for filtering
  const urgencyLevels = [
    { value: '', label: 'All Urgency' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  // Radius options for search
  const radiusOptions = [1, 5, 10, 25, 50];

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
      category: '',
      priceRange: '',
      urgency: '',
      radius: 10,
      searchQuery: ''
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

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Handle post selection
  const handlePostSelect = (post) => {
    setSelectedPost(post);
    if (viewMode === 'list') {
      // Scroll to post in list view
      const element = document.getElementById(`post-${post.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Handle claim food
  const handleClaim = (post) => {
    if (!user) {
      toast.error('Please log in to claim food');
      navigate('/login');
      return;
    }
    navigate(`/posts/${post.id}`);
  };

  // Handle message user
  const handleMessage = (post) => {
    if (!user) {
      toast.error('Please log in to send messages');
      navigate('/login');
      return;
    }
    navigate(`/messages?user=${post.user.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Food Map</h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'map' 
                      ? 'bg-primary-100 text-primary-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MapIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-primary-100 text-primary-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search food items..."
                  value={filters.searchQuery}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
                />
              </div>
              
              {/* Filter Button */}
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
              
              {/* Location Button */}
              <button
                onClick={() => {
                  if (userLocation) {
                    setMapCenter(userLocation);
                    refetchPosts();
                  }
                }}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Center on my location"
              >
                <Navigation className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  className="form-select"
                >
                  {priceRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Urgency Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency
                </label>
                <select
                  value={filters.urgency}
                  onChange={(e) => handleFilterChange('urgency', e.target.value)}
                  className="form-select"
                >
                  {urgencyLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Radius Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Radius
                </label>
                <select
                  value={filters.radius}
                  onChange={(e) => handleFilterChange('radius', parseInt(e.target.value))}
                  className="form-select"
                >
                  {radiusOptions.map(radius => (
                    <option key={radius} value={radius}>
                      {radius} km
                    </option>
                  ))}
                </select>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'map' ? (
          /* Map View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Container */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4">
                <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Interactive Map</p>
                    <p className="text-sm">Map integration will be implemented here</p>
                    <p className="text-xs mt-2">Using Mapbox GL JS or similar</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar with Posts */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Nearby Food ({posts?.posts?.length || 0})
                </h3>
                
                {postsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : posts?.posts?.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {posts.posts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => handlePostSelect(post)}
                        className={`border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow ${
                          selectedPost?.id === post.id ? 'ring-2 ring-primary-500' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate mb-1">
                              {post.title}
                            </h4>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {post.description}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {post.location?.city || 'Unknown'}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {getTimeUntilExpiry(post.expiryDate)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary-600">
                              {post.price === 0 ? 'Free' : `€${post.price}`}
                            </div>
                            <div className="flex space-x-1 mt-1">
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
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No food items found nearby</p>
                    <p className="text-sm">Try adjusting your filters or location</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="space-y-6">
            {postsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : posts?.posts?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.posts.map((post) => (
                  <div
                    key={post.id}
                    id={`post-${post.id}`}
                    className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-large transition-shadow"
                  >
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
                <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No food items found</p>
                <p className="mb-4">Try adjusting your search criteria or location</p>
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
      </div>

      {/* Selected Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{selectedPost.title}</h2>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Post Image */}
              <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>

              {/* Post Details */}
              <div className="space-y-4">
                <p className="text-gray-600">{selectedPost.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Price:</span>
                    <span className="ml-2 text-lg font-bold text-primary-600">
                      {selectedPost.price === 0 ? 'Free' : `€${selectedPost.price}`}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Quantity:</span>
                    <span className="ml-2">{selectedPost.quantity}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 capitalize">{selectedPost.category}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Expires:</span>
                    <span className="ml-2">{formatDate(selectedPost.expiryDate)}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(selectedPost.urgency)}`}>
                    {selectedPost.urgency} urgency
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPost.status)}`}>
                    {selectedPost.status}
                  </span>
                </div>

                {/* Location */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Pickup Location</h4>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{selectedPost.location?.address}, {selectedPost.location?.city}</span>
                  </div>
                </div>

                {/* User Info */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Shared by</h4>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-primary-600">
                        {selectedPost.user?.firstName?.[0]}{selectedPost.user?.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedPost.user?.firstName} {selectedPost.user?.lastName}
                      </p>
                      {selectedPost.user?.isBusiness && (
                        <p className="text-sm text-blue-600">Business Account</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-4 flex space-x-3">
                  <button
                    onClick={() => handleClaim(selectedPost)}
                    className="btn-primary flex-1"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Claim This Food
                  </button>
                  <button
                    onClick={() => handleMessage(selectedPost)}
                    className="btn-outline"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;