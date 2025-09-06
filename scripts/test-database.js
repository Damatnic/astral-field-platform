#!/usr/bin/env node

// Test script for Neon database connectivity and migration system
// Run with: node scripts/test-database.js

const { Pool } = require('pg');

async function testDatabaseConnection() {
  console.log('🔍 Testing Neon Database Connection...\n');

  // Check environment variables
  const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL or NEON_DATABASE_URL environment variable not found');
    console.log('Please set your Neon connection string in .env.local');
    process.exit(1);
  }

  console.log('✅ Database URL found in environment');

  // Create connection pool
  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('🔌 Attempting to connect to Neon database...');
    
    // Test basic connectivity
    const client = await pool.connect();
    console.log('✅ Successfully connected to database');

    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log(`✅ Query successful - Current time: ${result.rows[0].current_time}`);
    console.log(`✅ Database version: ${result.rows[0].db_version.split(' ')[0]}`);

    // Test migrations table creation
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Migrations table ready');

    // Test a simple table creation and cleanup
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        test_data VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query(`
      INSERT INTO test_table (test_data) VALUES ('connection_test');
    `);
    
    const testResult = await client.query('SELECT COUNT(*) as count FROM test_table WHERE test_data = $1', ['connection_test']);
    console.log(`✅ Test table operations successful - Found ${testResult.rows[0].count} test record(s)`);
    
    // Cleanup test data
    await client.query(`DELETE FROM test_table WHERE test_data = 'connection_test'`);
    await client.query(`DROP TABLE IF EXISTS test_table`);
    console.log('✅ Test cleanup completed');

    client.release();
    
    // Get pool statistics
    console.log(`\n📊 Connection Pool Stats:`);
    console.log(`   Total connections: ${pool.totalCount}`);
    console.log(`   Idle connections: ${pool.idleCount}`);
    console.log(`   Waiting clients: ${pool.waitingCount}`);

    console.log('\n🎉 All database tests passed successfully!');
    console.log('Your Neon PostgreSQL database is ready for production.');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Please check your Neon connection string and database permissions.');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabaseConnection().catch(console.error);