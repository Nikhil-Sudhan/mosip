# 🌐 Simple Hosting Guide (For Beginners)

## What You'll Get
- ✅ **FREE** hosting
- ✅ Your website live on the internet
- ✅ No credit card needed

---

## 📦 What We're Hosting

Your project has 2 parts:
1. **Frontend** (the website people see) → React app
2. **Backend** (the server that handles data) → Node.js API

---

## 🎯 Best FREE Option: Vercel + Render

### Part 1: Host Backend on Render.com

#### Step 1: Create Account
1. Go to [render.com](https://render.com)
2. Click "Get Started"
3. Sign up with GitHub (easiest way)

#### Step 2: Deploy Backend
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select your repo
4. Configure:
   - **Name:** `agriqcert-backend` (or any name)
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** FREE

#### Step 3: Add Environment Variables
Click "Environment" and add these:

```
PORT=4000
JWT_ACCESS_SECRET=your-secret-key-change-this-123456
JWT_REFRESH_SECRET=your-refresh-key-change-this-789012
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
DEFAULT_ADMIN_EMAIL=admin@yourapp.com
DEFAULT_ADMIN_PASSWORD=Admin@123
PUBLIC_URL=https://your-backend-name.onrender.com
VERIFY_PORTAL_URL=https://your-frontend-name.vercel.app/verify
```

⚠️ **IMPORTANT:** After deployment, Render will give you a URL like:
`https://agriqcert-backend.onrender.com`

**SAVE THIS URL** - you'll need it for frontend!

---

### Part 2: Host Frontend on Vercel

#### Step 1: Create Account
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Sign up with GitHub

#### Step 2: Deploy Frontend
1. Click "Add New..." → "Project"
2. Import your GitHub repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

#### Step 3: Add Environment Variable
Before clicking "Deploy", add this environment variable:

```
Name: VITE_API_BASE_URL
Value: https://your-backend-name.onrender.com/api
```

👆 Use the backend URL from Render (Part 1, Step 3)

#### Step 4: Deploy
Click "Deploy" and wait 2-3 minutes!

---

## ✅ After Deployment

### Update Backend URL on Render
1. Go back to Render dashboard
2. Open your backend service
3. Go to "Environment"
4. Update `VERIFY_PORTAL_URL` with your Vercel URL:
   ```
   VERIFY_PORTAL_URL=https://your-app-name.vercel.app/verify
   ```
5. Click "Save Changes" (backend will restart)

---

## 🎉 You're Live!

Your frontend will be at: `https://your-app-name.vercel.app`

### First Time Login:
- Email: `admin@yourapp.com` (or what you set)
- Password: `Admin@123` (or what you set)

---

## ⚠️ Important Notes

### About FREE Tier Limits:

**Render.com (Backend):**
- ✅ FREE forever
- ⚠️ Sleeps after 15 minutes of no activity
- ⚠️ Takes ~30 seconds to wake up on first request
- ✅ Good for testing and learning

**Vercel (Frontend):**
- ✅ FREE forever
- ✅ Never sleeps
- ✅ Fast and reliable

---

## 🔧 Updating Your App

### Update Frontend:
1. Push changes to GitHub
2. Vercel automatically rebuilds (takes 1-2 minutes)

### Update Backend:
1. Push changes to GitHub
2. Render automatically rebuilds (takes 2-3 minutes)

---

## 🆘 Common Issues

### Problem: "Cannot connect to backend"
**Solution:** 
1. Check if backend URL in Vercel is correct
2. Wait 30 seconds (backend might be sleeping)
3. Check Render logs for errors

### Problem: "Login not working"
**Solution:**
1. Check environment variables are set correctly
2. Make sure `PUBLIC_URL` and `VERIFY_PORTAL_URL` match your actual URLs

---

## 💡 Alternative: All-in-One Hosting

If you want everything in one place:

### Option A: Render.com (Both Frontend + Backend)
- Host both on Render
- Configure backend same as above
- Add frontend as "Static Site"

### Option B: Railway.app
- Very beginner-friendly
- $5/month (not free, but no sleep time)
- One-click deploy with GitHub

---

## 📝 Next Steps

1. ✅ Sign up for Render.com
2. ✅ Deploy backend first
3. ✅ Get backend URL
4. ✅ Sign up for Vercel
5. ✅ Deploy frontend with backend URL
6. ✅ Update backend with frontend URL
7. 🎉 Test your app!

---

## 🤔 Need Help?

If you get stuck:
1. Check the error messages in Render/Vercel logs
2. Make sure all environment variables are correct
3. Verify your GitHub repo is connected properly

Remember: First deployment takes time to understand, but once you do it once, it's easy! 💪

