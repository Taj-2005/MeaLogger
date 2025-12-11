# MealLogger Website - Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_APK_DRIVE_LINK=https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing
   ```

   Optional variables:
   ```env
   # Enable server-side proxy for downloads (if direct download doesn't work)
   NEXT_PUBLIC_ENABLE_DOWNLOAD_PROXY=false
   
   # Google Drive API Key (optional, for file info)
   DRIVE_API_KEY=your_api_key_here
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Getting Your Google Drive APK Link

1. Upload your APK file to Google Drive
2. Right-click the file → "Share"
3. Set permissions to "Anyone with the link can view"
4. Copy the share link
5. Paste it into `.env.local` as `NEXT_PUBLIC_APK_DRIVE_LINK`

## Download Methods

### Method 1: Direct Download (Default)
- Extracts file ID from Google Drive link
- Converts to direct download URL
- Triggers browser download
- Works on most browsers and devices

### Method 2: Server Proxy (Optional)
- Set `NEXT_PUBLIC_ENABLE_DOWNLOAD_PROXY=true` in `.env.local`
- Uses `/api/download` endpoint
- Streams file through server
- Useful if direct download is blocked

## Customization

### Colors & Styling
- Edit `src/app/globals.css` for global styles
- Components use Tailwind utility classes
- Color scheme: Blue → Purple gradients

### Content
- Hero: `src/components/Hero.tsx`
- About: `src/components/AboutSection.tsx`
- How It Works: `src/components/HowItWorks.tsx`
- Features: `src/components/FeaturesSection.tsx`
- Testimonials: `src/components/TestimonialsSection.tsx`
- Download: `src/components/DownloadSection.tsx`
- Footer: `src/components/Footer.tsx`

### Animations
- Animation variants: `src/lib/animations.ts`
- Uses Framer Motion for all animations
- Customize timing, easing, and effects

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import repository on Vercel
3. Add environment variables
4. Deploy!

### Other Platforms
- Build: `npm run build`
- Start: `npm start`
- Ensure Node.js 18+ is available

## Troubleshooting

### Download Not Working
1. Verify Google Drive link is public
2. Check file ID extraction in browser console
3. Try enabling server proxy
4. Test direct URL: `https://drive.google.com/uc?export=download&id=YOUR_FILE_ID`

### Build Errors
- Ensure all dependencies are installed
- Check TypeScript errors: `npm run build`
- Verify environment variables are set

### Styling Issues
- Clear `.next` cache: `rm -rf .next`
- Rebuild: `npm run build`

## Support

For issues or questions, check the main README.md or project documentation.

