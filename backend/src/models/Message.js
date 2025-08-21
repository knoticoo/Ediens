// [EDIT] - 2024-01-15 - Created Message model - Ediens Team
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 1000]
    }
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'location', 'system'),
    defaultValue: 'text'
  },
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      min: -90,
      max: 90
    }
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      min: -180,
      max: 180
    }
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  originalContent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  replyToId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'messages',
  hooks: {
    beforeUpdate: (message) => {
      // Track content changes
      if (message.changed('content') && !message.isEdited) {
        message.originalContent = message._previousDataValues.content;
        message.isEdited = true;
        message.editedAt = new Date();
      }
      
      // Track read status
      if (message.changed('isRead') && message.isRead) {
        message.readAt = new Date();
      }
    },
    beforeDestroy: (message) => {
      // Soft delete instead of hard delete
      message.isDeleted = true;
      message.deletedAt = new Date();
      return false; // Prevent actual deletion
    }
  }
});

// Instance methods
Message.prototype.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

Message.prototype.edit = function(newContent) {
  if (this.isDeleted) {
    throw new Error('Cannot edit deleted message');
  }
  
  this.content = newContent;
  return this.save();
};

Message.prototype.delete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

Message.prototype.isVisible = function() {
  return !this.isDeleted;
};

Message.prototype.getDisplayContent = function() {
  if (this.isDeleted) {
    return '[Message deleted]';
  }
  
  if (this.isEdited) {
    return `${this.content} (edited)`;
  }
  
  return this.content;
};

module.exports = Message;