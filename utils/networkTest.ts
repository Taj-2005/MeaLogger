import { getApiBaseURL } from './apiConfig';
import { getNetworkState, isOnline } from './network';

const API_BASE_URL = getApiBaseURL();

export async function testNetworkConnectivity(): Promise<{
  networkState: any;
  isOnline: boolean;
  serverReachable: boolean;
  details: string;
}> {
  const networkState = await getNetworkState();
  const online = await isOnline();
  
  let serverReachable = false;
  let details = '';

  if (online) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      serverReachable = response.ok;
      details = serverReachable 
        ? 'Server is reachable' 
        : `Server returned status ${response.status}`;
    } catch (error: any) {
      serverReachable = false;
      details = error.message || 'Failed to reach server';
    }
  } else {
    details = 'Device appears offline';
  }

  return {
    networkState,
    isOnline: online,
    serverReachable,
    details,
  };
}

