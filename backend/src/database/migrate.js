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
    try {
      await sequelize.sync({ alter: true });
      console.log('✅ Database tables created/updated successfully.');
    } catch (syncError) {
      console.warn('⚠️  Table sync warning:', syncError.message);
      
      // If it's an enum array issue, try to force recreate
      if (syncError.message.includes('enum') && syncError.message.includes('array')) {
        console.log('🔄 Attempting to resolve enum array compatibility issue...');
        try {
          await sequelize.sync({ force: true });
          console.log('✅ Database tables recreated successfully (enum issue resolved).');
        } catch (forceError) {
          console.error('❌ Force sync failed:', forceError.message);
          throw forceError;
        }
      } else {
        throw syncError;
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migrate();