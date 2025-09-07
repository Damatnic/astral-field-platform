# 🚀 VERCEL DEPLOYMENT - ENVIRONMENT VARIABLES

## Instructions
1. Go to your Vercel Dashboard
2. Select your project
3. Navigate to: **Settings → Environment Variables**
4. Add each variable below (copy the entire line including the value)
5. Deploy your project

---

## 📋 COPY THESE ENVIRONMENT VARIABLES TO VERCEL:

```env
# ============================================
# 🗄️ NEON DATABASE (REQUIRED)
# ============================================
DATABASE_URL=postgresql://neondb_owner:npg_zSmWfO47Clbq@ep-floral-union-adtuqc88-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

NEON_DATABASE_URL=postgresql://neondb_owner:npg_zSmWfO47Clbq@ep-floral-union-adtuqc88-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# ============================================
# 🔐 NEON AUTH / STACK AUTH (REQUIRED)
# ============================================
NEXT_PUBLIC_STACK_PROJECT_ID=prj_live_sk_b18a0a963e5bfb0cfe17c5b0ff962bdd74e06f19

NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pk_live_pk_03c9a96aa2ae6f699fc98c3c06ec03c6f0e067e1

STACK_SECRET_SERVER_KEY=sk_live_sk_ee9e2f686a92e926ce68c86bdb98f3a0f87b8f8a

# ============================================
# 🔌 NEON DATA API (REQUIRED)
# ============================================
NEON_DATA_API_ENDPOINT=https://ep-floral-union-adtuqc88.apirest.c-2.us-east-1.aws.neon.tech/neondb/rest/v1

# ============================================
# 🤖 AI SERVICES (REQUIRED FOR AI FEATURES)
# ============================================
OPENAI_API_KEY=[YOUR_OPENAI_API_KEY_HERE]

ANTHROPIC_API_KEY=[YOUR_ANTHROPIC_API_KEY_HERE]

GEMINI_API_KEY=AIzaSyAEpBsYR4n54DmT1h2vm8ZO_448x5s6uMs

SPORTS_IO_API_KEY=bab44477ed904140b43630a7520517e7

# ============================================
# 🌍 ENVIRONMENT (AUTO-SET BY VERCEL)
# ============================================
NODE_ENV=production
```

---

## ✅ Verification Checklist

After adding all environment variables:

- [ ] All database URLs are added (DATABASE_URL, NEON_DATABASE_URL)
- [ ] All Stack Auth keys are added (3 keys total)
- [ ] Data API endpoint is added
- [ ] AI service keys are added (4 keys total)
- [ ] Click "Save" for each variable
- [ ] Redeploy your project

---

## 🔗 Quick Links

- **Neon Console**: https://console.neon.tech
- **Stack Auth Dashboard**: https://app.stack-auth.com
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## 🧪 Test Your Deployment

After deployment, test these endpoints:
- Sign Up: `https://your-app.vercel.app/handler/sign-up`
- Sign In: `https://your-app.vercel.app/handler/sign-in`
- Dashboard: `https://your-app.vercel.app/dashboard`

---

## 📊 Database Access

To view your users in the database:
```sql
SELECT * FROM neon_auth.users_sync;
```

---

## ⚠️ Important Notes

1. **NEXT_PUBLIC_** variables are exposed to the browser (safe for public keys)
2. **STACK_SECRET_SERVER_KEY** is server-only (never expose this)
3. All API keys should be kept secret
4. NODE_ENV is automatically set by Vercel

---

## 🆘 Troubleshooting

If authentication isn't working:
1. Check all environment variables are properly set in Vercel
2. Ensure you've redeployed after adding variables
3. Check browser console for errors
4. Verify database connection in Vercel logs