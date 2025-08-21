// [EDIT] - 2024-01-15 - Created claims routes - Ediens Team
const express = require('express');
const { FoodPost, User, Claim } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { validateClaim } = require('../middleware/validation');

const router = express.Router();

// Create a new claim
router.post('/', authenticateToken, validateClaim, async (req, res) => {
  try {
    const { foodPostId, quantity, pickupDate, message, isUrgent } = req.body;

    // Check if food post exists and is available
    const foodPost = await FoodPost.findByPk(foodPostId);
    if (!foodPost) {
      return res.status(404).json({ error: 'Food post not found' });
    }

    if (!foodPost.isAvailable()) {
      return res.status(400).json({ error: 'Food post is not available for claiming' });
    }

    // Check if user is trying to claim their own post
    if (foodPost.userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot claim your own food post' });
    }

    // Check if user has already claimed this post
    const existingClaim = await Claim.findOne({
      where: {
        claimerId: req.user.id,
        foodPostId,
        status: { [require('sequelize').Op.in]: ['pending', 'confirmed'] }
      }
    });

    if (existingClaim) {
      return res.status(400).json({ error: 'You have already claimed this food post' });
    }

    // Check quantity availability
    if (quantity > foodPost.quantity) {
      return res.status(400).json({ error: 'Requested quantity exceeds available quantity' });
    }

    // Check max reservations if set
    if (foodPost.maxReservations && foodPost.currentReservations >= foodPost.maxReservations) {
      return res.status(400).json({ error: 'Maximum reservations reached for this food post' });
    }

    // Create claim
    const claim = await Claim.create({
      claimerId: req.user.id,
      foodPostId,
      quantity,
      pickupDate: new Date(pickupDate),
      message,
      isUrgent: isUrgent || false
    });

    // Update food post current reservations
    await foodPost.increment('currentReservations');

    // Get claim with related data
    const claimWithDetails = await Claim.findByPk(claim.id, {
      include: [
        {
          model: FoodPost,
          as: 'foodPost',
          attributes: ['id', 'title', 'description', 'images', 'location', 'address', 'city', 'pickupInstructions']
        },
        {
          model: User,
          as: 'claimer',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'phone']
        }
      ]
    });

    res.status(201).json({
      message: 'Food claim created successfully',
      claim: claimWithDetails
    });
  } catch (error) {
    console.error('Create claim error:', error);
    res.status(500).json({ error: 'Failed to create claim' });
  }
});

// Get user's claims
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { claimerId: req.user.id };
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: claims } = await Claim.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: FoodPost,
          as: 'foodPost',
          attributes: ['id', 'title', 'description', 'images', 'location', 'address', 'city', 'pickupInstructions', 'expiryDate', 'urgency']
        },
        {
          model: User,
          as: 'claimer',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'phone']
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

// Get claims for a specific food post (for post owner)
router.get('/post/:foodPostId', authenticateToken, async (req, res) => {
  try {
    const { foodPostId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    // Check if user owns the food post
    const foodPost = await FoodPost.findByPk(foodPostId);
    if (!foodPost) {
      return res.status(404).json({ error: 'Food post not found' });
    }

    if (foodPost.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view claims for this post' });
    }

    const whereClause = { foodPostId };
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: claims } = await Claim.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'claimer',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'phone', 'rating']
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
    console.error('Get post claims error:', error);
    res.status(500).json({ error: 'Failed to fetch post claims' });
  }
});

// Get specific claim
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const claim = await Claim.findByPk(id, {
      include: [
        {
          model: FoodPost,
          as: 'foodPost',
          attributes: ['id', 'title', 'description', 'images', 'location', 'address', 'city', 'pickupInstructions', 'expiryDate', 'urgency', 'userId']
        },
        {
          model: User,
          as: 'claimer',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'phone', 'rating']
        }
      ]
    });

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    // Check if user is authorized to view this claim
    if (claim.claimerId !== req.user.id && claim.foodPost.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this claim' });
    }

    res.json({ claim });
  } catch (error) {
    console.error('Get claim error:', error);
    res.status(500).json({ error: 'Failed to fetch claim' });
  }
});

