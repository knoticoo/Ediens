// [EDIT] - 2024-01-15 - Created messages routes - Ediens Team
const express = require('express');
const { Message, User, FoodPost } = require('../models');
const { authenticateToken, messageRateLimit } = require('../middleware/auth');
const { validateMessage } = require('../middleware/validation');

const router = express.Router();

// Get conversation between two users
router.get('/conversation/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Check if other user exists
    const otherUser = await User.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'avatar', 'isBusiness', 'businessName']
    });

    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get messages between the two users
    const { count, rows: messages } = await Message.findAndCountAll({
      where: {
        [require('sequelize').Op.or]: [
          {
            senderId: req.user.id,
            receiverId: userId
          },
          {
            senderId: userId,
            receiverId: req.user.id
          }
        ],
        isDeleted: false
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Mark messages as read
    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          senderId: userId,
          receiverId: req.user.id,
          isRead: false
        }
      }
    );

    const totalPages = Math.ceil(count / limit);

    res.json({
      messages: messages.reverse(), // Show oldest first
      otherUser,
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
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Send a message
router.post('/', authenticateToken, messageRateLimit, validateMessage, async (req, res) => {
  try {
    const { receiverId, content, messageType, mediaUrl, replyToId } = req.body;

    // Check if receiver exists
    const receiver = await User.findByPk(receiverId, {
      attributes: ['id', 'firstName', 'lastName']
    });

    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Check if replying to a valid message
    if (replyToId) {
      const replyToMessage = await Message.findByPk(replyToId);
      if (!replyToMessage || replyToMessage.isDeleted) {
        return res.status(400).json({ error: 'Invalid reply message' });
      }
    }

    // Create message
    const message = await Message.create({
      senderId: req.user.id,
      receiverId,
      content,
      messageType: messageType || 'text',
      mediaUrl,
      replyToId
    });

    // Get message with sender info
    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }
      ]
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: messageWithSender
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get user's conversations list
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get unique conversation partners
    const conversations = await Message.findAll({
      attributes: [
        'senderId',
        'receiverId',
        [require('sequelize').fn('MAX', require('sequelize').col('createdAt')), 'lastMessageAt'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'messageCount']
      ],
      where: {
        [require('sequelize').Op.or]: [
          { senderId: req.user.id },
          { receiverId: req.user.id }
        ],
        isDeleted: false
      },
      group: [
        require('sequelize').fn('LEAST', require('sequelize').col('senderId'), require('sequelize').col('receiverId')),
        require('sequelize').fn('GREATEST', require('sequelize').col('senderId'), require('sequelize').col('receiverId'))
      ],
      order: [[require('sequelize').col('lastMessageAt'), 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get conversation details
    const conversationDetails = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.senderId === req.user.id ? conv.receiverId : conv.senderId;
        
        // Get other user info
        const otherUser = await User.findByPk(otherUserId, {
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'isBusiness', 'businessName']
        });

        // Get last message
        const lastMessage = await Message.findOne({
          where: {
            [require('sequelize').Op.or]: [
              {
                senderId: req.user.id,
                receiverId: otherUserId
              },
              {
                senderId: otherUserId,
                receiverId: req.user.id
              }
            ],
            isDeleted: false
          },
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'content', 'messageType', 'createdAt', 'isRead']
        });

        // Get unread count
        const unreadCount = await Message.count({
          where: {
            senderId: otherUserId,
            receiverId: req.user.id,
            isRead: false,
            isDeleted: false
          }
        });

        return {
          otherUser,
          lastMessage,
          unreadCount,
          messageCount: parseInt(conv.dataValues.messageCount),
          lastMessageAt: conv.dataValues.lastMessageAt
        };
      })
    );

    res.json({
      conversations: conversationDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(conversations.length / limit),
        totalItems: conversations.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get unread message count
router.get('/unread/count', authenticateToken, async (req, res) => {
  try {
    const unreadCount = await Message.count({
      where: {
        receiverId: req.user.id,
        isRead: false,
        isDeleted: false
      }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark conversation as read
router.put('/conversation/:userId/read', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          senderId: userId,
          receiverId: req.user.id,
          isRead: false
        }
      }
    );

    res.json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error('Mark conversation read error:', error);
    res.status(500).json({ error: 'Failed to mark conversation as read' });
  }
});

// Edit message
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const message = await Message.findByPk(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender
    if (message.senderId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this message' });
    }

    // Check if message can be edited (not deleted, not too old)
    if (message.isDeleted) {
      return res.status(400).json({ error: 'Cannot edit deleted message' });
    }

    const messageAge = Date.now() - message.createdAt.getTime();
    if (messageAge > 5 * 60 * 1000) { // 5 minutes
      return res.status(400).json({ error: 'Message is too old to edit' });
    }

    // Edit message
    await message.edit(content);

    res.json({
      message: 'Message edited successfully',
      data: message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// Delete message
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findByPk(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender
    if (message.senderId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    // Soft delete message
    await message.delete();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Get messages related to a food post
router.get('/food-post/:foodPostId', authenticateToken, async (req, res) => {
  try {
    const { foodPostId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Check if user has access to this food post
    const foodPost = await FoodPost.findByPk(foodPostId);
    if (!foodPost) {
      return res.status(404).json({ error: 'Food post not found' });
    }

    // User can only see messages if they own the post or have a claim on it
    const hasAccess = foodPost.userId === req.user.id || 
      await Claim.findOne({
        where: {
          foodPostId,
          claimerId: req.user.id
        }
      });

    if (!hasAccess) {
      return res.status(403).json({ error: 'Not authorized to view messages for this food post' });
    }

    // Get messages related to this food post
    const { count, rows: messages } = await Message.findAndCountAll({
      where: {
        [require('sequelize').Op.or]: [
          { senderId: req.user.id },
          { receiverId: req.user.id }
        ],
        isDeleted: false,
        metadata: {
          foodPostId: foodPostId
        }
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }
      ],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      messages,
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
    console.error('Get food post messages error:', error);
    res.status(500).json({ error: 'Failed to fetch food post messages' });
  }
});

// Search messages
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const { count, rows: messages } = await Message.findAndCountAll({
      where: {
        [require('sequelize').Op.or]: [
          { senderId: req.user.id },
          { receiverId: req.user.id }
        ],
        content: { [require('sequelize').Op.iLike]: `%${query}%` },
        isDeleted: false
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      messages,
      query,
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
    console.error('Search messages error:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

module.exports = router;