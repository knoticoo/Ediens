// [EDIT] - 2024-01-15 - Updated server.js with complete routes and middleware - Ediens Team
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Import middleware
const { 
  corsOptions, 
  securityMiddleware, 
  errorHandler, 
  notFound,
  authRateLimit,
  postRateLimit,
  messageRateLimit
} = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const claimsRoutes = require('./routes/claims');
const messagesRoutes = require('./routes/messages');
const usersRoutes = require('./routes/users');

// Import database connection
const sequelize = require('./database/connection');

// Import models for synchronization
const { User, FoodPost, Claim, Message } = require('./models');

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Environment variables
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(securityMiddleware);

// CORS middleware
app.use(cors(corsOptions));

// Rate limiting
app.use('/api/auth', authRateLimit);
app.use('/api/posts', postRateLimit);
app.use('/api/messages', messageRateLimit);

// General rate limiting for all routes
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', generalRateLimit);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/users', usersRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Ediens Food Sharing API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    documentation: '/api/docs'
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join food post room
  socket.on('join_post_room', (postId) => {
    socket.join(`post_${postId}`);
    console.log(`User joined post room: ${postId}`);
  });

  // Handle new food post
  socket.on('new_food_post', (data) => {
    const { postId, userId, location } = data;
    
    // Notify users in the area about new post
    socket.to(`location_${location.city}`).emit('food_post_created', {
      postId,
      userId,
      message: 'New food available in your area!'
    });
  });

  // Handle food post updates
  socket.on('food_post_updated', (data) => {
    const { postId, status, userId } = data;
    
    // Notify users following this post
    socket.to(`post_${postId}`).emit('food_post_updated', {
      postId,
      status,
      userId
    });
  });

  // Handle new claim
  socket.on('new_claim', (data) => {
    const { claimId, postId, claimerId, postOwnerId } = data;
    
    // Notify post owner about new claim
    socket.to(`user_${postOwnerId}`).emit('new_claim_received', {
      claimId,
      postId,
      claimerId
    });
  });

  // Handle claim status updates
  socket.on('claim_status_updated', (data) => {
    const { claimId, status, postId, claimerId, postOwnerId } = data;
    
    // Notify relevant users about claim status change
    socket.to(`user_${claimerId}`).emit('claim_status_changed', {
      claimId,
      status,
      postId
    });
    
    if (postOwnerId !== claimerId) {
      socket.to(`user_${postOwnerId}`).emit('claim_status_changed', {
        claimId,
        status,
        postId
      });
    }
  });

  // Handle new message
  socket.on('send_message', (data) => {
    const { messageId, senderId, receiverId, content, postId } = data;
    
    // Send message to receiver
    socket.to(`user_${receiverId}`).emit('new_message', {
      messageId,
      senderId,
      content,
      postId,
      timestamp: new Date().toISOString()
    });
    
    // If message is related to a food post, notify post owner
    if (postId) {
      socket.to(`post_${postId}`).emit('post_message', {
        messageId,
        senderId,
        content,
        postId,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle user location updates
  socket.on('user_location_updated', (data) => {
    const { userId, location, city } = data;
    
    // Join user to city-specific room for location-based notifications
    socket.leaveAll();
    socket.join(`user_${userId}`);
    socket.join(`location_${city}`);
    
    console.log(`User ${userId} location updated to ${city}`);
  });

  // Handle user status changes
  socket.on('user_status_change', (data) => {
    const { userId, status, isOnline } = data;
    
    // Broadcast user status to relevant users
    socket.broadcast.emit('user_status_updated', {
      userId,
      status,
      isOnline,
      timestamp: new Date().toISOString()
    });
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { senderId, receiverId } = data;
    socket.to(`user_${receiverId}`).emit('user_typing', {
      userId: senderId,
      isTyping: true
    });
  });

  socket.on('typing_stop', (data) => {
    const { senderId, receiverId } = data;
    socket.to(`user_${receiverId}`).emit('user_typing', {
      userId: senderId,
      isTyping: false
    });
  });

  // Handle read receipts
  socket.on('mark_read', (data) => {
    const { messageId, senderId, receiverId } = data;
    socket.to(`user_${senderId}`).emit('message_read', {
      messageId,
      readBy: receiverId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Emit user offline status
    socket.broadcast.emit('user_offline', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use(notFound);

// Database connection and server startup
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database models
    if (NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized.');
    } else {
      await sequelize.sync();
      console.log('✅ Database models synchronized (production mode).');
    }

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Ediens Food Sharing API server running on port ${PORT}`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      
      if (NODE_ENV === 'development') {
        console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
        console.log(`🗄️  Database: ${process.env.DB_NAME || 'ediens_dev'}`);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  try {
    await sequelize.close();
    console.log('✅ Database connection closed.');
    
    server.close(() => {
      console.log('✅ HTTP server closed.');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  
  try {
    await sequelize.close();
    console.log('✅ Database connection closed.');
    
    server.close(() => {
      console.log('✅ HTTP server closed.');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer();

module.exports = { app, server, io };