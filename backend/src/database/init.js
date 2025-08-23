// Database initialization script for SQLite
const { sequelize } = require('./connection');
const path = require('path');
const fs = require('fs');

// Import all models to ensure they're registered
const User = require('../models/User');
const FoodPost = require('../models/FoodPost');
const Claim = require('../models/Claim');
const Message = require('../models/Message');

const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing SQLite database...');
    
    // Create database directory if it doesn't exist
    const dbDir = path.dirname(sequelize.options.storage);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`📁 Created database directory: ${dbDir}`);
    }
    
    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync all models (create tables)
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database tables synchronized successfully.');
    
    console.log('🎉 Database initialization complete!');
    console.log(`📍 Database location: ${sequelize.options.storage}`);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };