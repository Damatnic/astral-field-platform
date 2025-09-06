# 🚀 Ready-to-Deploy Buttons

## Option 1: Direct Deploy (Replace with your GitHub username)
```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/astral-field)
```

## Option 2: With Environment Variables Pre-configured
```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/astral-field&env=DATABASE_URL,NEXT_PUBLIC_STACK_PROJECT_ID,NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,STACK_SECRET_SERVER_KEY,NEXT_PUBLIC_SPORTSDATA_API_KEY,OPENAI_API_KEY,ANTHROPIC_API_KEY,ADMIN_SETUP_KEY)
```

## 📝 Steps to Use:

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add one-click deployment setup"
   git push origin main
   ```

2. **Replace YOUR_USERNAME** with your actual GitHub username in the deploy button

3. **Use the deploy button** - Copy one of the buttons above into your README.md

## 🔧 Manual Vercel Deploy (Alternative)

If the one-click button doesn't work, you can deploy manually:

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import from GitHub** - Select your astral-field repository
4. **Add Environment Variables:**
   ```
   DATABASE_URL=your_neon_database_url_here
   NEXT_PUBLIC_STACK_PROJECT_ID=your_stack_project_id
   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_publishable_key
   STACK_SECRET_SERVER_KEY=your_stack_secret_key
   NEXT_PUBLIC_SPORTSDATA_API_KEY=your_sportsdata_api_key
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ADMIN_SETUP_KEY=astral2025
   ```
5. **Deploy!**

## ✅ After Deployment

Once deployed, your app will be available at `https://your-app-name.vercel.app`

**Initialize your app:**
1. Visit: `https://your-app-name.vercel.app/api/setup-users?key=astral2025`
2. Visit: `https://your-app-name.vercel.app/api/setup-demo-league?key=astral2025`
3. Test login: Go to your app and use code `1234`

**🎉 Your fantasy football platform is live!**