// [EDIT] - 2024-01-15 - Created database seed script - Ediens Team
const { sequelize } = require('./connection');
const { User, FoodPost, Claim, Message } = require('../models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Clear existing data
    await Message.destroy({ where: {} });
    await Claim.destroy({ where: {} });
    await FoodPost.destroy({ where: {} });
    await User.destroy({ where: {} });
    console.log('🧹 Cleared existing data.');
    
    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = await User.bulkCreate([
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY',
        city: 'New York',
        bio: 'Food lover and community helper',
        isVerified: true,
        profileImage: null
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567891',
        latitude: 34.0522,
        longitude: -118.2437,
        address: 'Los Angeles, CA',
        city: 'Los Angeles',
        bio: 'Passionate about reducing food waste',
        isVerified: true,
        profileImage: null
      },
      {
        username: 'mike_wilson',
        email: 'mike@example.com',
        password: hashedPassword,
        firstName: 'Mike',
        lastName: 'Wilson',
        phone: '+1234567892',
        latitude: 41.8781,
        longitude: -87.6298,
        address: 'Chicago, IL',
        city: 'Chicago',
        bio: 'Local food bank volunteer',
        isVerified: false,
        profileImage: null
      }
    ]);
    console.log('👥 Created sample users.');
    
    // Create sample food posts
    const foodPosts = [];
    
    const post1 = await FoodPost.create({
      userId: users[0].id,
      title: 'Fresh Bread from Local Bakery',
      description: 'Got some extra bread from the local bakery. Still fresh and delicious!',
      category: 'bakery',
      quantity: 5,
      unit: 'piece',
      price: 0.00,
      latitude: 40.7128,
      longitude: -74.0060,
      address: 'New York, NY',
      city: 'New York',
      pickupInstructions: 'Available for pickup at Central Park entrance',
      expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    });
    foodPosts.push(post1);
    
    const post2 = await FoodPost.create({
      userId: users[1].id,
      title: 'Organic Vegetables from Garden',
      description: 'Fresh organic vegetables from my home garden. Tomatoes, cucumbers, and herbs.',
      category: 'fresh',
      quantity: 2,
      unit: 'kg',
      price: 0.00,
      latitude: 34.0522,
      longitude: -118.2437,
      address: 'Los Angeles, CA',
      city: 'Los Angeles',
      pickupInstructions: 'Garden pickup available in the evening',
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
    });
    foodPosts.push(post2);
    
    const post3 = await FoodPost.create({
      userId: users[2].id,
      title: 'Canned Goods Donation',
      description: 'Various canned goods including beans, vegetables, and soups.',
      category: 'packaged',
      quantity: 10,
      unit: 'piece',
      price: 0.00,
      latitude: 41.8781,
      longitude: -87.6298,
      address: 'Chicago, IL',
      city: 'Chicago',
      pickupInstructions: 'Available at community center during business hours',
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    });
    foodPosts.push(post3);
    
    console.log('🍽️ Created sample food posts.');
    
    // Create sample claims
    const claims = [];
    
    const claim1 = await Claim.create({
      foodPostId: foodPosts[0].id,
      claimerId: users[1].id,
      status: 'pending',
      message: 'I would love to pick up the bread for my family. Is it still available?',
      pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      isCompleted: false
    });
    claims.push(claim1);
    
    const claim2 = await Claim.create({
      foodPostId: foodPosts[1].id,
      claimerId: users[0].id,
      status: 'confirmed',
      message: 'Perfect timing! I\'ll pick up the vegetables tomorrow evening.',
      pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      isCompleted: false
    });
    claims.push(claim2);
    
    console.log('📝 Created sample claims.');
    
    // Create sample messages
    const messages = [];
    
    const message1 = await Message.create({
      senderId: users[1].id,
      receiverId: users[0].id,
      foodPostId: foodPosts[0].id,
      content: 'Hi! I\'m interested in the bread. Is it still available?',
      isRead: false,
      replyToId: null
    });
    messages.push(message1);
    
    const message2 = await Message.create({
      senderId: users[0].id,
      receiverId: users[1].id,
      foodPostId: foodPosts[0].id,
      content: 'Yes, it\'s still available! When would you like to pick it up?',
      isRead: false,
      replyToId: message1.id
    });
    messages.push(message2);
    
    console.log('💬 Created sample messages.');
    
    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Created ${users.length} users, ${foodPosts.length} food posts, ${claims.length} claims, and ${messages.length} messages.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run seeding
seed();