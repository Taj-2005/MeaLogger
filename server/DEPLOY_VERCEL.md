# Deploy to Vercel - Simple Guide

This guide shows you how to deploy your server to Vercel in just a few steps.

## Prerequisites

- GitHub account
- Vercel account (free) - sign up at [vercel.com](https://vercel.com)
- MongoDB Atlas account (free) - sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Cloudinary account (free) - sign up at [cloudinary.com](https://cloudinary.com)

## Step 1: Setup MongoDB Atlas (Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create a new cluster (free tier)
4. Create database user (username + password)
5. Whitelist IP: Click "Network Access" → "Add IP Address" → "Allow Access from Anywhere" (0.0.0.0/0)
6. Get connection string: Click "Connect" → "Connect your application" → Copy the connection string
7. Replace `<password>` with your database password

Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/meal-logger?retryWrites=true&w=majority`

## Step 2: Setup Cloudinary (Free)

1. Go to [Cloudinary](https://cloudinary.com)
2. Create free account
3. Go to Dashboard
4. Copy these values:
   - Cloud Name
   - API Key
   - API Secret

## Step 3: Push Code to GitHub

```bash
# If not already on GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

## Step 4: Deploy to Vercel

### Option A: Using Vercel Website (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: `server` (if your server folder is in root)
   - **Build Command**: Leave empty (or `npm install`)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`
   
   **Important**: Make sure `vercel.json` is in the `server` folder!

5. Add Environment Variables (click "Environment Variables"):
   ```
   PORT=4000
   NODE_ENV=production
   MONGO_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-random-secret-key-min-32-chars
   JWT_EXP=15m
   JWT_REFRESH_EXP=30d
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   CORS_ORIGINS=https://your-app.vercel.app
   LOG_LEVEL=info
   ```

6. Click "Deploy"
7. Wait for deployment (2-3 minutes)
8. Copy your deployment URL (e.g., `https://your-app.vercel.app`)

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd server
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? meal-logger-server
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add MONGO_URI
vercel env add JWT_SECRET
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET
# ... add all other env vars

# Deploy to production
vercel --prod
```

## Step 5: Test Your Deployment

```bash
# Health check
curl https://your-app.vercel.app/api/v1/health

# Register user
curl -X POST https://your-app.vercel.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'
```

## Step 6: Update Your Mobile App

In your React Native app, update the API URL:

```typescript
// services/api.ts or wherever you have API_BASE_URL
const API_BASE_URL = 'https://your-app.vercel.app/api/v1';
```

## Environment Variables Checklist

Make sure all these are set in Vercel:

- ✅ `NODE_ENV=production`
- ✅ `PORT=4000` (Vercel sets this automatically, but include it)
- ✅ `MONGO_URI` (MongoDB Atlas connection string)
- ✅ `JWT_SECRET` (random string, 32+ characters)
- ✅ `JWT_EXP=15m`
- ✅ `JWT_REFRESH_EXP=30d`
- ✅ `CLOUDINARY_CLOUD_NAME`
- ✅ `CLOUDINARY_API_KEY`
- ✅ `CLOUDINARY_API_SECRET`
- ✅ `CORS_ORIGINS` (your Vercel URL or leave empty for mobile apps)
- ✅ `LOG_LEVEL=info`

## Generate JWT Secret

Use this command to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as `JWT_SECRET`.

## Troubleshooting

### Deployment Fails / 500 Errors

1. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Your Project → Functions → View Logs
   - Look for error messages

2. **Verify Environment Variables:**
   - All variables must be set in Vercel Dashboard
   - Check MongoDB connection string is correct

3. **Check Files:**
   - Make sure `vercel.json` is in the `server` folder
   - Make sure `api/index.js` exists (serverless entry point)
   - Check that `package.json` has correct dependencies

4. **MongoDB Connection:**
   - Verify MongoDB Atlas cluster is running
   - Check IP whitelist allows all (0.0.0.0/0)
   - Test connection string format

5. **Common Fix:**
   - If getting 500 errors, see `VERCEL_FIX.md` for serverless setup
   - Make sure you're using `api/index.js` as entry point

### API Returns 404

- Make sure routes are correct: `/api/v1/...`
- Check Vercel function logs

### MongoDB Connection Fails

- Verify MongoDB Atlas IP whitelist includes all IPs (0.0.0.0/0)
- Check connection string has correct password
- Verify database name in connection string

### Cloudinary Upload Fails

- Verify all Cloudinary credentials are correct
- Check Cloudinary dashboard for usage limits

## Update Your Deployment

After making code changes:

```bash
# Push to GitHub
git add .
git commit -m "Update code"
git push

# Vercel automatically redeploys!
```

Or manually:
```bash
vercel --prod
```

## Vercel Free Tier Limits

- ✅ 100GB bandwidth/month
- ✅ Serverless functions (good for API)
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ Automatic deployments from GitHub

**Perfect for university projects!** 🎓

## Your API URL

After deployment, your API will be available at:
```
https://your-app-name.vercel.app/api/v1
```

Use this URL in your mobile app!

---

**That's it! Your server is now live on Vercel!** 🚀

