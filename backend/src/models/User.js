// [EDIT] - 2024-01-15 - Created User model - Ediens Team
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../database/connection');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true // Allow null for OAuth users
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      min: -90,
      max: 90
    }
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    validate: {
      min: -180,
      max: 180
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  postalCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isBusiness: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  businessType: {
    type: DataTypes.ENUM('restaurant', 'bakery', 'grocery', 'cafe', 'other'),
    allowNull: true
  },
  businessDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalRatings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ecoPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isPremium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  premiumExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastActive: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      radius: 10, // km
      categories: ['fresh', 'cooked', 'bakery', 'packaged']
    },
    get() {
      const value = this.getDataValue('preferences');
      if (!value) {
        return {
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          radius: 10,
          categories: ['fresh', 'cooked', 'bakery', 'packaged']
        };
      }
      return value;
    }
  }
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

User.prototype.isBusinessAccount = function() {
  return this.isBusiness;
};

User.prototype.hasActivePremium = function() {
  if (!this.isPremium || !this.premiumExpiresAt) return false;
  return new Date() < this.premiumExpiresAt;
};

module.exports = User;