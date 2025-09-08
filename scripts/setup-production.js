#!/usr/bin/env node

/**
 * Production Setup Script
 * 
 * This script helps set up the production environment by:
 * 1. Checking database connectivity
 * 2. Creating necessary tables
 * 3. Seeding initial data
 * 
 * Run this after setting environment variables in Vercel
 */

console.log(`
=====================================
PRODUCTION SETUP INSTRUCTIONS
=====================================

1. First, ensure these environment variables are set in Vercel:
   (Go to your Vercel project settings > Environment Variables)

   DATABASE_URL = postgresql://neondb_owner:npg_De9Fi3RcNzrX@ep-odd-hat-adfb8gbg-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
   NEON_DATABASE_URL = postgresql://neondb_owner:npg_De9Fi3RcNzrX@ep-odd-hat-adfb8gbg-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
   
   (These are from your .env.local file)

2. After setting the environment variables, redeploy your Vercel app:
   - Go to your Vercel dashboard
   - Click "Redeploy" 
   - Select "Redeploy with existing Build Cache"

3. Once deployed, visit these URLs to initialize the database:
   
   a) First, create the database schema:
      https://your-app.vercel.app/api/database/migrate
      
   b) Then, initialize the league:
      https://your-app.vercel.app/api/init-league
      
   c) Finally, import NFL players:
      https://your-app.vercel.app/api/import-full-nfl-roster

4. Test the application:
   - Go to https://your-app.vercel.app
   - Try logging in with PIN: 1009 (for Nicholas D'Amato)
   - Check if the dashboard loads properly

TROUBLESHOOTING:
================

If you still get 500 errors:

1. Check Vercel Function Logs:
   - Go to Vercel Dashboard > Functions tab
   - Look for error messages in the logs

2. Test database connection:
   - Visit: https://your-app.vercel.app/api/health/database
   - This should return the database connection status

3. Common issues:
   - Environment variables not set correctly
   - Database URL has changed
   - SSL/TLS connection issues

Need to find your Vercel app URL?
- Go to your Vercel dashboard
- It's usually: https://astral-field-platform.vercel.app
  or similar

=====================================
`);

// Also output the required cURL commands for easy copy-paste
console.log(`
QUICK SETUP COMMANDS (run these in order):
===========================================

# 1. Test database health
curl https://astral-field-platform.vercel.app/api/health/database

# 2. Run database migration (use admin key)
curl -X POST https://astral-field-platform.vercel.app/api/database/migrate \\
  -H "Authorization: Bearer astral-admin-2025"

# 3. Initialize league
curl -X POST https://astral-field-platform.vercel.app/api/init-league

# 4. Import NFL roster
curl -X POST https://astral-field-platform.vercel.app/api/import-full-nfl-roster

# 5. Check if everything is working
curl https://astral-field-platform.vercel.app/api/leagues/1
`);