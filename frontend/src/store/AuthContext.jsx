// [EDIT] - 2024-01-15 - Created AuthContext - Ediens Team
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// API service
import { authAPI } from '@api/auth';

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_TOKEN: 'SET_TOKEN',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('ediens_token') || null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.SET_TOKEN:
      return {
        ...state,
        token: action.payload,
        isAuthenticated: !!action.payload,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('ediens_token');
      if (token) {
        try {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
          const response = await authAPI.getProfile();
          dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.user });
        } catch (error) {
          console.error('Auth check failed:', error);
          // Token is invalid, remove it
          localStorage.removeItem('ediens_token');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await authAPI.login(email, password);
      
      // Store token
      localStorage.setItem('ediens_token', response.token);
      
      // Update state
      dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: response.token });
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.user });
      
      toast.success('Login successful!');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await authAPI.register(userData);
      
      // Store token
      localStorage.setItem('ediens_token', response.token);
      
      // Update state
      dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: response.token });
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.user });
      
      toast.success('Registration successful! Welcome to Ediens!');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (state.token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('ediens_token');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.success('Logged out successfully');
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await authAPI.updateProfile(profileData);
      
      // Update user in state
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: response.user });
      
      toast.success('Profile updated successfully!');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Profile update failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Update user location
  const updateLocation = async (locationData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await authAPI.updateLocation(locationData);
      
      // Update user location in state
      dispatch({ 
        type: AUTH_ACTIONS.UPDATE_USER, 
        payload: { location: response.location } 
      });
      
      toast.success('Location updated successfully!');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Location update failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('ediens_refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authAPI.refreshToken(refreshToken);
      
      // Store new token
      localStorage.setItem('ediens_token', response.token);
      
      // Update state
      dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: response.token });
      
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Refresh failed, logout user
      await logout();
      throw error;
    }
  };

  // Google OAuth
  const loginWithGoogle = () => {
    const googleAuthUrl = `${import.meta.env.VITE_API_URL}/api/auth/google`;
    window.location.href = googleAuthUrl;
  };

  // Facebook OAuth
  const loginWithFacebook = () => {
    const facebookAuthUrl = `${import.meta.env.VITE_API_URL}/api/auth/facebook`;
    window.location.href = facebookAuthUrl;
  };

  // Handle OAuth callback
  const handleOAuthCallback = (token) => {
    localStorage.setItem('ediens_token', token);
    dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
    
    // Fetch user profile
    authAPI.getProfile()
      .then(response => {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.user });
        toast.success('Login successful!');
        navigate('/dashboard');
      })
      .catch(error => {
        console.error('Failed to get user profile:', error);
        toast.error('Login failed. Please try again.');
      });
  };

  // Check if user has permission
  const hasPermission = (permission) => {
    if (!state.user) return false;
    
    switch (permission) {
      case 'create_post':
        return true; // All authenticated users can create posts
      
      case 'business_features':
        return state.user.isBusiness;
      
      case 'premium_features':
        return state.user.isPremium && state.user.hasActivePremium;
      
      case 'admin':
        return state.user.role === 'admin';
      
      default:
        return false;
    }
  };

  // Get user's eco points
  const getEcoPoints = () => {
    return state.user?.ecoPoints || 0;
  };

  // Add eco points (for testing/demo purposes)
  const addEcoPoints = (points) => {
    if (state.user) {
      dispatch({ 
        type: AUTH_ACTIONS.UPDATE_USER, 
        payload: { ecoPoints: state.user.ecoPoints + points } 
      });
    }
  };

  // Context value
  const value = {
    // State
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    error: state.error,
    isAuthenticated: state.isAuthenticated,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    updateLocation,
    refreshToken,
    loginWithGoogle,
    loginWithFacebook,
    handleOAuthCallback,
    
    // Utilities
    hasPermission,
    getEcoPoints,
    addEcoPoints,
    
    // Dispatch (for advanced usage)
    dispatch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    
    return <Component {...props} />;
  };
};

// Export action types for external use
export { AUTH_ACTIONS };