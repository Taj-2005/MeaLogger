import { NetworkState, subscribeToNetworkChanges } from '../utils/network';
import { api } from './api';

class SyncService {
  private unsubscribe: (() => void) | null = null;
  private isSyncing = false;
  private syncListeners: Array<(syncing: boolean) => void> = [];

  start() {
    if (this.unsubscribe) return; // Already started

    this.unsubscribe = subscribeToNetworkChanges(async (state: NetworkState) => {
      if (state.isConnected && state.isInternetReachable) {
        // Connection restored, sync queue
        await this.sync();
      }
    });
  }

  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  async sync(): Promise<void> {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    this.notifyListeners(true);

    try {
      const result = await api.syncOfflineQueue();
      console.log('Sync completed:', result);
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
      this.notifyListeners(false);
    }
  }

  subscribe(listener: (syncing: boolean) => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(syncing: boolean) {
    this.syncListeners.forEach(listener => listener(syncing));
  }

  getSyncing(): boolean {
    return this.isSyncing;
  }
}

export const syncService = new SyncService();
