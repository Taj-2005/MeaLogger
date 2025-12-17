import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Get the API base URL based on the current platform and environment.
 * 
 * Why this is needed:
 * - Android physical device: `localhost` refers to the device itself, not your dev machine
 * - Android emulator: Use `10.0.2.2` (special alias for host machine)
 * - iOS simulator: `localhost` works (simulator shares network with host)
 * - Web: `localhost` works
 * 
 * For Android physical devices, you need to use your machine's LAN IP address.
 * Find it with: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
 */

interface ApiConfig {
  baseURL: string;
  host: string;
  port: number;
}

/**
 * Get the API base URL for the current platform
 */
export function getApiBaseURL(): string {
  const config = getApiConfig();
  return `${config.baseURL}/api/v1`;
}

/**
 * Get detailed API configuration
 */
export function getApiConfig(): ApiConfig {
  // Debug: Log what environment variables are available
  const debugEnv = {
    EXPO_PUBLIC_LAN_IP: process.env.EXPO_PUBLIC_LAN_IP,
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_API_PORT: process.env.EXPO_PUBLIC_API_PORT,
    extra_lanIp: Constants.expoConfig?.extra?.lanIp,
    extra_apiBaseUrl: Constants.expoConfig?.extra?.apiBaseUrl,
  };
  console.log('🔍 Environment variables:', debugEnv);

  // Check for explicit override via environment variable
  const envUrl = Constants.expoConfig?.extra?.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) {
    // If full URL provided, use it
    if (envUrl.startsWith('http')) {
      const config = {
        baseURL: envUrl.replace('/api/v1', '').replace(/\/$/, ''), // Remove /api/v1 and trailing slash if present
        host: new URL(envUrl).hostname,
        port: parseInt(new URL(envUrl).port) || 4000,
      };
      console.log('✅ Using full API URL from config:', config.baseURL);
      return config;
    }
  }

  // Default port (change if your server uses a different port)
  const port = process.env.EXPO_PUBLIC_API_PORT 
    ? parseInt(process.env.EXPO_PUBLIC_API_PORT, 10) 
    : 4000;

  // Platform-specific host resolution
  let host: string;

  if (Platform.OS === 'web') {
    // Web: use localhost or configured host
    host = envUrl ? new URL(envUrl).hostname : 'localhost';
  } else if (Platform.OS === 'ios') {
    // iOS Simulator: localhost works (simulator shares network with Mac)
    // iOS Physical Device: needs LAN IP (same as Android)
    const lanIp = process.env.EXPO_PUBLIC_LAN_IP || Constants.expoConfig?.extra?.lanIp;
    host = lanIp || (envUrl ? new URL(envUrl).hostname : 'localhost');
  } else if (Platform.OS === 'android') {
    // Android networking is complex:
    // - Emulator: Use 10.0.2.2 (special alias for host machine)
    // - Physical Device via Expo Go: MUST use LAN IP (e.g., 192.168.1.100)
    // - Physical Device (built app): Can use LAN IP or domain
    
    // Check if LAN IP is explicitly provided (takes precedence)
    const lanIp = process.env.EXPO_PUBLIC_LAN_IP || Constants.expoConfig?.extra?.lanIp;
    
    if (lanIp) {
      // User explicitly configured LAN IP - use it (works for both emulator and physical)
      host = lanIp;
      
      // Warn if using public IP (usually won't work for local dev)
      const isPublicIP = !lanIp.match(/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|localhost|10\.0\.2\.2)/);
      if (isPublicIP) {
        console.warn(
          '⚠️ WARNING: Using public IP address:', lanIp, '\n' +
          'Public IPs usually require:\n' +
          '1. Server bound to 0.0.0.0 (not just localhost)\n' +
          '2. Firewall rules allowing port 4000\n' +
          '3. Port forwarding (if behind NAT)\n' +
          'For local development, use your LAN IP (192.168.x.x) instead.'
        );
      } else {
        console.log('✅ Using LAN IP from config:', host);
      }
    } else {
      // Try to detect emulator vs physical device
      const deviceName = Constants.deviceName || '';
      const executionEnv = Constants.executionEnvironment;
      const isLikelyEmulator = 
        deviceName.toLowerCase().includes('emulator') || 
        deviceName.toLowerCase().includes('sdk') ||
        deviceName.toLowerCase().includes('google_sdk') ||
        deviceName.toLowerCase().includes('generic');
      
      // Expo Go on physical device: executionEnvironment is usually 'storeClient'
      // But we can't reliably detect physical vs emulator in Expo Go
      // So we default to assuming physical device if no LAN IP is set
      
      if (isLikelyEmulator && executionEnv !== 'storeClient') {
        // Android Emulator: use special alias for host machine
        host = '10.0.2.2';
        console.log('✅ Detected Android Emulator, using 10.0.2.2');
      } else {
        // Likely physical device or Expo Go - MUST use LAN IP
        console.error(
          '\n❌ ANDROID PHYSICAL DEVICE DETECTED - LAN IP REQUIRED\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'localhost does NOT work on Android physical devices.\n' +
          'You MUST configure your machine\'s LAN IP address.\n\n' +
          'Current environment check:\n' +
          `  EXPO_PUBLIC_LAN_IP: ${process.env.EXPO_PUBLIC_LAN_IP || 'NOT SET'}\n` +
          `  extra.lanIp: ${Constants.expoConfig?.extra?.lanIp || 'NOT SET'}\n` +
          `  Device: ${deviceName || 'Unknown'}\n` +
          `  Execution: ${executionEnv || 'Unknown'}\n\n` +
          'Steps to fix:\n' +
          '1. Find your machine\'s LAN IP:\n' +
          '   • Windows: Run "ipconfig" → Look for "IPv4 Address"\n' +
          '   • Mac/Linux: Run "ifconfig" → Look for "inet" under en0/wlan0\n' +
          '   • Example: 192.168.1.100\n\n' +
          '2. Create .env file in project ROOT (same level as package.json):\n' +
          '   EXPO_PUBLIC_LAN_IP=192.168.1.100\n\n' +
          '3. IMPORTANT: Restart Expo server completely:\n' +
          '   • Stop current server (Ctrl+C)\n' +
          '   • Run: npm start\n' +
          '   • Clear cache if needed: npm start -- --clear\n\n' +
          '4. Verify the log shows your LAN IP, not localhost\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
        );
        // Still set to localhost so app doesn't crash, but it will fail
        host = 'localhost';
      }
    }
  } else {
    // Unknown platform, default to localhost
    host = 'localhost';
  }

  const baseURL = `http://${host}:${port}`;

  console.log(`🌐 API Config: ${baseURL} (Platform: ${Platform.OS}, Host: ${host}, Port: ${port})`);

  return {
    baseURL,
    host,
    port,
  };
}

/**
 * Get a helpful message for configuring the API URL
 */
export function getApiConfigHelp(): string {
  const config = getApiConfig();
  const platform = Platform.OS;
  
  if (platform === 'android') {
    const isEmulator = Constants.deviceName?.includes('emulator') || 
                       Constants.deviceName?.includes('sdk');
    
    if (isEmulator) {
      return `Android Emulator detected. Using 10.0.2.2 (host machine alias).\nCurrent API URL: ${config.baseURL}`;
    } else {
      return `Android Physical Device detected.\n` +
             `Current API URL: ${config.baseURL}\n` +
             `If this doesn't work, set EXPO_PUBLIC_LAN_IP in .env:\n` +
             `1. Find your machine's LAN IP: ipconfig (Windows) or ifconfig (Mac/Linux)\n` +
             `2. Add to .env: EXPO_PUBLIC_LAN_IP=192.168.x.x\n` +
             `3. Restart Expo server`;
    }
  }
  
  return `Platform: ${platform}\nCurrent API URL: ${config.baseURL}`;
}
