# Vercel Deployment Fix

## Problem
The server was crashing with 500 errors because it was trying to run as a traditional server, but Vercel uses serverless functions.

## Solution
Created a serverless-compatible entry point at `api/index.js` that:
- Exports the Express app directly (no `app.listen()`)
- Caches MongoDB connection for serverless functions
- Works with Vercel's serverless architecture

## Files Changed

1. **Created `api/index.js`** - Serverless entry point
2. **Updated `vercel.json`** - Points to correct entry point
3. **Updated `src/app.js`** - Simplified logging for serverless

## Deploy Again

1. **Push changes to GitHub:**
   ```bash
   git add .
   git commit -m "Fix Vercel serverless deployment"
   git push
   ```

2. **Vercel will automatically redeploy** (or manually redeploy in Vercel dashboard)

3. **Check Vercel logs** if still having issues:
   - Go to Vercel Dashboard → Your Project → Functions
   - Check the logs for errors

## Environment Variables

Make sure these are set in Vercel Dashboard → Settings → Environment Variables:

- `MONGO_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Random secret key (32+ chars)
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret
- `NODE_ENV=production` (optional, Vercel sets this)

## Test

After deployment, test:
```bash
curl https://your-app.vercel.app/api/v1/health
```

Should return:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "...",
  "environment": "production"
}
```

## Common Issues

### Still getting 500 error?
- Check Vercel function logs
- Verify MongoDB connection string is correct
- Make sure all environment variables are set
- Check MongoDB Atlas IP whitelist (should allow all: 0.0.0.0/0)

### MongoDB connection timeout?
- Make sure MongoDB Atlas cluster is running
- Check connection string format
- Verify database user credentials

### Function timeout?
- Vercel free tier has 10s timeout for hobby plan
- Consider upgrading or optimizing slow endpoints

