import { isOnline, getNetworkState } from './network';

const API_BASE_URL = 'https://mea-logger.vercel.app/api/v1';

export interface NetworkDiagnostics {
  isOnline: boolean;
  networkState: any;
  serverReachable: boolean;
  serverResponse?: {
    status: number;
    message: string;
  };
  error?: string;
  timestamp: string;
}

export async function runNetworkDiagnostics(): Promise<NetworkDiagnostics> {
  const diagnostics: NetworkDiagnostics = {
    isOnline: false,
    networkState: null,
    serverReachable: false,
    timestamp: new Date().toISOString(),
  };

  try {
    diagnostics.isOnline = await isOnline();
    diagnostics.networkState = await getNetworkState();

    if (!diagnostics.isOnline) {
      diagnostics.error = 'Device is offline';
      return diagnostics;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      diagnostics.serverReachable = response.ok;
      diagnostics.serverResponse = {
        status: response.status,
        message: response.ok ? 'Server is reachable' : `Server returned ${response.status}`,
      };

      if (!response.ok) {
        diagnostics.error = `Server returned status ${response.status}`;
      }
    } catch (fetchError: any) {
      diagnostics.serverReachable = false;
      diagnostics.error = fetchError.message || 'Failed to reach server';
      
      if (fetchError.name === 'AbortError') {
        diagnostics.error = 'Request timeout - server may be unreachable';
      } else if (fetchError.message?.includes('Network request failed')) {
        diagnostics.error = 'Network request failed - check internet connection and server URL';
      }
    }
  } catch (error: any) {
    diagnostics.error = error.message || 'Unknown error during diagnostics';
  }

  return diagnostics;
}

export function getDiagnosticsSummary(diagnostics: NetworkDiagnostics): string {
  const parts: string[] = [];

  if (!diagnostics.isOnline) {
    parts.push('❌ Device is offline');
  } else {
    parts.push('✅ Device is online');
  }

  if (diagnostics.networkState) {
    parts.push(`📡 Network type: ${diagnostics.networkState.type}`);
  }

  if (diagnostics.serverReachable) {
    parts.push('✅ Server is reachable');
  } else {
    parts.push('❌ Server is not reachable');
    if (diagnostics.error) {
      parts.push(`   Error: ${diagnostics.error}`);
    }
  }

  return parts.join('\n');
}

