import { Filesystem, Directory } from '@capacitor/filesystem';
import { isCapacitor } from './capacitor';

export interface LocalPhoto {
  id: string;
  localPath: string;
  fileName: string;
  bookingId: number;
  photoType: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

const PHOTO_DIR = 'cleaning-photos';

/**
 * Initialize photo storage directory
 */
export async function initPhotoStorage() {
  if (!isCapacitor()) return;
  
  try {
    await Filesystem.mkdir({
      path: PHOTO_DIR,
      directory: Directory.Data,
      recursive: true,
    });
  } catch (error) {
    // Directory might already exist, that's okay
    console.log('Photo directory already exists or created');
  }
}

/**
 * Save photo to local device storage
 */
export async function savePhotoLocally(
  file: File,
  bookingId: number,
  photoType: string
): Promise<LocalPhoto> {
  if (!isCapacitor()) {
    throw new Error('Local storage only available on native platform');
  }

  const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const fileName = `${photoType}_${bookingId}_${id}.${file.name.split('.').pop()}`;
  const path = `${PHOTO_DIR}/${fileName}`;

  // Convert file to base64
  const base64 = await fileToBase64(file);

  // Save to filesystem
  await Filesystem.writeFile({
    path,
    data: base64,
    directory: Directory.Data,
  });

  const localPhoto: LocalPhoto = {
    id,
    localPath: path,
    fileName,
    bookingId,
    photoType,
    mimeType: file.type,
    size: file.size,
    createdAt: new Date().toISOString(),
  };

  return localPhoto;
}

/**
 * Read photo from local storage
 */
export async function readLocalPhoto(localPath: string): Promise<string> {
  if (!isCapacitor()) {
    throw new Error('Local storage only available on native platform');
  }

  const result = await Filesystem.readFile({
    path: localPath,
    directory: Directory.Data,
  });

  return `data:image/jpeg;base64,${result.data}`;
}

/**
 * Delete photo from local storage
 */
export async function deleteLocalPhoto(localPath: string): Promise<void> {
  if (!isCapacitor()) return;

  try {
    await Filesystem.deleteFile({
      path: localPath,
      directory: Directory.Data,
    });
  } catch (error) {
    console.error('Failed to delete local photo:', error);
  }
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert base64 to File object
 */
export function base64ToFile(base64: string, fileName: string, mimeType: string): File {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  const blob = new Blob([ab], { type: mimeType });
  return new File([blob], fileName, { type: mimeType });
}
