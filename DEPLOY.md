# 🚀 Astral Field - One-Click Vercel Deployment

Deploy your own instance of Astral Field Fantasy Football Platform with one click!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fastral-field&env=DATABASE_URL,NEXT_PUBLIC_STACK_PROJECT_ID,NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,STACK_SECRET_SERVER_KEY,NEXT_PUBLIC_SPORTSDATA_API_KEY,OPENAI_API_KEY,ANTHROPIC_API_KEY,ADMIN_SETUP_KEY&envDescription=Required%20environment%20variables%20for%20Astral%20Field&envLink=https%3A%2F%2Fgithub.com%2Fyour-username%2Fastral-field%2Fblob%2Fmain%2F.env.example&project-name=astral-field&repository-name=astral-field)

## 📋 Prerequisites

Before deploying, you'll need:

### 1. 🗄️ Database Setup (Required)
**Neon Database**
1. Visit [Neon.tech](https://neon.tech)
2. Create a free account and project
3. Copy your connection string from the dashboard
4. It should look like: `postgresql://username:password@host/database?sslmode=require`

### 2. 🔐 Authentication Setup (Required)
**Stack Auth**
1. Visit [Stack Auth](https://stack-auth.com)
2. Create a free account and project
3. Get your project credentials:
   - Project ID
   - Publishable Client Key
   - Secret Server Key

### 3. 🏈 SportsData.io API (Required for Live Data)
1. Visit [SportsData.io](https://sportsdata.io)
2. Sign up for a free developer account
3. Get your API key from the dashboard
4. Free tier includes 1,000 requests per month

### 4. 🤖 AI APIs (Optional but Recommended)
**For Oracle AI Assistant**
- [OpenAI API Key](https://platform.openai.com) - For GPT models
- [Anthropic API Key](https://console.anthropic.com) - For Claude models
- [Google Gemini Key](https://makersuite.google.com) - For Gemini models

## 🚀 One-Click Deploy

1. **Click the "Deploy with Vercel" button above**

2. **Set Required Environment Variables:**
   - `DATABASE_URL`: Your Neon PostgreSQL connection string
   - `NEXT_PUBLIC_STACK_PROJECT_ID`: Your Stack Auth project ID
   - `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`: Your Stack Auth publishable key
   - `STACK_SECRET_SERVER_KEY`: Your Stack Auth secret server key
   - `NEXT_PUBLIC_SPORTSDATA_API_KEY`: Your SportsData.io API key
   - `OPENAI_API_KEY`: Your OpenAI API key (optional)
   - `ANTHROPIC_API_KEY`: Your Anthropic API key (optional)
   - `ADMIN_SETUP_KEY`: Set to `astral2025` (or your custom key)

3. **Deploy!** Vercel will:
   - Clone the repository
   - Install dependencies
   - Build the application
   - Deploy to a global CDN

## 🔧 Post-Deployment Setup

After your deployment is complete:

### 1. Initialize Database Schema
Visit: `https://your-app.vercel.app/api/setup-users?key=astral2025`

This will:
- Create all necessary database tables
- Set up the 10 demo users with authentication
- Configure the demo fantasy league

### 2. Test Your Deployment
1. Visit your deployed URL
2. Click "Login" and try code `1234` (Nicholas D'Amato)
3. You should see the dashboard with your league

### 3. API Endpoints Available
- `/api/setup-users?key=astral2025` - Initialize demo users
- `/api/setup-demo-league?key=astral2025` - Create demo league with teams
- `/api/health` - Health check endpoint
- `/api/debug-db` - Database status (development)

## 🔐 Security Notes

- Change `ADMIN_SETUP_KEY` from default `astral2025` in production
- The setup endpoints are protected and require the admin key
- Demo users use simple 4-digit codes for ease of testing

## 🛠️ Customization

After deployment, you can:

1. **Add Your Own Users**: Modify `/src/app/api/setup-users/route.ts`
2. **Customize Teams**: Edit team names in `/src/app/api/setup-demo-league/route.ts`
3. **Update Styling**: Modify Tailwind classes throughout the app
4. **Add Features**: The codebase is ready for additional fantasy football features

## 📊 Monitoring

Your Vercel deployment includes:
- Automatic health checks every 6 hours
- Performance monitoring
- Error tracking
- Analytics dashboard

## 🐛 Troubleshooting

**Database Connection Issues:**
- Verify your `NEON_DATABASE_URL` is correct
- Ensure your Neon database allows connections
- Check the Vercel deployment logs

**API Key Issues:**
- Verify your SportsData.io API key is valid
- Check that you have remaining API quota
- Ensure the key has appropriate permissions

**Setup Issues:**
- Make sure you visit the setup URLs after deployment
- Check that your `ADMIN_SETUP_KEY` matches what you're using in URLs
- View Vercel function logs for detailed error messages

## 💡 Need Help?

1. Check the [GitHub Issues](https://github.com/your-username/astral-field/issues)
2. Review the [Vercel Deployment Docs](https://vercel.com/docs)
3. Check [Neon Documentation](https://neon.tech/docs) for database issues

---

**🎯 Ready to deploy your fantasy football platform? Click the deploy button above!**