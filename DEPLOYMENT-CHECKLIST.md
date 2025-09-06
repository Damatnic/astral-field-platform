# 📋 Astral Field Deployment Checklist

## Pre-Deployment Requirements

### ✅ Database Setup
- [ ] Neon Database account created
- [ ] Database connection string obtained
- [ ] Connection string tested locally

### ✅ API Keys
- [ ] SportsData.io account created
- [ ] API key obtained (free tier: 1,000 requests/month)
- [ ] API key tested with a sample request

### ✅ Repository Setup
- [ ] Code pushed to GitHub repository
- [ ] Repository is public (for one-click deploy) or access granted to Vercel
- [ ] All sensitive data removed from codebase

## Deployment Process

### 🚀 One-Click Deploy
- [ ] Click the "Deploy with Vercel" button
- [ ] Set required environment variables:
  - [ ] `NEON_DATABASE_URL`
  - [ ] `NEXT_PUBLIC_SPORTSDATA_API_KEY`
  - [ ] `ADMIN_SETUP_KEY` (use `astral2025` or custom)
- [ ] Deploy and wait for completion

### 🔧 Post-Deployment Setup
- [ ] Visit `https://your-app.vercel.app/api/setup-users?key=astral2025`
- [ ] Verify response shows: `"Created 10, Updated 0"`
- [ ] Visit `https://your-app.vercel.app/api/setup-demo-league?key=astral2025`
- [ ] Verify response shows league creation success

### ✅ Verification
- [ ] Run: `npm run deploy:verify https://your-app.vercel.app`
- [ ] All 5 tests pass (Home, Health, Login, Dashboard, Players)
- [ ] Test login with code `1234` (Nicholas D'Amato)
- [ ] Verify dashboard shows league information
- [ ] Check that all 10 demo users can log in

## Production Considerations

### 🔐 Security
- [ ] Change `ADMIN_SETUP_KEY` from default `astral2025`
- [ ] Add proper authentication for setup endpoints
- [ ] Review and update CORS settings if needed
- [ ] Enable rate limiting for production

### 📊 Monitoring
- [ ] Set up Vercel analytics
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up uptime monitoring
- [ ] Review function timeout limits

### 🎛️ Performance
- [ ] Enable Vercel Edge Network
- [ ] Configure caching headers
- [ ] Optimize images and static assets
- [ ] Monitor database connection limits

## Environment Variables Reference

### Required
```bash
NEON_DATABASE_URL=postgresql://username:password@host/database?sslmode=require
NEXT_PUBLIC_SPORTSDATA_API_KEY=your_sportsdata_api_key
ADMIN_SETUP_KEY=astral2025
```

### Optional (for full functionality)
```bash
JWT_SECRET=generate_secure_random_string
NEXTAUTH_SECRET=generate_secure_random_string
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Troubleshooting

### Common Issues
- **Database Connection Failed**: Verify Neon URL and whitelist Vercel IPs
- **API Key Invalid**: Check SportsData.io dashboard for key status
- **Build Failed**: Check Next.js version compatibility
- **Setup Endpoints 401**: Verify `ADMIN_SETUP_KEY` matches URL parameter

### Debug Commands
```bash
# Verify deployment
npm run deploy:verify https://your-app.vercel.app

# Check health endpoint
curl https://your-app.vercel.app/api/health

# Test database connection
curl "https://your-app.vercel.app/api/debug-db"
```

## Success Criteria
- ✅ All deployment verification tests pass
- ✅ 10 demo users created and can log in
- ✅ Demo league with teams created
- ✅ Dashboard displays league information
- ✅ No console errors on page load
- ✅ Mobile responsive design works
- ✅ API endpoints respond correctly

---

**🎯 Ready for production? Follow this checklist step by step!**