// [EDIT] - 2024-01-15 - Database reset script to fix schema issues - Ediens Team
const { sequelize } = require('./connection');

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Drop all tables and recreate them
    console.log('🗑️  Dropping all existing tables...');
    await sequelize.drop();
    console.log('✅ All tables dropped successfully.');
    
    // Sync all models (create tables with correct schema)
    console.log('🔄 Creating tables with correct schema...');
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created successfully with correct schema.');
    
    console.log('🎉 Database reset completed successfully!');
    console.log('   All schema issues should now be resolved.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    console.error('   Full error:', error);
    process.exit(1);
  }
}

// Run reset
resetDatabase();