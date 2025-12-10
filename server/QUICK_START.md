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

## Production Deployment

### Option 1: PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start server
npm run pm2:start

# Check status
pm2 status

# View logs
npm run pm2:logs
```

### Option 2: Simple Node

```bash
npm run prod
```

### Option 3: Docker

```bash
# Build
docker build -t meal-logger-server .

# Run
docker run -p 4000:4000 --env-file .env meal-logger-server
```

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

Change API URL in your React Native app:

```typescript
const API_BASE_URL = 'https://your-server-domain.com/api/v1';
```

That's it! 🚀

