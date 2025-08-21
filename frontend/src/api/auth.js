// [EDIT] - 2024-01-15 - Created authentication API service - Ediens Team
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ediens_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('ediens_refresh_token');
        if (refreshToken) {
          const response = await api.post('/api/auth/refresh', { refreshToken });
          const newToken = response.data.token;
          
          localStorage.setItem('ediens_token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('ediens_token');
        localStorage.removeItem('ediens_refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Authentication API methods
export const authAPI = {
  // User registration
  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // User login
  login: async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/api/auth/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user location
  updateLocation: async (locationData) => {
    try {
      const response = await api.put('/api/auth/location', locationData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/api/auth/refresh', { refreshToken });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await api.post('/api/auth/logout');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Google OAuth
  googleAuth: () => {
    const googleAuthUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/google`;
    window.location.href = googleAuthUrl;
  },

  // Facebook OAuth
  facebookAuth: () => {
    const facebookAuthUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/facebook`;
    window.location.href = facebookAuthUrl;
  },

  // Validate email (for email verification)
  validateEmail: async (email) => {
    try {
      const response = await api.post('/api/auth/validate-email', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/api/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/api/auth/change-password', { currentPassword, newPassword });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify email
  verifyEmail: async (token) => {
    try {
      const response = await api.post('/api/auth/verify-email', { token });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Resend email verification
  resendEmailVerification: async () => {
    try {
      const response = await api.post('/api/auth/resend-verification');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete account
  deleteAccount: async (password) => {
    try {
      const response = await api.delete('/api/auth/account', { data: { password } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user statistics
  getUserStats: async () => {
    try {
      const response = await api.get('/api/users/stats/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    try {
      const response = await api.put('/api/users/preferences', preferences);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/api/auth/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Check if email exists
  checkEmailExists: async (email) => {
    try {
      const response = await api.post('/api/auth/check-email', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get OAuth providers
  getOAuthProviders: async () => {
    try {
      const response = await api.get('/api/auth/oauth/providers');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Link OAuth account
  linkOAuthAccount: async (provider, code) => {
    try {
      const response = await api.post('/api/auth/oauth/link', { provider, code });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Unlink OAuth account
  unlinkOAuthAccount: async (provider) => {
    try {
      const response = await api.delete(`/api/auth/oauth/unlink/${provider}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get login history
  getLoginHistory: async () => {
    try {
      const response = await api.get('/api/auth/login-history');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Enable two-factor authentication
  enable2FA: async () => {
    try {
      const response = await api.post('/api/auth/2fa/enable');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Disable two-factor authentication
  disable2FA: async (code) => {
    try {
      const response = await api.post('/api/auth/2fa/disable', { code });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify two-factor authentication
  verify2FA: async (code) => {
    try {
      const response = await api.post('/api/auth/2fa/verify', { code });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get backup codes
  getBackupCodes: async () => {
    try {
      const response = await api.get('/api/auth/2fa/backup-codes');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generate new backup codes
  generateBackupCodes: async () => {
    try {
      const response = await api.post('/api/auth/2fa/backup-codes');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Export the axios instance for other API calls
export { api };

// Export default for convenience
export default authAPI;