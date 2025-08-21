// [EDIT] - 2024-01-15 - Created NotificationDemo component for testing - Ediens Team
import React from 'react';
import { useNotifications, createNotification, NOTIFICATION_TYPES } from '@store/NotificationContext';

const NotificationDemo = () => {
  const { addNotification } = useNotifications();

  const handleTestNotification = (type) => {
    switch (type) {
      case 'food_posted':
        addNotification(createNotification(NOTIFICATION_TYPES.FOOD_POSTED, {
          id: 'demo-1',
          title: 'Fresh Homemade Bread'
        }));
        break;
      
      case 'food_claimed':
        addNotification(createNotification(NOTIFICATION_TYPES.FOOD_CLAIMED, {
          id: 'demo-2',
          title: 'Organic Vegetables',
          userId: 'user-123'
        }));
        break;
      
      case 'message_received':
        addNotification(createNotification(NOTIFICATION_TYPES.MESSAGE_RECEIVED, {
          senderId: 'user-456',
          senderName: 'Anna K.'
        }));
        break;
      
      case 'claim_accepted':
        addNotification(createNotification(NOTIFICATION_TYPES.CLAIM_ACCEPTED, {
          title: 'Fresh Fruits',
          userId: 'user-789'
        }));
        break;
      
      case 'claim_rejected':
        addNotification(createNotification(NOTIFICATION_TYPES.CLAIM_REJECTED, {
          id: 'demo-5',
          title: 'Homemade Cookies'
        }));
        break;
      
      case 'eco_points':
        addNotification(createNotification(NOTIFICATION_TYPES.ECO_POINTS_EARNED, {
          points: 25
        }));
        break;
      
      case 'system':
        addNotification(createNotification(NOTIFICATION_TYPES.SYSTEM_UPDATE, {
          message: 'New features available! Check out our updated map.',
          actionUrl: '/map'
        }));
        break;
      
      default:
        addNotification({
          type: 'info',
          message: 'This is a custom notification',
          icon: '🔔',
          actionUrl: '/dashboard'
        });
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Notification System Demo
      </h2>
      
      <p className="text-gray-600 mb-6">
        Click the buttons below to test different types of notifications. 
        Check the notification bell in the header to see them appear.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <button
          onClick={() => handleTestNotification('food_posted')}
          className="p-3 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
        >
          🥘 Food Posted
        </button>
        
        <button
          onClick={() => handleTestNotification('food_claimed')}
          className="p-3 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
        >
          ✅ Food Claimed
        </button>
        
        <button
          onClick={() => handleTestNotification('message_received')}
          className="p-3 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
        >
          💬 New Message
        </button>
        
        <button
          onClick={() => handleTestNotification('claim_accepted')}
          className="p-3 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium"
        >
          🎉 Claim Accepted
        </button>
        
        <button
          onClick={() => handleTestNotification('claim_rejected')}
          className="p-3 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
        >
          ❌ Claim Rejected
        </button>
        
        <button
          onClick={() => handleTestNotification('eco_points')}
          className="p-3 bg-teal-100 text-teal-800 rounded-lg hover:bg-teal-200 transition-colors text-sm font-medium"
        >
          🌱 Eco Points
        </button>
        
        <button
          onClick={() => handleTestNotification('system')}
          className="p-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          🔔 System Update
        </button>
        
        <button
          onClick={() => handleTestNotification('custom')}
          className="p-3 bg-indigo-100 text-indigo-800 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
        >
          ⭐ Custom
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">How to test:</h3>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Click any notification button above</li>
          <li>2. Look for the toast notification that appears</li>
          <li>3. Click the notification bell in the header</li>
          <li>4. See the notification in the dropdown</li>
          <li>5. Try marking as read, removing, etc.</li>
        </ol>
      </div>
    </div>
  );
};

export default NotificationDemo;