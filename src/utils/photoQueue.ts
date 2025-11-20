import { Preferences } from '@capacitor/preferences';
import { LocalPhoto } from './photoStorage';

export type UploadStatus = 'pending' | 'uploading' | 'uploaded' | 'failed';

export interface QueuedPhoto extends LocalPhoto {
  status: UploadStatus;
  retryCount: number;
  lastAttempt?: string;
  errorMessage?: string;
  remoteUrl?: string;
}

const QUEUE_KEY = 'photo_upload_queue';
const MAX_RETRIES = 10;

/**
 * Get all queued photos
 */
export async function getPhotoQueue(): Promise<QueuedPhoto[]> {
  const { value } = await Preferences.get({ key: QUEUE_KEY });
  if (!value) return [];
  
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('Failed to parse photo queue:', error);
    return [];
  }
}

/**
 * Save photo queue
 */
async function saveQueue(queue: QueuedPhoto[]): Promise<void> {
  await Preferences.set({
    key: QUEUE_KEY,
    value: JSON.stringify(queue),
  });
}

/**
 * Add photo to upload queue
 */
export async function addToQueue(photo: LocalPhoto): Promise<void> {
  const queue = await getPhotoQueue();
  
  const queuedPhoto: QueuedPhoto = {
    ...photo,
    status: 'pending',
    retryCount: 0,
  };
  
  queue.push(queuedPhoto);
  await saveQueue(queue);
}

/**
 * Get pending photos (ready to upload)
 */
export async function getPendingPhotos(): Promise<QueuedPhoto[]> {
  const queue = await getPhotoQueue();
  return queue.filter(
    photo => 
      (photo.status === 'pending' || photo.status === 'failed') && 
      photo.retryCount < MAX_RETRIES
  );
}

/**
 * Update photo status in queue
 */
export async function updatePhotoStatus(
  photoId: string,
  status: UploadStatus,
  errorMessage?: string,
  remoteUrl?: string
): Promise<void> {
  const queue = await getPhotoQueue();
  const photoIndex = queue.findIndex(p => p.id === photoId);
  
  if (photoIndex === -1) return;
  
  queue[photoIndex].status = status;
  queue[photoIndex].lastAttempt = new Date().toISOString();
  
  if (errorMessage) {
    queue[photoIndex].errorMessage = errorMessage;
  }
  
  if (remoteUrl) {
    queue[photoIndex].remoteUrl = remoteUrl;
  }
  
  if (status === 'failed') {
    queue[photoIndex].retryCount++;
  }
  
  await saveQueue(queue);
}

/**
 * Remove photo from queue (after successful upload)
 */
export async function removeFromQueue(photoId: string): Promise<void> {
  const queue = await getPhotoQueue();
  const filteredQueue = queue.filter(p => p.id !== photoId);
  await saveQueue(filteredQueue);
}

/**
 * Get upload statistics
 */
export async function getUploadStats(): Promise<{
  pending: number;
  uploading: number;
  failed: number;
  total: number;
}> {
  const queue = await getPhotoQueue();
  
  return {
    pending: queue.filter(p => p.status === 'pending').length,
    uploading: queue.filter(p => p.status === 'uploading').length,
    failed: queue.filter(p => p.status === 'failed' && p.retryCount >= MAX_RETRIES).length,
    total: queue.filter(p => p.status !== 'uploaded').length,
  };
}

/**
 * Clear entire queue (use with caution)
 */
export async function clearQueue(): Promise<void> {
  await Preferences.remove({ key: QUEUE_KEY });
}

/**
 * Get photos for specific booking
 */
export async function getBookingPhotos(bookingId: number): Promise<QueuedPhoto[]> {
  const queue = await getPhotoQueue();
  return queue.filter(p => p.bookingId === bookingId);
}
