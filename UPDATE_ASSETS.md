# Update App Logo and Splash Screen

Your `app.json` is already configured to use `assets/logo.png` for all logos and splash screens.

## Current Configuration ✅

- **App Icon**: `./assets/logo.png`
- **Android Adaptive Icon**: `./assets/logo.png`
- **iOS Icon**: `./assets/logo.png`
- **Splash Screen**: `./assets/logo.png`
- **Web Favicon**: `./assets/logo.png`

## Regenerate Native Assets

Since you have native Android and iOS folders, you need to regenerate the native assets after updating the logo.

### Option 1: Clean Prebuild (Recommended)

This will regenerate all native assets from your `app.json`:

```bash
# Clean and regenerate native folders
npx expo prebuild --clean

# Then rebuild your app
npx expo run:android
# or
npx expo run:ios
```

### Option 2: EAS Build (For Production)

If you're using EAS Build, the assets will be generated automatically:

```bash
eas build --platform android
# or
eas build --platform ios
```

### Option 3: Manual Update (If needed)

If prebuild doesn't work, you can manually update:

**For Android:**
- The adaptive icon will use `assets/logo.png` automatically
- Splash screens are configured in `app.json`

**For iOS:**
- Run: `npx expo prebuild --platform ios`
- Or update `ios/mealloggerapp/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png`

## Logo Requirements

Your `assets/logo.png` should be:
- **1024x1024 pixels** (for best quality)
- **Square** (1:1 aspect ratio)
- **PNG format** with transparency (optional)
- **High resolution** for all platforms

## Quick Update Steps

1. **Replace** `assets/logo.png` with your new logo (1024x1024px)
2. **Regenerate** native assets:
   ```bash
   npx expo prebuild --clean
   ```
3. **Rebuild** your app:
   ```bash
   npx expo run:android
   # or
   npx expo run:ios
   ```

## Verify

After rebuilding, check:
- ✅ App icon shows your logo
- ✅ Splash screen shows your logo
- ✅ Android launcher icon shows your logo
- ✅ iOS home screen icon shows your logo

That's it! Your logo is now updated everywhere! 🎨

