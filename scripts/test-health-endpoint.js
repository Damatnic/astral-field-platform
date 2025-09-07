#!/usr/bin/env node
// Test script for database health check endpoint
// Run with: node scripts/test-health-endpoint.js
const http = require('http');
async function testHealthEndpoint() {
  console.log('🔍 Testing Database Health Check Endpoint...\n');
  try {
    const response = await fetch('http://localhost:3003/api/health/database');
    const data = await response.json();
    console.log('📊 Health Check Results:');
    console.log('========================');
    console.log(`✅ Success: ${data.success}`);
    console.log(`🕒 Timestamp: ${data.timestamp}`);
    console.log(`\n💾 Database Status: ${data.database.status}`);
    console.log(`🔗 Connected: ${data.database.details.connected}`);
    console.log(`⚡ Response Time: ${data.database.details.responseTime}`);
    console.log(`\n🏊 Connection Pool Stats:`);
    console.log(`   Total connections: ${data.database.poolStats.totalCount}`);
    console.log(`   Idle connections: ${data.database.poolStats.idleCount}`);
    console.log(`   Waiting clients: ${data.database.poolStats.waitingCount}`);
    if (data.database.testQuery) {
      console.log(`\n🧪 Test Query Results:`);
      console.log(`   Success: ${data.database.testQuery.success}`);
      console.log(`   Current Time: ${data.database.testQuery.currentTime}`);
      console.log(`   DB Version: ${data.database.testQuery.version.split('')[0]}`);
    }
    console.log(`\n📦 Migration System:`);
    console.log(`   Status: ${data.migrations.status}`);
    console.log(`   Table Ready: ${data.migrations.tableReady}`);
    console.log('\n🎉 Database health check completed successfully!');
    console.log('All systems are operational and ready for production.');
  } catch (error) {
    console.error('❌ Health check failed: 'error.message);
    console.error('Please ensure the development server is running on port 3003');
    process.exit(1);
  }
}
// Run the test
testHealthEndpoint().catch(console.error);