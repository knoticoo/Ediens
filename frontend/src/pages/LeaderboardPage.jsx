// [EDIT] - 2024-01-15 - Created LeaderboardPage component - Ediens Team
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { 
  Trophy, 
  Medal, 
  Award, 
  Star, 
  Heart, 
  Leaf, 
  Users, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Building,
  Filter,
  Sliders,
  Search,
  ArrowUp,
  ArrowDown,
  Minus,
  Crown,
  Zap,
  Target,
  Gift
} from 'lucide-react';
import { api } from '@api/auth';

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { user } = useNavigate();
  
  const [activeTab, setActiveTab] = useState('ecoPoints');
  const [timeRange, setTimeRange] = useState('allTime');
  const [filters, setFilters] = useState({
    city: '',
    category: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch leaderboard data
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard', activeTab, timeRange, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: activeTab,
        timeRange: timeRange,
        ...(filters.city && { city: filters.city }),
        ...(filters.category !== 'all' && { category: filters.category })
      });
      
      const response = await api.get(`/api/users/leaderboard?${params}`);
      return response.data;
    }
  });

  // Fetch user's own ranking
  const { data: userRanking } = useQuery({
    queryKey: ['userRanking', activeTab, timeRange],
    queryFn: async () => {
      const response = await api.get(`/api/users/leaderboard/me?type=${activeTab}&timeRange=${timeRange}`);
      return response.data;
    },
    enabled: !!user
  });

  // Fetch achievements data
  const { data: achievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const response = await api.get('/api/users/achievements');
      return response.data;
    }
  });

  // Time range options
  const timeRanges = [
    { value: 'week', label: 'This Week', icon: '📅' },
    { value: 'month', label: 'This Month', icon: '🗓️' },
    { value: 'quarter', label: 'This Quarter', icon: '📊' },
    { value: 'year', label: 'This Year', icon: '🎯' },
    { value: 'allTime', label: 'All Time', icon: '🏆' }
  ];

  // Leaderboard categories
  const leaderboardCategories = [
    { id: 'ecoPoints', label: 'Eco Points', icon: Leaf, description: 'Environmental impact score' },
    { id: 'foodShared', label: 'Food Shared', icon: Heart, description: 'Total food items shared' },
    { id: 'pickups', label: 'Successful Pickups', icon: Users, description: 'Food items successfully claimed' },
    { id: 'streak', label: 'Sharing Streak', icon: Zap, description: 'Consecutive days of sharing' },
    { id: 'rating', label: 'User Rating', icon: Star, description: 'Average rating from other users' }
  ];

  // Achievement types
  const achievementTypes = [
    { type: 'eco', label: 'Eco Warrior', icon: Leaf, color: 'text-green-600' },
    { type: 'sharing', label: 'Sharing Master', icon: Heart, color: 'text-red-600' },
    { type: 'streak', label: 'Streak Champion', icon: Zap, color: 'text-yellow-600' },
    { type: 'community', label: 'Community Hero', icon: Users, color: 'text-blue-600' },
    { type: 'quality', label: 'Quality Provider', icon: Star, color: 'text-purple-600' }
  ];

  // Get rank icon and color
  const getRankDisplay = (rank) => {
    if (rank === 1) return { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-100' };
    if (rank === 2) return { icon: Medal, color: 'text-gray-500', bg: 'bg-gray-100' };
    if (rank === 3) return { icon: Award, color: 'text-orange-500', bg: 'bg-orange-100' };
    return { icon: Trophy, color: 'text-primary-600', bg: 'bg-primary-100' };
  };

  // Get trend indicator
  const getTrendIndicator = (trend) => {
    if (trend > 0) return { icon: ArrowUp, color: 'text-green-600', label: `+${trend}` };
    if (trend < 0) return { icon: ArrowDown, color: 'text-red-600', label: trend };
    return { icon: Minus, color: 'text-gray-500', label: '0' };
  };

  // Format numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      city: '',
      category: 'all'
    });
  };

  // Handle user profile navigation
  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // Handle user posts navigation
  const handleViewPosts = (userId) => {
    navigate(`/map?user=${userId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
              <p className="text-gray-600 mt-1">
                See who's making the biggest impact in food sharing
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
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="form-select"
                >
                  {timeRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.icon} {range.label}
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
                  <option value="all">All Categories</option>
                  <option value="fresh">Fresh Produce</option>
                  <option value="cooked">Cooked Meals</option>
                  <option value="bakery">Bakery</option>
                  <option value="packaged">Packaged Food</option>
                  <option value="dairy">Dairy & Eggs</option>
                  <option value="frozen">Frozen Food</option>
                  <option value="beverages">Beverages</option>
                  <option value="snacks">Snacks</option>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User's Current Ranking */}
        {userRanking && (
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6 mb-8 border border-primary-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Your Ranking</h3>
                  <p className="text-gray-600">
                    You're currently ranked #{userRanking.rank} in {activeTab.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">
                  {formatNumber(userRanking.score)}
                </div>
                <div className="text-sm text-gray-600">
                  {activeTab === 'ecoPoints' ? 'Eco Points' : 
                   activeTab === 'foodShared' ? 'Items Shared' :
                   activeTab === 'pickups' ? 'Pickups' :
                   activeTab === 'streak' ? 'Day Streak' : 'Rating'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Categories */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {leaderboardCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveTab(category.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === category.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  <span>{category.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Category Description */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                {leaderboardCategories.find(cat => cat.id === activeTab)?.icon && 
                  React.createElement(leaderboardCategories.find(cat => cat.id === activeTab)?.icon, { className: "w-5 h-5 text-primary-600" })
                }
                <h3 className="text-lg font-semibold text-gray-900">
                  {leaderboardCategories.find(cat => cat.id === activeTab)?.label} Leaderboard
                </h3>
              </div>
              <p className="text-gray-600">
                {leaderboardCategories.find(cat => cat.id === activeTab)?.description}
              </p>
            </div>

            {/* Leaderboard Table */}
            {leaderboardLoading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : leaderboardData?.users?.length > 0 ? (
              <div className="space-y-3">
                {leaderboardData.users.map((user, index) => {
                  const rank = index + 1;
                  const rankDisplay = getRankDisplay(rank);
                  const trend = getTrendIndicator(user.trend || 0);
                  
                  return (
                    <div
                      key={user.id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {/* Rank */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${rankDisplay.bg}`}>
                          {rank <= 3 ? (
                            <rankDisplay.icon className={`w-6 h-6 ${rankDisplay.color}`} />
                          ) : (
                            <span className="text-lg font-bold text-gray-700">#{rank}</span>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-600">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </h4>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                {user.isBusiness && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <Building className="w-3 h-3 mr-1" />
                                    Business
                                  </span>
                                )}
                                <span className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {user.city}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">
                            {formatNumber(user.score)}
                          </div>
                          <div className="flex items-center justify-center space-x-1 text-sm">
                            <trend.icon className={`w-4 h-4 ${trend.color}`} />
                            <span className={trend.color}>{trend.label}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleViewProfile(user.id)}
                            className="btn-outline text-sm px-3 py-1"
                          >
                            Profile
                          </button>
                          <button
                            onClick={() => handleViewPosts(user.id)}
                            className="btn-outline text-sm px-3 py-1"
                          >
                            Posts
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No leaderboard data available</p>
                <p className="mb-4">Start sharing food to appear on the leaderboard</p>
                <button
                  onClick={() => navigate('/create-post')}
                  className="btn-primary"
                >
                  Share Your First Food Item
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Achievements Section */}
        {achievements && (
          <div className="bg-white rounded-xl shadow-soft border border-gray-100">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Gift className="w-5 h-5 mr-2 text-primary-600" />
                Achievements & Badges
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievementTypes.map((achievementType) => {
                  const userAchievements = achievements.achievements?.filter(
                    a => a.type === achievementType.type
                  ) || [];
                  
                  return (
                    <div key={achievementType.type} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${achievementType.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                          <achievementType.icon className={`w-5 h-5 ${achievementType.color}`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{achievementType.label}</h4>
                          <p className="text-sm text-gray-500">
                            {userAchievements.length} of {achievements.totalAchievements} unlocked
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {userAchievements.map((achievement) => (
                          <div key={achievement.id} className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded-full ${achievement.unlocked ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className={`text-sm ${achievement.unlocked ? 'text-gray-900' : 'text-gray-400'}`}>
                              {achievement.name}
                            </span>
                            {achievement.unlocked && (
                              <span className="text-xs text-green-600 font-medium">
                                +{achievement.points} pts
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;