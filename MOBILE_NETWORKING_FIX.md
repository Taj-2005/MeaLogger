# Mobile Networking Fix - Android "Network Error" Resolution

## Problem

Android physical devices were getting "Network error" when trying to access the backend API, even though internet was working.

## Root Cause

**`localhost` on Android refers to the Android device itself, NOT your development machine.**

When the app tried to connect to `http://115.244.141.202:4000`, it was looking for a server running ON THE ANDROID DEVICE, not on your laptop where the backend is actually running.

## Solution

Created a platform-aware API URL resolver that automatically uses the correct address for each platform:

### Platform-Specific Behavior

1. **Android Emulator**
   - Uses `10.0.2.2` (special alias that points to host machine)
   - Works automatically, no configuration needed

2. **Android Physical Device (Expo Go)**
   - **MUST use your machine's LAN IP** (e.g., `192.168.1.100`)
   - Requires configuration via `.env` file
   - See setup instructions below

3. **iOS Simulator**
   - Uses `localhost` (simulator shares network with Mac)
   - Works automatically, no configuration needed

4. **iOS Physical Device**
   - Should use LAN IP (same as Android)
   - Configure via `.env` file

5. **Web**
   - Uses `localhost`
   - Works automatically, no configuration needed

## Setup Instructions

### For Android Physical Devices:

1. **Find your machine's LAN IP address:**

   ```bash
   # Windows
   ipconfig
   # Look for "IPv4 Address" under your active network adapter
   # Example: 192.168.1.100
   
   # Mac/Linux
   ifconfig
   # Look for "inet" under en0 (Ethernet) or wlan0 (WiFi)
   # Example: 192.168.1.100
   ```

2. **Create `.env` file in project root:**

   ```bash
   # Copy the example (if it exists)
   cp .env.example .env
   
   # Or create new file
   touch .env
   ```

3. **Add your LAN IP to `.env`:**

   ```env
   EXPO_PUBLIC_LAN_IP=192.168.1.100
   ```

4. **Restart Expo server:**

   ```bash
   npm start
   ```

5. **Verify the API URL is correct:**

   When the app starts, check the console logs. You should see:
   ```
   🌐 API Base URL: http://192.168.1.100:4000/api/v1
   ```

### For Production:

Set the full API URL in `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-backend.vercel.app
```

This overrides all platform-specific logic.

## Files Changed

1. **`utils/apiConfig.ts`** (NEW)
   - Platform-aware API URL resolver
   - Handles all platform cases
   - Provides helpful error messages

2. **`services/api.ts`**
   - Updated to use `getApiBaseURL()` instead of hardcoded URL
   - Logs the API URL being used for debugging

3. **`utils/networkDiagnostics.ts`**
   - Updated to use platform-aware URL

4. **`utils/networkTest.ts`**
   - Updated to use platform-aware URL

5. **`app.json`**
   - Added support for `extra.apiBaseUrl` and `extra.lanIp`

6. **`README.md`**
   - Added setup instructions for Android physical devices

## Testing

After configuration, test the connection:

1. Start your backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Start Expo:
   ```bash
   npm start
   ```

3. Open app on Android device via Expo Go

4. Check console logs for:
   ```
   🌐 API Base URL: http://192.168.1.100:4000/api/v1
   ```

5. Try logging in or accessing any API endpoint

6. If it still fails:
   - Verify backend is accessible from your machine: `curl http://192.168.1.100:4000/api/v1/health`
   - Check firewall settings (may need to allow port 4000)
   - Verify Android device and laptop are on the same WiFi network
   - Check backend CORS settings allow requests from your LAN IP

## Troubleshooting

### Still getting "Network error"?

1. **Verify LAN IP is correct:**
   - Run `ipconfig` / `ifconfig` again
   - Make sure you're using the IP of the network adapter that's connected to WiFi
   - If you have multiple network adapters, use the one connected to the same network as your Android device

2. **Check backend is accessible:**
   ```bash
   # From your laptop, test if backend responds
   curl http://192.168.1.100:4000/api/v1/health
   ```

3. **Check firewall:**
   - Windows: Allow port 4000 in Windows Firewall
   - Mac: System Preferences → Security → Firewall → Allow Node

4. **Verify same network:**
   - Android device and laptop must be on the same WiFi network
   - Check WiFi SSID matches on both devices

5. **Check backend CORS:**
   - Backend must allow requests from your LAN IP
   - Check `server/src/config/index.js` CORS settings

### Android Emulator not working?

- Emulator should automatically use `10.0.2.2`
- If not working, check emulator network settings
- Try explicitly setting `EXPO_PUBLIC_LAN_IP=10.0.2.2` in `.env`

## Why This Happens

- **Web/iOS Simulator**: `localhost` works because they share the network namespace with the host machine
- **Android Emulator**: Has special networking where `10.0.2.2` is an alias for the host machine
- **Android Physical Device**: Is a separate device on the network, so `localhost` refers to itself, not your laptop
- **iOS Physical Device**: Same as Android - separate device, needs LAN IP

## Production Notes

For production builds, always use a full domain URL:
```env
EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

This ensures the app works regardless of platform or network configuration.
