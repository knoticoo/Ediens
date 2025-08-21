// [EDIT] - 2024-01-15 - Created NotFoundPage component - Ediens Team
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, Map, Trending, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative">
            <div className="text-9xl font-bold text-green-600 opacity-20">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl">🍽️</div>
            </div>
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Oops! Page Not Found
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Looks like this food post has already been claimed or doesn't exist. 
          Don't worry, there are plenty of other delicious options waiting for you!
        </p>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Home size={20} />
            Go Home
          </Link>
          <Link
            to="/map"
            className="flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Map size={20} />
            Explore Map
          </Link>
        </div>

        {/* Popular Destinations */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Popular Destinations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/trending"
              className="flex items-center justify-center gap-2 p-3 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Trending size={16} />
              Trending
            </Link>
            <Link
              to="/search"
              className="flex items-center justify-center gap-2 p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Search size={16} />
              Search
            </Link>
            <Link
              to="/leaderboard"
              className="flex items-center justify-center gap-2 p-3 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <span className="text-lg">🏆</span>
              Leaderboard
            </Link>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-500">
          <p>
            If you believe this is an error, please{' '}
            <a href="mailto:support@ediens.lv" className="text-green-600 hover:underline">
              contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;