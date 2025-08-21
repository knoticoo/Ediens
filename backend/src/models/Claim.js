// [EDIT] - 2024-01-15 - Created Claim model - Ediens Team
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Claim = sequelize.define('Claim', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'picked_up', 'cancelled', 'expired'),
    defaultValue: 'pending'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  pickupDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  pickupTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isUrgent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reminderSentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  review: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ecoPointsEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  pickupLatitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      min: -90,
      max: 90
    }
  },
  pickupLongitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      min: -180,
      max: 180
    }
  },
  pickupAddress: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  deliveryRequested: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deliveryFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  deliveryInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estimatedDeliveryTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actualDeliveryTime: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'claims',
  hooks: {
    beforeCreate: (claim) => {
      // Set eco points based on food value and urgency
      if (claim.quantity > 0) {
        claim.ecoPointsEarned = Math.floor(claim.quantity * 10); // Base 10 points per item
      }
    },
    beforeUpdate: (claim) => {
      // Update status based on pickup date
      if (claim.changed('pickupDate') && claim.pickupDate) {
        const now = new Date();
        const pickup = new Date(claim.pickupDate);
        
        if (pickup < now && claim.status === 'confirmed') {
          claim.status = 'expired';
        }
      }
      
      // Update rating timestamp
      if (claim.changed('rating') && claim.rating) {
        claim.reviewedAt = new Date();
      }
    }
  }
});

// Instance methods
Claim.prototype.isActive = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

Claim.prototype.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

Claim.prototype.isOverdue = function() {
  if (!this.pickupDate || this.status !== 'confirmed') return false;
  return new Date() > new Date(this.pickupDate);
};

Claim.prototype.getTimeUntilPickup = function() {
  if (!this.pickupDate) return null;
  
  const now = new Date();
  const pickup = new Date(this.pickupDate);
  const diff = pickup - now;
  
  if (diff <= 0) return 'Overdue';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

Claim.prototype.confirmPickup = function() {
  this.status = 'picked_up';
  this.pickupDate = new Date();
  return this.save();
};

Claim.prototype.cancel = function() {
  if (this.canBeCancelled()) {
    this.status = 'cancelled';
    return this.save();
  }
  throw new Error('Cannot cancel this claim');
};

module.exports = Claim;