// [EDIT] - 2024-01-15 - Created food posts routes - Ediens Team
const express = require('express');
const { Op } = require('sequelize');
const { FoodPost, User, Claim } = require('../models');
const { authenticateToken, optionalAuth, requireBusiness, postRateLimit } = require('../middleware/auth');
const { validateFoodPost } = require('../middleware/validation');

const router = express.Router();

// Get all food posts with filtering and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      city,
      radius = 10, // km
      latitude,
      longitude,
      priceMin,
      priceMax,
      isFree,
      urgency,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { status: 'available' };

    // Category filter
    if (category) {
      whereClause.category = category;
    }

    // City filter
    if (city) {
      whereClause.city = { [Op.iLike]: `%${city}%` };
    }

    // Price filters
    if (priceMin !== undefined) {
      whereClause.price = { [Op.gte]: parseFloat(priceMin) };
    }
    if (priceMax !== undefined) {
      whereClause.price = { ...whereClause.price, [Op.lte]: parseFloat(priceMax) };
    }
    if (isFree !== undefined) {
      whereClause.isFree = isFree === 'true';
    }

    // Urgency filter
    if (urgency) {
      whereClause.urgency = urgency;
    }

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { tags: { [Op.overlap]: [search] } }
      ];
    }

    // Location-based filtering
    let locationFilter = null;
    if (latitude && longitude && radius) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const rad = parseFloat(radius);

      // Convert km to meters
      const radiusInMeters = rad * 1000;
      
      locationFilter = {
        [Op.and]: [
          {
            location: {
              [Op.dwithin]: {
                [Op.fn]: 'ST_MakePoint',
                [Op.col]: 'location',
                radiusInMeters
              }
            }
          }
        ]
      };
    }

    // Build query options
    const queryOptions = {
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'rating', 'isBusiness', 'businessName'],
          where: { isDeleted: false }
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    // Add location filter if coordinates provided
    if (locationFilter) {
      queryOptions.where = { ...whereClause, ...locationFilter };
    }

    // Get posts
    const { count, rows: posts } = await FoodPost.findAndCountAll(queryOptions);

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    // Add distance if coordinates provided
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      posts.forEach(post => {
        if (post.location) {
          const postLat = post.location.coordinates[1];
          const postLng = post.location.coordinates[0];
          post.distance = calculateDistance(lat, lng, postLat, postLng);
        }
      });

      // Sort by distance if location-based search
      if (sortBy === 'distance') {
        posts.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }
    }

    res.json({
      posts,
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
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get food post by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { includeUser = 'true', includeClaims = 'false' } = req.query;

    const includeOptions = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'avatar', 'rating', 'isBusiness', 'businessName', 'city'],
        where: { isDeleted: false }
      }
    ];

    if (includeClaims === 'true') {
      includeOptions.push({
        model: Claim,
        as: 'claims',
        attributes: ['id', 'status', 'quantity', 'pickupDate', 'claimerId'],
        include: [
          {
            model: User,
            as: 'claimer',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          }
        ]
      });
    }

    const post = await FoodPost.findByPk(id, {
      include: includeOptions
    });

    if (!post) {
      return res.status(404).json({ error: 'Food post not found' });
    }

    // Increment view count
    await post.incrementViewCount();

    // Add distance if user location provided
    if (req.user && req.user.location && post.location) {
      const userLat = req.user.location.coordinates[1];
      const userLng = req.user.location.coordinates[0];
      const postLat = post.location.coordinates[1];
      const postLng = post.location.coordinates[0];
      
      post.distance = calculateDistance(userLat, userLng, postLat, postLng);
    }

    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create new food post
