// [EDIT] - 2024-01-15 - Created database migration script - Ediens Team
const { sequelize } = require('./connection');
const { User, FoodPost, Claim, Message } = require('../models');

async function migrate() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Sync all models (create tables)
    await sequelize.sync({ alter: true });
    console.log('✅ Database tables created/updated successfully.');
    
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migrate();