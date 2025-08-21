// [EDIT] - 2024-01-15 - Created users routes - Ediens Team
const express = require('express');
const { User, FoodPost, Claim } = require('../models');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get user profile by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { includePosts = 'false', includeStats = 'false' } = req.query;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user || user.isDeleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    const response = { user };

    // Include user's food posts if requested
    if (includePosts === 'true') {
      const posts = await FoodPost.findAll({
        where: { 
          userId: id, 
          status: 'available' 
        },
        attributes: ['id', 'title', 'description', 'images', 'category', 'price', 'isFree', 'urgency', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 10
      });
      response.posts = posts;
    }

    // Include user statistics if requested
    if (includeStats === 'true') {
      const stats = await Promise.all([
        FoodPost.count({ where: { userId: id } }),
        Claim.count({ where: { claimerId: id, status: 'picked_up' } }),
        Claim.sum('ecoPointsEarned', { where: { claimerId: id, status: 'picked_up' } })
      ]);

      response.stats = {
        totalPosts: stats[0],
        totalPickups: stats[1],
        totalEcoPoints: stats[2] || 0
      };
    }

    res.json(response);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Search users
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { query, page = 1, limit = 20, city, isBusiness } = req.query;
    const offset = (page - 1) * limit;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const whereClause = {
      isDeleted: false,
      [require('sequelize').Op.or]: [
        { firstName: { [require('sequelize').Op.iLike]: `%${query}%` } },
        { lastName: { [require('sequelize').Op.iLike]: `%${query}%` } },
        { businessName: { [require('sequelize').Op.iLike]: `%${query}%` } },
        { city: { [require('sequelize').Op.iLike]: `%${query}%` } }
      ]
    };

    if (city) {
      whereClause.city = { [require('sequelize').Op.iLike]: `%${city}%` };
    }

    if (isBusiness !== undefined) {
      whereClause.isBusiness = isBusiness === 'true';
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'firstName', 'lastName', 'avatar', 'city', 'isBusiness', 'businessName', 'rating', 'ecoPoints'],
      order: [['rating', 'DESC'], ['ecoPoints', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get nearby users
router.get('/nearby', authenticateToken, async (req, res) => {
  try {
    const { radius = 10, limit = 20 } = req.query;

    if (!req.user.location) {
      return res.status(400).json({ error: 'User location not set' });
    }

    const userLat = req.user.location.coordinates[1];
    const userLng = req.user.location.coordinates[0];
    const rad = parseFloat(radius);

    const users = await User.findAll({
      where: {
        id: { [require('sequelize').Op.ne]: req.user.id },
        isDeleted: false,
        location: {
          [require('sequelize').Op.dwithin]: {
            [require('sequelize').Op.fn]: 'ST_MakePoint',
            [require('sequelize').Op.col]: 'location',
            [require('sequelize').Op.literal]: `${rad * 1000}` // Convert km to meters
          }
        }
      },
      attributes: ['id', 'firstName', 'lastName', 'avatar', 'city', 'isBusiness', 'businessName', 'rating', 'ecoPoints'],
      order: [
        [require('sequelize').literal(`ST_Distance(location, ST_MakePoint(${userLng}, ${userLat}))`), 'ASC']
      ],
      limit: parseInt(limit)
    });

    // Add distance to each user
    users.forEach(user => {
      if (user.location) {
        const userLat2 = user.location.coordinates[1];
        const userLng2 = user.location.coordinates[0];
        user.distance = calculateDistance(userLat, userLng, userLat2, userLng2);
      }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get nearby users error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby users' });
  }
});

// Get user's food posts
router.get('/:id/posts', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    // Check if user exists
    const user = await User.findByPk(id, {
      attributes: ['id', 'firstName', 'lastName', 'isBusiness', 'businessName']
    });

    if (!user || user.isDeleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    const whereClause = { userId: id };
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: posts } = await FoodPost.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'title', 'description', 'images', 'category', 'price', 'isFree', 'urgency', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      posts,
      user,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

// Get user's claims
router.get('/:id/claims', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    // Users can only see their own claims
    if (id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view other user claims' });
    }

    const whereClause = { claimerId: id };
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: claims } = await Claim.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: FoodPost,
          as: 'foodPost',
          attributes: ['id', 'title', 'description', 'images', 'category', 'price', 'isFree', 'urgency', 'status']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      claims,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get user claims error:', error);
    res.status(500).json({ error: 'Failed to fetch user claims' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      city,
      address,
      avatar,
      preferences
    } = req.body;

    // Update user profile
    await req.user.update({
      firstName: firstName || req.user.firstName,
      lastName: lastName || req.user.lastName,
      phone: phone || req.user.phone,
      city: city || req.user.city,
      address: address || req.user.address,
      avatar: avatar || req.user.avatar,
      preferences: preferences || req.user.preferences
    });

    const userResponse = req.user.toJSON();
    delete userResponse.password;

    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update user location
router.put('/location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, address, city } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Update location
    await req.user.update({
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      address: address || req.user.address,
      city: city || req.user.city
    });

    res.json({
      message: 'Location updated successfully',
      location: req.user.location
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { notifications, radius, categories } = req.body;

    const currentPreferences = req.user.preferences || {};
    const updatedPreferences = {
      ...currentPreferences,
      notifications: notifications || currentPreferences.notifications,
      radius: radius || currentPreferences.radius,
      categories: categories || currentPreferences.categories
    };

    await req.user.update({ preferences: updatedPreferences });

    res.json({
      message: 'Preferences updated successfully',
      preferences: updatedPreferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get user statistics
router.get('/stats/me', authenticateToken, async (req, res) => {
  try {
    const stats = await Promise.all([
      // Total posts
      FoodPost.count({ where: { userId: req.user.id } }),
      
      // Available posts
      FoodPost.count({ where: { userId: req.user.id, status: 'available' } }),
      
      // Total claims made
      Claim.count({ where: { claimerId: req.user.id } }),
      
      // Successful pickups
      Claim.count({ where: { claimerId: req.user.id, status: 'picked_up' } }),
      
      // Total eco points
      Claim.sum('ecoPointsEarned', { where: { claimerId: req.user.id, status: 'picked_up' } }),
      
      // Claims received for user's posts
      Claim.count({
        include: [{
          model: FoodPost,
          as: 'foodPost',
          where: { userId: req.user.id }
        }]
      })
    ]);

    res.json({
      stats: {
        totalPosts: stats[0],
        availablePosts: stats[1],
        totalClaimsMade: stats[2],
        successfulPickups: stats[3],
        totalEcoPoints: stats[4] || 0,
        claimsReceived: stats[5]
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get leaderboard
router.get('/leaderboard', optionalAuth, async (req, res) => {
  try {
    const { type = 'ecoPoints', limit = 20, city } = req.query;

    const whereClause = { isDeleted: false };
    if (city) {
      whereClause.city = { [require('sequelize').Op.iLike]: `%${city}%` };
    }

    let orderBy;
    switch (type) {
      case 'ecoPoints':
        orderBy = [['ecoPoints', 'DESC']];
        break;
      case 'rating':
        orderBy = [['rating', 'DESC']];
        break;
      case 'posts':
        orderBy = [[require('sequelize').literal('(SELECT COUNT(*) FROM food_posts WHERE food_posts.user_id = users.id)'), 'DESC']];
        break;
      default:
        orderBy = [['ecoPoints', 'DESC']];
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: [
        'id', 'firstName', 'lastName', 'avatar', 'city', 'isBusiness', 'businessName',
        'rating', 'ecoPoints', 'totalRatings'
      ],
      order: orderBy,
      limit: parseInt(limit)
    });

    // Add post count for each user
    const usersWithPostCount = await Promise.all(
      users.map(async (user) => {
        const postCount = await FoodPost.count({ where: { userId: user.id } });
        return { ...user.toJSON(), postCount };
      })
    );

    res.json({ users: usersWithPostCount });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Follow/unfollow user (future feature)
router.post('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const userToFollow = await User.findByPk(id);
    if (!userToFollow || userToFollow.isDeleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    // This would be implemented with a junction table
    // For now, just return success
    res.json({ message: 'Follow functionality coming soon' });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = router;