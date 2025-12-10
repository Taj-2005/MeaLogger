# Quick Start Guide

Simple steps to get your server running.

## Local Development

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your MongoDB and Cloudinary credentials
```

### 3. Start Server
```bash
npm run dev
```

Server runs on `http://localhost:4000`

---

## Deploy to Vercel (Production)

**Easiest way for university projects:**

1. **Push to GitHub**
2. **Go to [vercel.com](https://vercel.com)** and sign up
3. **Import your GitHub repo**
4. **Add environment variables** (see DEPLOY_VERCEL.md)
5. **Deploy!**

See **[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)** for complete guide.

---

## Environment Variables

Minimum required in `.env`:

```env
MONGO_URI=mongodb://localhost:27017/meal-logger
JWT_SECRET=your-secret-key-min-32-chars
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## Test Your Server

```bash
# Health check
curl http://localhost:4000/api/v1/health

# Register user
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'
```

---

## Update Mobile App

After deploying to Vercel, update your React Native app:

```typescript
const API_BASE_URL = 'https://your-app.vercel.app/api/v1';
```

---

**That's it! Simple and ready for your university project!** 🎓
