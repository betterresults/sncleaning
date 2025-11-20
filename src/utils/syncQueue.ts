import { Network } from '@capacitor/network';
import { supabase } from '@/integrations/supabase/client';
import { isCapacitor } from './capacitor';
import {
  getPendingPhotos,
  updatePhotoStatus,
  removeFromQueue,
  QueuedPhoto,
} from './photoQueue';
import { readLocalPhoto, deleteLocalPhoto, base64ToFile } from './photoStorage';
import { compressImage } from './imageCompression';

let syncInterval: NodeJS.Timeout | null = null;
let isSyncing = false;

const SYNC_INTERVAL_MS = 30000; // 30 seconds
const MAX_CONCURRENT_UPLOADS = 3;

/**
 * Start background sync service
 */
export function startBackgroundSync() {
  if (!isCapacitor()) {
    console.log('Background sync only available on native platform');
    return;
  }

  // Stop existing interval if any
  stopBackgroundSync();

  // Start periodic sync
  syncInterval = setInterval(async () => {
    const status = await Network.getStatus();
    if (status.connected && !isSyncing) {
      await syncPhotos();
    }
  }, SYNC_INTERVAL_MS);

  // Immediate sync if online
  Network.getStatus().then(status => {
    if (status.connected) {
      syncPhotos();
    }
  });

  // Listen for network changes
  Network.addListener('networkStatusChange', async (status) => {
    if (status.connected && !isSyncing) {
      console.log('Network connected, starting sync...');
      await syncPhotos();
    }
  });

  console.log('Background sync started');
}

/**
 * Stop background sync service
 */
export function stopBackgroundSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  console.log('Background sync stopped');
}

/**
 * Manually trigger photo sync
 */
export async function syncPhotos(): Promise<void> {
  if (isSyncing) {
    console.log('Sync already in progress');
    return;
  }

  if (!isCapacitor()) {
    console.log('Sync only available on native platform');
    return;
  }

  const status = await Network.getStatus();
  if (!status.connected) {
    console.log('No network connection, skipping sync');
    return;
  }

  isSyncing = true;
  console.log('Starting photo sync...');

  try {
    const pending = await getPendingPhotos();
    
    if (pending.length === 0) {
      console.log('No photos to sync');
      return;
    }

    console.log(`Syncing ${pending.length} photos...`);

    // Process in batches of MAX_CONCURRENT_UPLOADS
    for (let i = 0; i < pending.length; i += MAX_CONCURRENT_UPLOADS) {
      const batch = pending.slice(i, i + MAX_CONCURRENT_UPLOADS);
      await Promise.allSettled(
        batch.map(photo => uploadPhoto(photo))
      );
    }

    console.log('Photo sync completed');
  } catch (error) {
    console.error('Sync error:', error);
  } finally {
    isSyncing = false;
  }
}

/**
 * Upload a single photo from queue
 */
async function uploadPhoto(photo: QueuedPhoto): Promise<void> {
  try {
    // Update status to uploading
    await updatePhotoStatus(photo.id, 'uploading');

    // Read photo from local storage
    const base64Data = await readLocalPhoto(photo.localPath);
    const base64 = base64Data.split(',')[1]; // Remove data URL prefix
    
    // Convert to File
    const file = base64ToFile(base64, photo.fileName, photo.mimeType);

    // Compress image
    const compressedFile = await compressImage(file, {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1600,
      initialQuality: 0.70,
    });

    // Upload to Supabase Storage
    const filePath = `${photo.bookingId}/${photo.photoType}/${photo.fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('cleaning-photos')
      .upload(filePath, compressedFile, {
        contentType: photo.mimeType,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Save metadata to database
    const { error: dbError } = await supabase
      .from('cleaning_photos')
      .insert({
        booking_id: photo.bookingId,
        file_path: filePath,
        photo_type: photo.photoType,
        cleaner_id: 0, // Will be set by trigger or RLS
        customer_id: 0, // Will be set by trigger
        booking_date: new Date().toISOString(),
        postcode: '', // Will be populated from booking
      });

    if (dbError) throw dbError;

    // Success - remove from queue and delete local file
    await removeFromQueue(photo.id);
    await deleteLocalPhoto(photo.localPath);

    console.log(`Successfully uploaded ${photo.fileName}`);
  } catch (error: any) {
    console.error(`Failed to upload ${photo.fileName}:`, error);
    await updatePhotoStatus(
      photo.id,
      'failed',
      error.message || 'Upload failed'
    );
  }
}

/**
 * Get current sync status
 */
export function isSyncInProgress(): boolean {
  return isSyncing;
}
