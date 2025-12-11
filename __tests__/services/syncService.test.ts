import { syncService } from '../../services/syncService';
import { OfflineQueue } from '../../services/offlineQueue';
import { OfflineStorage } from '../../services/offlineStorage';
import * as FileSystem from 'expo-file-system';

jest.mock('expo-file-system');
jest.mock('../../utils/network');
jest.mock('../../services/api');
jest.mock('../../services/offlineQueue');
jest.mock('../../services/offlineStorage');

describe('SyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('copyImageToPersistentStorage', () => {
    it('should copy image to persistent storage', async () => {
      const mockImageUri = 'file:///temp/image.jpg';
      const mockLocalId = 'local_123';
      const mockPersistentUri = 'file:///persistent/meal_local_123_1234567890.jpg';

      (FileSystem.copyAsync as jest.Mock).mockResolvedValue(undefined);
      (FileSystem.documentDirectory as any) = 'file:///persistent/';

      const result = await syncService.copyImageToPersistentStorage(mockImageUri, mockLocalId);

      expect(FileSystem.copyAsync).toHaveBeenCalledWith({
        from: mockImageUri,
        to: expect.stringContaining('meal_local_123_'),
      });
      expect(result).toContain('meal_local_123_');
    });

    it('should handle copy errors gracefully', async () => {
      const mockImageUri = 'file:///temp/image.jpg';
      const mockLocalId = 'local_123';

      (FileSystem.copyAsync as jest.Mock).mockRejectedValue(new Error('Copy failed'));

      await expect(
        syncService.copyImageToPersistentStorage(mockImageUri, mockLocalId)
      ).rejects.toThrow();
    });
  });

  describe('syncQueue', () => {
    it('should sync queued requests successfully', async () => {
      const mockQueue = [
        {
          id: 'req_1',
          type: 'CREATE_MEAL' as const,
          endpoint: '/meals',
          method: 'POST',
          data: { title: 'Test Meal', type: 'breakfast', date: '2024-01-01' },
          localId: 'local_123',
          imageUri: 'file:///persistent/image.jpg',
          timestamp: Date.now(),
          retries: 0,
        },
      ];

      (OfflineQueue.getQueue as jest.Mock).mockResolvedValue(mockQueue);
      (OfflineQueue.dequeue as jest.Mock).mockResolvedValue(undefined);
      (OfflineStorage.updateMeal as jest.Mock).mockResolvedValue(undefined);

      // Mock fetch for API call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { meal: { _id: 'server_123', imageUrl: 'https://server.com/image.jpg' } },
        }),
      });

      const result = await syncService.syncQueue();

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
      expect(OfflineQueue.dequeue).toHaveBeenCalledWith('req_1');
    });

    it('should handle sync failures and retry', async () => {
      const mockQueue = [
        {
          id: 'req_1',
          type: 'CREATE_MEAL' as const,
          endpoint: '/meals',
          method: 'POST',
          data: { title: 'Test Meal', type: 'breakfast', date: '2024-01-01' },
          localId: 'local_123',
          imageUri: 'file:///persistent/image.jpg',
          timestamp: Date.now(),
          retries: 0,
        },
      ];

      (OfflineQueue.getQueue as jest.Mock).mockResolvedValue(mockQueue);
      (OfflineQueue.incrementRetry as jest.Mock).mockResolvedValue(true);

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await syncService.syncQueue();

      expect(result.synced).toBe(0);
      expect(result.failed).toBe(0); // Not failed yet, will retry
      expect(OfflineQueue.incrementRetry).toHaveBeenCalledWith('req_1');
    });

    it('should skip sync if already in progress', async () => {
      // Acquire lock
      await syncService.acquireLock();

      const result = await syncService.syncQueue();

      expect(result.synced).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('network listener', () => {
    it('should start and stop network listener', () => {
      const startSpy = jest.spyOn(syncService, 'start');
      const stopSpy = jest.spyOn(syncService, 'stop');

      syncService.start();
      expect(startSpy).toHaveBeenCalled();

      syncService.stop();
      expect(stopSpy).toHaveBeenCalled();
    });
  });
});

