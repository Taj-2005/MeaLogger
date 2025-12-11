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
    // For web, use navigator.onLine
    return Promise.resolve({
      isConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isInternetReachable: typeof navigator !== 'undefined' ? navigator.onLine : true,
      type: 'wifi',
    });
  }
  
  return NetInfo.fetch().then(state => ({
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable ?? null,
    type: state.type,
  }));
}

export function isOnline(): Promise<boolean> {
  if (isWeb) {
    return Promise.resolve(typeof navigator !== 'undefined' ? navigator.onLine : true);
  }
  
  return getNetworkState().then(state => state.isConnected && (state.isInternetReachable ?? true));
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
