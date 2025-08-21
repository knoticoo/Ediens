// [EDIT] - 2024-01-15 - Created SearchPage component - Ediens Team
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { useQuery } from 'react-query';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Tag, 
  Star, 
  Heart, 
  MessageCircle, 
  Sliders, 
  X,
  Calendar,
  DollarSign,
  Package,
  Building,
  Users,
  Eye,
  List,
  Grid,
  SortAsc,
  SortDesc,
  ArrowRight,
  Filter as FilterIcon
} from 'lucide-react';
import { api } from '@api/auth';
import toast from 'react-hot-toast';

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const searchInputRef = useRef(null);
  
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('relevance'); // 'relevance', 'date', 'price', 'distance'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Get initial search query from URL
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialCity = searchParams.get('city') || '';

  const [filters, setFilters] = useState({
    query: initialQuery,
    category: initialCategory,
    city: initialCity,
    priceRange: '',
    urgency: '',
    status: 'available',
    radius: 25,
    dateRange: '',
    dietary: [],
    allergens: []
  });

  // Fetch search results
  const { data: searchResults, isLoading: searchLoading, refetch: refetchSearch } = useQuery({
    queryKey: ['search', filters, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: filters.query,
        ...(filters.category && { category: filters.category }),
        ...(filters.city && { city: filters.city }),
        ...(filters.priceRange && { priceRange: filters.priceRange }),
        ...(filters.urgency && { urgency: filters.urgency }),
        ...(filters.status && { status: filters.status }),
        radius: filters.radius,
        ...(filters.dateRange && { dateRange: filters.dateRange }),
        ...(filters.dietary.length > 0 && { dietary: filters.dietary.join(',') }),
        ...(filters.allergens.length > 0 && { allergens: filters.allergens.join(',') }),
        sortBy,
        sortOrder
      });
      
      const response = await api.get(`/api/posts/search?${params}`);
      return response.data;
    },
    enabled: !!filters.query || !!filters.category || !!filters.city
  });

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
    { value: '0-2', label: '€0 - €2' },
    { value: '2-5', label: '€2 - €5' },
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

  // Status options for filtering
  const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'claimed', label: 'Claimed' }
  ];

  // Radius options for search
  const radiusOptions = [1, 5, 10, 25, 50, 100];

  // Date range options
  const dateRanges = [
    { value: '', label: 'Any Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  // Dietary options
  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Dairy-Free'
  ];

  // Common allergens
  const commonAllergens = [
    'Gluten', 'Dairy', 'Eggs', 'Soy', 'Nuts', 'Peanuts', 'Fish', 'Shellfish'
  ];

  // Update URL when filters change
  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    if (filters.query) newSearchParams.set('q', filters.query);
    if (filters.category) newSearchParams.set('category', filters.category);
    if (filters.city) newSearchParams.set('city', filters.city);
    setSearchParams(newSearchParams);
  }, [filters, setSearchParams]);

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current && initialQuery) {
      searchInputRef.current.focus();
    }
  }, [initialQuery]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle dietary toggle
  const handleDietaryToggle = (dietary) => {
    setFilters(prev => ({
      ...prev,
      dietary: prev.dietary.includes(dietary)
        ? prev.dietary.filter(d => d !== dietary)
        : [...prev.dietary, dietary]
    }));
  };

  // Handle allergen toggle
  const handleAllergenToggle = (allergen) => {
    setFilters(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      city: '',
      priceRange: '',
      urgency: '',
      status: 'available',
      radius: 25,
      dateRange: '',
      dietary: [],
      allergens: []
    });
    setSortBy('relevance');
    setSortOrder('desc');
  };

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (filters.query.trim() || filters.category || filters.city) {
      refetchSearch();
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Search Food</h1>
              <p className="text-gray-600 mt-1">
                Find the perfect food items in your area
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
                <FilterIcon className="w-5 h-5" />
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

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for food items, ingredients, or descriptions..."
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button type="submit" className="btn-primary px-6">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="form-select"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
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

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="form-select"
                >
                  {dateRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
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

            {/* Advanced Filters */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Advanced Filters</h4>
              
              {/* Dietary Preferences */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Preferences
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {dietaryOptions.map(dietary => (
                    <label key={dietary} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.dietary.includes(dietary)}
                        onChange={() => handleDietaryToggle(dietary)}
                        className="form-checkbox"
                      />
                      <span className="ml-2 text-sm text-gray-700">{dietary}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Allergens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exclude Allergens
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {commonAllergens.map(allergen => (
                    <label key={allergen} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.allergens.includes(allergen)}
                        onChange={() => handleAllergenToggle(allergen)}
                        className="form-checkbox"
                      />
                      <span className="ml-2 text-sm text-gray-700">{allergen}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Search Results
                {searchResults?.posts && (
                  <span className="text-gray-500 font-normal ml-2">
                    ({searchResults.posts.length} items found)
                  </span>
                )}
              </h3>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Sort Options */}
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="form-select text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="price">Price</option>
                  <option value="distance">Distance</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white text-primary-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-primary-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {searchLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : searchResults?.posts?.length > 0 ? (
          viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.posts.map((post) => (
                <div
                  key={post.id}
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
            /* List View */
            <div className="space-y-4">
              {searchResults.posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-6">
                    {/* Post Image */}
                    <div className="w-32 h-32 bg-gray-200 rounded-lg flex-shrink-0"></div>

                    {/* Post Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {post.title}
                          </h3>
                          <p className="text-gray-600 mb-3">
                            {post.description}
                          </p>
                        </div>
                        <div className="text-right ml-6">
                          <div className="text-2xl font-bold text-primary-600">
                            {post.price === 0 ? 'Free' : `€${post.price}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            Qty: {post.quantity}
                          </div>
                        </div>
                      </div>

                      {/* Post Meta */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
                        <div className="flex items-center text-sm text-gray-500">
                          <Package className="w-4 h-4 mr-2" />
                          <span className="capitalize">{post.category}</span>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {post.user?.firstName?.[0]}{post.user?.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {post.user?.firstName} {post.user?.lastName}
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              {post.user?.isBusiness && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <Building className="w-3 h-3 mr-1" />
                                  Business
                                </span>
                              )}
                              {post.user?.rating && (
                                <span className="flex items-center">
                                  <Star className="w-3 h-3 text-yellow-500 mr-1" />
                                  {post.user.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleClaim(post)}
                            className="btn-primary"
                          >
                            <Heart className="w-4 h-4 mr-2" />
                            Claim
                          </button>
                          <button
                            onClick={() => handleMessage(post)}
                            className="btn-outline"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Message
                          </button>
                          <button
                            onClick={() => handleViewProfile(post.user.id)}
                            className="btn-outline"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No results found</p>
            <p className="mb-4">Try adjusting your search criteria or filters</p>
            <button
              onClick={clearFilters}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;