router.post('/', authenticateToken, postRateLimit, validateFoodPost, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subcategory,
      quantity,
      unit,
      price,
      originalPrice,
      images,
      latitude,
      longitude,
      address,
      city,
      pickupInstructions,
      expiryDate,
      allergens,
      dietaryInfo,
      storageInstructions,
      maxReservations,
      tags
    } = req.body;

    // Create food post
    const foodPost = await FoodPost.create({
      userId: req.user.id,
      title,
      description,
      category,
      subcategory,
      quantity,
      unit,
      price,
      originalPrice,
      images: images || [],
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      address,
      city,
      pickupInstructions,
      expiryDate: new Date(expiryDate),
      allergens: allergens || [],
      dietaryInfo: dietaryInfo || [],
      storageInstructions,
      maxReservations,
      tags: tags || [],
      isBusinessPost: req.user.isBusiness
    });

    // Get post with user info
    const postWithUser = await FoodPost.findByPk(foodPost.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'isBusiness', 'businessName']
        }
      ]
    });

    res.status(201).json({
      message: 'Food post created successfully',
      post: postWithUser
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create food post' });
  }
});

// Update food post
router.put('/:id', authenticateToken, validateFoodPost, async (req, res) => {
  try {
    const { id } = req.params;
    const foodPost = await FoodPost.findByPk(id);

    if (!foodPost) {
      return res.status(404).json({ error: 'Food post not found' });
    }

    // Check ownership
    if (foodPost.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }

    // Check if post can be updated
    if (foodPost.status !== 'available') {
      return res.status(400).json({ error: 'Cannot update post that is not available' });
    }

    // Update fields
    const updateData = { ...req.body };
    
    // Handle location update
    if (req.body.latitude && req.body.longitude) {
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      };
    }

    // Handle expiry date
    if (req.body.expiryDate) {
      updateData.expiryDate = new Date(req.body.expiryDate);
    }

    await foodPost.update(updateData);

    // Get updated post with user info
    const updatedPost = await FoodPost.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'isBusiness', 'businessName']
        }
      ]
    });

    res.json({
      message: 'Food post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update food post' });
  }
});

// Delete food post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const foodPost = await FoodPost.findByPk(id);

    if (!foodPost) {
      return res.status(404).json({ error: 'Food post not found' });
    }

    // Check ownership
    if (foodPost.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    // Check if post can be deleted
    if (foodPost.status !== 'available') {
      return res.status(400).json({ error: 'Cannot delete post that is not available' });
    }

    // Soft delete
    await foodPost.update({ status: 'cancelled' });

    res.json({ message: 'Food post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete food post' });
  }
});

// Get user's food posts
router.get('/user/posts', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: posts } = await FoodPost.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Claim,
          as: 'claims',
          attributes: ['id', 'status', 'quantity', 'claimerId'],
          include: [
            {
              model: User,
              as: 'claimer',
              attributes: ['id', 'firstName', 'lastName', 'avatar']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      posts,
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

// Get nearby posts
router.get('/nearby', optionalAuth, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5, limit = 20 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseFloat(radius);

    const posts = await FoodPost.findAll({
      where: {
        status: 'available',
        location: {
          [Op.dwithin]: {
            [Op.fn]: 'ST_MakePoint',
            [Op.col]: 'location',
            rad * 1000 // Convert km to meters
          }
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'rating', 'isBusiness', 'businessName']
        }
      ],
      order: [
        [Op.literal(`ST_Distance(location, ST_MakePoint(${lng}, ${lat}))`), 'ASC']
      ],
      limit: parseInt(limit)
    });

    // Add distance to each post
    posts.forEach(post => {
      if (post.location) {
        const postLat = post.location.coordinates[1];
        const postLng = post.location.coordinates[0];
        post.distance = calculateDistance(lat, lng, postLat, postLng);
      }
    });

    res.json({ posts });
  } catch (error) {
    console.error('Get nearby posts error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby posts' });
  }
});

// Get trending posts
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const { limit = 10, days = 7 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const posts = await FoodPost.findAll({
      where: {
        status: 'available',
        createdAt: { [Op.gte]: daysAgo }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'rating', 'isBusiness', 'businessName']
        }
      ],
      order: [
        ['viewCount', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit)
    });

    res.json({ posts });
  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({ error: 'Failed to fetch trending posts' });
  }
});

// Helper function to calculate distance between two points
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