// Update claim status (for food post owner)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;

    const claim = await Claim.findByPk(id, {
      include: [
        {
          model: FoodPost,
          as: 'foodPost',
          attributes: ['id', 'title', 'userId']
        }
      ]
    });

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    // Check if user owns the food post
    if (claim.foodPost.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this claim' });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['picked_up', 'cancelled'],
      picked_up: [],
      cancelled: [],
      expired: []
    };

    if (!validTransitions[claim.status].includes(status)) {
      return res.status(400).json({ 
        error: `Cannot change status from ${claim.status} to ${status}` 
      });
    }

    // Update claim status
    await claim.update({ status });

    // If claim is cancelled, decrement current reservations
    if (status === 'cancelled' && claim.status === 'pending') {
      await claim.foodPost.decrement('currentReservations');
    }

    // If claim is confirmed, update food post status if needed
    if (status === 'confirmed') {
      const activeClaims = await Claim.count({
        where: {
          foodPostId: claim.foodPostId,
          status: { [require('sequelize').Op.in]: ['pending', 'confirmed'] }
        }
      });

      if (activeClaims >= claim.foodPost.maxReservations) {
        await claim.foodPost.update({ status: 'reserved' });
      }
    }

    // Get updated claim
    const updatedClaim = await Claim.findByPk(id, {
      include: [
        {
          model: FoodPost,
          as: 'foodPost',
          attributes: ['id', 'title', 'status']
        },
        {
          model: User,
          as: 'claimer',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }
      ]
    });

    res.json({
      message: 'Claim status updated successfully',
      claim: updatedClaim
    });
  } catch (error) {
    console.error('Update claim status error:', error);
    res.status(500).json({ error: 'Failed to update claim status' });
  }
});

// Cancel claim (for claimer)
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const claim = await Claim.findByPk(id, {
      include: [
        {
          model: FoodPost,
          as: 'foodPost',
          attributes: ['id', 'title', 'userId']
        }
      ]
    });

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    // Check if user is the claimer
    if (claim.claimerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to cancel this claim' });
    }

    // Check if claim can be cancelled
    if (!claim.canBeCancelled()) {
      return res.status(400).json({ error: 'Cannot cancel this claim' });
    }

    // Cancel claim
    await claim.cancel();

    // Decrement current reservations
    await claim.foodPost.decrement('currentReservations');

    res.json({
      message: 'Claim cancelled successfully',
      claim
    });
  } catch (error) {
    console.error('Cancel claim error:', error);
    res.status(500).json({ error: 'Failed to cancel claim' });
  }
});

// Confirm pickup (for claimer)
router.put('/:id/pickup', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const claim = await Claim.findByPk(id, {
      include: [
        {
          model: FoodPost,
          as: 'foodPost',
          attributes: ['id', 'title', 'userId']
        }
      ]
    });

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    // Check if user is the claimer
    if (claim.claimerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to confirm pickup for this claim' });
    }

    // Check if claim is confirmed
    if (claim.status !== 'confirmed') {
      return res.status(400).json({ error: 'Claim must be confirmed before pickup' });
    }

    // Confirm pickup
    await claim.confirmPickup();

    // Award eco points
    const ecoPoints = Math.floor(claim.quantity * 10);
    await req.user.increment('ecoPoints', { by: ecoPoints });

    res.json({
      message: 'Pickup confirmed successfully',
      claim,
      ecoPointsEarned: ecoPoints
    });
  } catch (error) {
    console.error('Confirm pickup error:', error);
    res.status(500).json({ error: 'Failed to confirm pickup' });
  }
});

// Rate food post after pickup
router.post('/:id/rate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const claim = await Claim.findByPk(id, {
      include: [
        {
          model: FoodPost,
          as: 'foodPost',
          attributes: ['id', 'title', 'userId']
        }
      ]
    });

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    // Check if user is the claimer
    if (claim.claimerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to rate this claim' });
    }

    // Check if claim is picked up
    if (claim.status !== 'picked_up') {
      return res.status(400).json({ error: 'Can only rate after pickup' });
    }

    // Check if already rated
    if (claim.rating) {
      return res.status(400).json({ error: 'Already rated this claim' });
    }

    // Update claim with rating
    await claim.update({ rating, review });

    // Update food post owner's rating
    const foodPostOwner = await User.findByPk(claim.foodPost.userId);
    if (foodPostOwner) {
      const totalRatings = foodPostOwner.totalRatings + 1;
      const newRating = ((foodPostOwner.rating * foodPostOwner.totalRatings) + rating) / totalRatings;
      
      await foodPostOwner.update({
        rating: Math.round(newRating * 100) / 100,
        totalRatings
      });
    }

    res.json({
      message: 'Rating submitted successfully',
      claim
    });
  } catch (error) {
    console.error('Rate claim error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// Get claim statistics
router.get('/stats/user', authenticateToken, async (req, res) => {
  try {
    const stats = await Claim.findAll({
      where: { claimerId: req.user.id },
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['status']
    });

    const totalClaims = await Claim.count({
      where: { claimerId: req.user.id }
    });

    const totalEcoPoints = await Claim.sum('ecoPointsEarned', {
      where: { 
        claimerId: req.user.id,
        status: 'picked_up'
      }
    });

    res.json({
      stats: stats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.dataValues.count);
        return acc;
      }, {}),
      totalClaims,
      totalEcoPoints: totalEcoPoints || 0
    });
  } catch (error) {
    console.error('Get claim stats error:', error);
    res.status(500).json({ error: 'Failed to fetch claim statistics' });
  }
});

module.exports = router;