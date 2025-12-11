import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

let networkListeners: Array<(state: NetworkState) => void> = [];

// Web fallback for network detection
const isWeb = Platform.OS === 'web';

export function getNetworkState(): Promise<NetworkState> {
  if (isWeb) {
    // For web, use navigator.onLine with fallback
    const hasNavigator = typeof navigator !== 'undefined';
    const online = hasNavigator ? navigator.onLine : true;
    
    return Promise.resolve({
      isConnected: online,
      isInternetReachable: online,
      type: 'wifi',
    });
  }
  
  return NetInfo.fetch().then(state => {
    // On mobile, isConnected is the primary indicator
    // isInternetReachable can be null (unknown), which we treat as reachable
    const isConnected = state.isConnected ?? false;
    const isInternetReachable = state.isInternetReachable ?? (isConnected ? true : null);
    
    return {
      isConnected,
      isInternetReachable,
      type: state.type,
    };
  });
}

export function isOnline(): Promise<boolean> {
  if (isWeb) {
    // For web, navigator.onLine can be unreliable, so also try a quick fetch test
    const hasNavigator = typeof navigator !== 'undefined' && navigator.onLine;
    if (!hasNavigator) {
      return Promise.resolve(false);
    }
    
    // Additional check: try to fetch a small resource to verify actual connectivity
    return fetch('https://www.google.com/favicon.ico', { 
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    })
      .then(() => true)
      .catch(() => hasNavigator); // Fallback to navigator.onLine if fetch fails
  }
  
  return getNetworkState().then(state => {
    // Consider online if connected, even if isInternetReachable is null (unknown)
    // Only mark offline if explicitly disconnected
    return state.isConnected === true;
  });
}

export function subscribeToNetworkChanges(callback: (state: NetworkState) => void): () => void {
  networkListeners.push(callback);
  
  // Get initial state
  getNetworkState().then(callback);
  
  if (isWeb) {
    // Web: use online/offline events
    const handleOnline = () => {
      const networkState: NetworkState = {
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      };
      networkListeners.forEach(listener => listener(networkState));
    };
    
    const handleOffline = () => {
      const networkState: NetworkState = {
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      };
      networkListeners.forEach(listener => listener(networkState));
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
    
    return () => {
      networkListeners = networkListeners.filter(listener => listener !== callback);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }
  
  // Mobile: use NetInfo
  const unsubscribe = NetInfo.addEventListener(state => {
    const networkState: NetworkState = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? null,
      type: state.type,
    };
    
    networkListeners.forEach(listener => listener(networkState));
  });
  
  return () => {
    networkListeners = networkListeners.filter(listener => listener !== callback);
    unsubscribe();
  };
}

export function useNetworkStatus() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: false,
    isInternetReachable: null,
    type: 'unknown',
  });

  useEffect(() => {
    getNetworkState().then(setNetworkState);
    
    const unsubscribe = subscribeToNetworkChanges(setNetworkState);
    return unsubscribe;
  }, []);

  return networkState;
}
