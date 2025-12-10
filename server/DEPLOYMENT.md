# Simple Deployment Guide

**For University Projects - Simple & Free**

## Recommended: Deploy to Vercel (Easiest)

See **[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)** for complete Vercel deployment guide.

**Why Vercel?**
- ✅ Free tier (perfect for students)
- ✅ Automatic HTTPS
- ✅ Easy setup (just connect GitHub)
- ✅ Automatic deployments
- ✅ No credit card required

## Quick Vercel Deploy (5 Steps)

1. **Push code to GitHub**
2. **Sign up at [vercel.com](https://vercel.com)**
3. **Import your GitHub repo**
4. **Add environment variables** (MongoDB, Cloudinary, JWT_SECRET)
5. **Deploy!**

That's it! Your API will be live at `https://your-app.vercel.app`

See `DEPLOY_VERCEL.md` for detailed steps.

---

## Alternative: Local Development

For local testing:

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

Server runs on `http://localhost:4000`

---

## Environment Variables Needed

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/meal-logger
JWT_SECRET=your-random-secret-32-chars-min
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## Update Mobile App

After deployment, update your React Native app:

```typescript
const API_BASE_URL = 'https://your-app.vercel.app/api/v1';
```

---

**That's all you need! Simple and free for university projects.** 🎓
