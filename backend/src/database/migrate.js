// [EDIT] - 2024-01-15 - Created database migration script - Ediens Team
const { sequelize } = require('./connection');
const { User, FoodPost, Claim, Message } = require('../models');

async function migrate() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Check if tables exist and handle enum array issues
    try {
      // First try to sync with alter to preserve data
      await sequelize.sync({ alter: true });
      console.log('✅ Database tables created/updated successfully.');
    } catch (syncError) {
      console.warn('⚠️  Table sync warning:', syncError.message);
      
      // Check if it's the specific dietary_info enum array issue
      if (syncError.message.includes('dietary_info') && syncError.message.includes('enum')) {
        console.log('🔄 Detected dietary_info enum array compatibility issue...');
        console.log('   This is likely due to a schema mismatch between model and database.');
        
        try {
          // Try to drop and recreate the specific table
          console.log('🔄 Attempting to resolve by recreating food_posts table...');
          
          // Drop the problematic table if it exists
          await sequelize.query('DROP TABLE IF EXISTS food_posts CASCADE');
          console.log('✅ Dropped existing food_posts table.');
          
          // Recreate with correct schema
          await sequelize.sync({ alter: true });
          console.log('✅ Database tables recreated successfully (enum issue resolved).');
        } catch (recreateError) {
          console.error('❌ Table recreation failed:', recreateError.message);
          
          // Last resort: force recreate all tables
          console.log('🔄 Attempting force sync as last resort...');
          try {
            await sequelize.sync({ force: true });
            console.log('✅ Database tables force recreated successfully.');
          } catch (forceError) {
            console.error('❌ Force sync failed:', forceError.message);
            throw forceError;
          }
        }
      } else if (syncError.message.includes('enum') && syncError.message.includes('array')) {
        console.log('🔄 Attempting to resolve general enum array compatibility issue...');
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
    console.error('   Full error:', error);
    process.exit(1);
  }
}

// Run migration
migrate();