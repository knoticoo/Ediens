// [EDIT] - 2024-01-15 - Created NotificationContext - Ediens Team
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// Action types
const NOTIFICATION_ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_ALL: 'CLEAR_ALL',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
};

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

// Reducer function
const notificationReducer = (state, action) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      const newNotification = {
        ...action.payload,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    
    case NOTIFICATION_ACTIONS.MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, isRead: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    
    case NOTIFICATION_ACTIONS.MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true,
        })),
        unreadCount: 0,
      };
    
    case NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION:
      const removedNotification = state.notifications.find(
        n => n.id === action.payload
      );
      return {
        ...state,
        notifications: state.notifications.filter(
          n => n.id !== action.payload
        ),
        unreadCount: removedNotification?.isRead ? state.unreadCount : Math.max(0, state.unreadCount - 1),
      };
    
    case NOTIFICATION_ACTIONS.CLEAR_ALL:
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };
    
    case NOTIFICATION_ACTIONS.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.isRead).length,
      };
    
    default:
      return state;
  }
};

// Create context
const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // Add notification helper
  const addNotification = (notification) => {
    dispatch({
      type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
      payload: notification,
    });

    // Show toast notification
    if (notification.type === 'success') {
      toast.success(notification.message);
    } else if (notification.type === 'error') {
      toast.error(notification.message);
    } else if (notification.type === 'warning') {
      toast(notification.message, { icon: '⚠️' });
    } else {
      toast(notification.message);
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    dispatch({
      type: NOTIFICATION_ACTIONS.MARK_AS_READ,
      payload: notificationId,
    });
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    dispatch({
      type: NOTIFICATION_ACTIONS.MARK_ALL_AS_READ,
    });
  };

  // Remove notification
  const removeNotification = (notificationId) => {
    dispatch({
      type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION,
      payload: notificationId,
    });
  };

  // Clear all notifications
  const clearAll = () => {
    dispatch({
      type: NOTIFICATION_ACTIONS.CLEAR_ALL,
    });
  };

  // Set notifications from API
  const setNotifications = (notifications) => {
    dispatch({
      type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS,
      payload: notifications,
    });
  };

  // Context value
  const value = {
    ...state,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    setNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification types
export const NOTIFICATION_TYPES = {
  FOOD_POSTED: 'food_posted',
  FOOD_CLAIMED: 'food_claimed',
  MESSAGE_RECEIVED: 'message_received',
  CLAIM_ACCEPTED: 'claim_accepted',
  CLAIM_REJECTED: 'claim_rejected',
  ECO_POINTS_EARNED: 'eco_points_earned',
  SYSTEM_UPDATE: 'system_update',
};

// Helper function to create notifications
export const createNotification = (type, data) => {
  const baseNotification = {
    type: 'info',
    message: '',
    icon: '🍽️',
    actionUrl: null,
  };

  switch (type) {
    case NOTIFICATION_TYPES.FOOD_POSTED:
      return {
        ...baseNotification,
        type: 'success',
        message: `New food post: ${data.title}`,
        icon: '🥘',
        actionUrl: `/post/${data.id}`,
      };
    
    case NOTIFICATION_TYPES.FOOD_CLAIMED:
      return {
        ...baseNotification,
        type: 'info',
        message: `Someone claimed your food: ${data.title}`,
        icon: '✅',
        actionUrl: `/messages/${data.userId}`,
      };
    
    case NOTIFICATION_TYPES.MESSAGE_RECEIVED:
      return {
        ...baseNotification,
        type: 'info',
        message: `New message from ${data.senderName}`,
        icon: '💬',
        actionUrl: `/messages/${data.senderId}`,
      };
    
    case NOTIFICATION_TYPES.CLAIM_ACCEPTED:
      return {
        ...baseNotification,
        type: 'success',
        message: `Your claim was accepted: ${data.title}`,
        icon: '🎉',
        actionUrl: `/messages/${data.userId}`,
      };
    
    case NOTIFICATION_TYPES.CLAIM_REJECTED:
      return {
        ...baseNotification,
        type: 'warning',
        message: `Your claim was rejected: ${data.title}`,
        icon: '❌',
        actionUrl: `/post/${data.id}`,
      };
    
    case NOTIFICATION_TYPES.ECO_POINTS_EARNED:
      return {
        ...baseNotification,
        type: 'success',
        message: `You earned ${data.points} eco points!`,
        icon: '🌱',
        actionUrl: `/profile`,
      };
    
    case NOTIFICATION_TYPES.SYSTEM_UPDATE:
      return {
        ...baseNotification,
        type: 'info',
        message: data.message,
        icon: '🔔',
        actionUrl: data.actionUrl,
      };
    
    default:
      return {
        ...baseNotification,
        message: data.message || 'New notification',
        icon: data.icon || '🔔',
        actionUrl: data.actionUrl,
      };
  }
};