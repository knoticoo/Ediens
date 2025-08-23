// [EDIT] - 2024-01-15 - Created FoodPost model - Ediens Team
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const FoodPost = sequelize.define('FoodPost', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [10, 1000]
    }
  },
  category: {
    type: DataTypes.ENUM('fresh', 'cooked', 'bakery', 'packaged', 'frozen', 'dairy', 'other'),
    allowNull: false
  },
  subcategory: {
    type: DataTypes.STRING,
    allowNull: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  unit: {
    type: DataTypes.ENUM('piece', 'kg', 'g', 'liter', 'ml', 'portion', 'box', 'bag'),
    allowNull: false,
    defaultValue: 'piece'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  isFree: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  originalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  discountPercentage: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const value = this.getDataValue('images');
      return Array.isArray(value) ? value : [];
    },
    set(value) {
      this.setDataValue('images', Array.isArray(value) ? value : []);
    }
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
  pickupInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isExpired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  urgency: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  allergens: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const value = this.getDataValue('allergens');
      return Array.isArray(value) ? value : [];
    },
    set(value) {
      this.setDataValue('allergens', Array.isArray(value) ? value : []);
    },
    validate: {
      isValidAllergens: function(value) {
        const validAllergens = ['Gluten', 'Dairy', 'Eggs', 'Soy', 'Nuts', 'Peanuts', 'Fish', 'Shellfish'];
        if (value && Array.isArray(value)) {
          for (const allergen of value) {
            if (!validAllergens.includes(allergen)) {
              throw new Error(`Invalid allergen: ${allergen}`);
            }
          }
        }
      }
    }
  },
  dietaryInfo: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const value = this.getDataValue('dietaryInfo');
      return Array.isArray(value) ? value : [];
    },
    set(value) {
      this.setDataValue('dietaryInfo', Array.isArray(value) ? value : []);
    },
    validate: {
      isValidDietaryInfo: function(value) {
        const validDietaryInfo = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher'];
        if (value && Array.isArray(value)) {
          for (const diet of value) {
            if (!validDietaryInfo.includes(diet)) {
              throw new Error(`Invalid dietary info: ${diet}`);
            }
          }
        }
      }
    }
  },
  storageInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('available', 'reserved', 'claimed', 'expired', 'cancelled'),
    defaultValue: 'available'
  },
  maxReservations: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  currentReservations: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isBusinessPost: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  businessHours: {
    type: DataTypes.JSON,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const value = this.getDataValue('tags');
      return Array.isArray(value) ? value : [];
    },
    set(value) {
      this.setDataValue('tags', Array.isArray(value) ? value : []);
    }
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'food_posts',
  hooks: {
    beforeCreate: (post) => {
      // Set urgency based on expiry date
      const now = new Date();
      const expiry = new Date(post.expiryDate);
      const hoursUntilExpiry = (expiry - now) / (1000 * 60 * 60);
      
      if (hoursUntilExpiry <= 2) post.urgency = 'critical';
      else if (hoursUntilExpiry <= 24) post.urgency = 'high';
      else if (hoursUntilExpiry <= 72) post.urgency = 'medium';
      else post.urgency = 'low';
      
      // Set isFree based on price
      post.isFree = post.price === 0;
      
      // Calculate discount percentage if original price is provided
      if (post.originalPrice && post.originalPrice > post.price) {
        post.discountPercentage = Math.round(((post.originalPrice - post.price) / post.originalPrice) * 100);
      }
    },
    beforeUpdate: (post) => {
      // Update urgency and expiry status
      if (post.changed('expiryDate')) {
        const now = new Date();
        const expiry = new Date(post.expiryDate);
        const hoursUntilExpiry = (expiry - now) / (1000 * 60 * 60);
        
        if (hoursUntilExpiry <= 0) {
          post.urgency = 'critical';
          post.isExpired = true;
          post.status = 'expired';
        } else if (hoursUntilExpiry <= 2) post.urgency = 'critical';
        else if (hoursUntilExpiry <= 24) post.urgency = 'high';
        else if (hoursUntilExpiry <= 72) post.urgency = 'medium';
        else post.urgency = 'low';
      }
    }
  }
});

// Instance methods
FoodPost.prototype.isAvailable = function() {
  return this.status === 'available' && !this.isExpired;
};

FoodPost.prototype.canBeReserved = function() {
  if (!this.isAvailable()) return false;
  if (this.maxReservations && this.currentReservations >= this.maxReservations) return false;
  return true;
};

FoodPost.prototype.getTimeUntilExpiry = function() {
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  const diff = expiry - now;
  
  if (diff <= 0) return 'Expired';
  
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

FoodPost.prototype.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

module.exports = FoodPost;