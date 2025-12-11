# MealLogger Website

A stunning, professional product landing page for the MealLogger mobile app, built with Next.js 16, TypeScript, Tailwind CSS, and Framer Motion.

## 🚀 Features

- **Modern Design**: Premium, minimal UI with smooth animations
- **Fully Responsive**: Mobile-first design that looks great on all devices
- **Framer Motion**: Smooth, professional animations throughout
- **APK Download**: Direct Google Drive download integration
- **SEO Optimized**: Complete metadata and Open Graph tags
- **Performance**: Optimized for fast loading and smooth interactions

## 📦 Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

## 🛠️ Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file:

```env
NEXT_PUBLIC_APK_DRIVE_LINK=https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 APK Download Setup

### Getting Your Google Drive Link

1. Upload your APK file to Google Drive
2. Right-click the file and select "Share"
3. Set permissions to "Anyone with the link"
4. Copy the share link
5. Add it to `.env.local` as `NEXT_PUBLIC_APK_DRIVE_LINK`

### How It Works

The download system:
- Extracts the file ID from your Google Drive share link
- Converts it to a direct download URL
- Triggers the download automatically
- Shows download progress and error states
- Detects iOS devices and shows "coming soon" message

### Direct Download URL Format

The app automatically converts your share link to:
```
https://drive.google.com/uc?export=download&id=YOUR_FILE_ID
```

## 🎨 Customization

### Colors

Edit `src/app/globals.css` to customize the color scheme.

### Content

All content is in the component files:
- `src/components/Hero.tsx` - Hero section
- `src/components/AboutSection.tsx` - Problem/Solution section
- `src/components/HowItWorks.tsx` - Step-by-step guide
- `src/components/FeaturesSection.tsx` - Features grid
- `src/components/DownloadSection.tsx` - Download CTA
- `src/components/Footer.tsx` - Footer

### Animations

Animation variants are defined in `src/lib/animations.ts`. Customize timing, easing, and effects there.

## 📦 Build for Production

```bash
npm run build
npm start
```

## 🚀 Deploy

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository on Vercel
3. Add your environment variables
4. Deploy!

## 📄 License

This project is part of the MealLogger application.
