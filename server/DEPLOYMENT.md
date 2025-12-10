# Simple Deployment Guide

This guide shows you how to deploy your server to production. Choose the method that works best for you.

## Prerequisites

- Node.js 18+ installed on server
- MongoDB (local or MongoDB Atlas)
- Cloudinary account
- Domain name (optional, can use IP address)

## Method 1: Simple PM2 Deployment (Recommended for Students)

PM2 is a simple process manager that keeps your server running.

### Step 1: Install PM2

```bash
npm install -g pm2
```

### Step 2: Setup on Server

```bash
# Copy your server folder to your server
# SSH into your server, then:

cd server
npm install --production
```

### Step 3: Configure Environment

```bash
# Create .env file
cp .env.example .env
nano .env  # Edit with your production values
```

**Important production values:**
```env
NODE_ENV=production
PORT=4000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/meal-logger
JWT_SECRET=your-very-long-random-secret-key-min-32-chars
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CORS_ORIGINS=https://yourdomain.com
```

### Step 4: Start with PM2

```bash
# Start server
pm2 start ecosystem.config.js --env production

# Check status
pm2 status

# View logs
pm2 logs meal-logger-server

# Save PM2 configuration (auto-start on reboot)
pm2 save
pm2 startup
```

### Step 5: Setup Nginx (Optional - for HTTPS)

```nginx
# /etc/nginx/sites-available/meal-logger
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then enable:
```bash
sudo ln -s /etc/nginx/sites-available/meal-logger /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Useful PM2 Commands

```bash
pm2 restart meal-logger-server  # Restart
pm2 stop meal-logger-server     # Stop
pm2 delete meal-logger-server   # Remove
pm2 logs meal-logger-server     # View logs
pm2 monit                       # Monitor
```

---

## Method 2: Docker Deployment

### Step 1: Build Docker Image

```bash
cd server
docker build -t meal-logger-server .
```

### Step 2: Run Container

```bash
docker run -d \
  --name meal-logger \
  -p 4000:4000 \
  --env-file .env \
  --restart unless-stopped \
  meal-logger-server
```

### Step 3: View Logs

```bash
docker logs meal-logger
docker logs -f meal-logger  # Follow logs
```

### Step 4: Update Server

```bash
docker stop meal-logger
docker rm meal-logger
docker build -t meal-logger-server .
docker run -d --name meal-logger -p 4000:4000 --env-file .env meal-logger-server
```

---

## Method 3: Simple Node.js (No PM2)

For testing or very simple deployments:

```bash
# Start server
NODE_ENV=production node src/index.js

# Or use nohup to keep running after SSH disconnect
nohup node src/index.js > logs/server.log 2>&1 &
```

**Note**: Server will stop if process dies. Use PM2 for production.

---

## Method 4: Deploy to Cloud Platforms

### Railway.app (Easiest for Students)

1. Sign up at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repo
4. Add environment variables
5. Deploy!

### Render.com

1. Sign up at [render.com](https://render.com)
2. New Web Service
3. Connect GitHub repo
4. Set build command: `npm install`
5. Set start command: `node src/index.js`
6. Add environment variables
7. Deploy!

### Heroku

```bash
# Install Heroku CLI
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI=your-mongo-uri
# ... add all env vars
git push heroku main
```

---

## Environment Variables Checklist

Make sure these are set in production:

- ✅ `NODE_ENV=production`
- ✅ `PORT=4000` (or your port)
- ✅ `MONGO_URI` (MongoDB connection string)
- ✅ `JWT_SECRET` (long random string, 32+ chars)
- ✅ `CLOUDINARY_CLOUD_NAME`
- ✅ `CLOUDINARY_API_KEY`
- ✅ `CLOUDINARY_API_SECRET`
- ✅ `CORS_ORIGINS` (your domain or leave empty for mobile apps)

---

## Security Checklist

Before going live:

- [ ] Change default JWT_SECRET to strong random string
- [ ] Use MongoDB Atlas (cloud) or secure local MongoDB
- [ ] Set up HTTPS (use Let's Encrypt free SSL)
- [ ] Configure firewall (only allow port 80/443)
- [ ] Keep Node.js updated
- [ ] Don't commit `.env` file to git
- [ ] Use strong MongoDB password
- [ ] Enable MongoDB IP whitelist

---

## Testing Your Deployment

1. **Health Check:**
   ```bash
   curl https://yourdomain.com/api/v1/health
   ```

2. **Register User:**
   ```bash
   curl -X POST https://yourdomain.com/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@example.com","password":"password123"}'
   ```

3. **Update Your Mobile App:**
   ```typescript
   // In your React Native app
   const API_BASE_URL = 'https://yourdomain.com/api/v1';
   ```

---

## Troubleshooting

### Server Won't Start

```bash
# Check logs
pm2 logs meal-logger-server
# or
docker logs meal-logger

# Check if port is in use
lsof -i :4000

# Check MongoDB connection
mongosh "your-mongo-uri"
```

### Server Crashes

```bash
# Check error logs
tail -f logs/error.log

# Restart PM2
pm2 restart meal-logger-server
```

### Can't Connect from Mobile App

- Check firewall allows port 4000 (or 80/443)
- Verify CORS_ORIGINS is set correctly
- Check server is running: `pm2 status`
- Test with curl from your computer

---

## Quick Deploy Script

Save this as `deploy.sh`:

```bash
#!/bin/bash
echo "Deploying Meal Logger Server..."

# Pull latest code
git pull

# Install dependencies
npm install --production

# Restart PM2
pm2 restart ecosystem.config.js --env production

echo "Deployment complete!"
pm2 status
```

Make executable: `chmod +x deploy.sh`
Run: `./deploy.sh`

---

## Need Help?

- Check server logs: `pm2 logs` or `docker logs`
- Verify environment variables: `pm2 env meal-logger-server`
- Test API: Use Postman or curl
- Check MongoDB connection: Test connection string

**Remember**: For a student project, PM2 (Method 1) is the simplest and most reliable option!

