import { useEffect } from 'react';
import { isCapacitor } from '@/utils/capacitor';
import { initPhotoStorage } from '@/utils/photoStorage';
import { startBackgroundSync } from '@/utils/syncQueue';

/**
 * Initialize offline-first photo system for cleaner app
 * Call this hook once at app root level
 */
export function usePhotoSync() {
  useEffect(() => {
    if (!isCapacitor()) {
      return; // Only run on native platform
    }

    console.log('Initializing offline-first photo system...');

    // Initialize storage directory
    initPhotoStorage()
      .then(() => {
        console.log('Photo storage initialized');
        
        // Start background sync service
        startBackgroundSync();
        console.log('Background photo sync service started');
      })
      .catch(error => {
        console.error('Failed to initialize photo system:', error);
      });

    // Cleanup on unmount
    return () => {
      // stopBackgroundSync() is called automatically when app closes
    };
  }, []);
}
