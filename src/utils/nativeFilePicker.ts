import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

interface FilePickerOptions {
  multiple?: boolean;
  accept?: string;
}

/**
 * Native photo picker for Capacitor using Camera API
 * Properly requests permissions on Android/iOS
 */
export async function pickFilesNative(options: FilePickerOptions = {}): Promise<File[]> {
  const { multiple = true } = options;

  // Only works on native platforms
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Native file picker only works on native platforms');
  }

  try {
    console.log('📱 Using Capacitor Camera API', { 
      platform: Capacitor.getPlatform(), 
      multiple 
    });

    // Pick photos from gallery (this will request permissions automatically)
    const photos = await Camera.pickImages({
      quality: 90,
      limit: multiple ? 0 : 1, // 0 = unlimited on Android
    });

    console.log(`📱 Camera API returned ${photos.photos.length} photos`);

    // Convert photos to File objects
    const files: File[] = [];
    
    for (const photo of photos.photos) {
      try {
        // Fetch the photo data
        const response = await fetch(photo.webPath!);
        const blob = await response.blob();
        
        // Generate filename
        const timestamp = Date.now();
        const extension = photo.format || 'jpg';
        const filename = `photo_${timestamp}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
        
        // Create File object
        const file = new File([blob], filename, { 
          type: `image/${extension}` 
        });
        
        files.push(file);
        console.log(`✅ Converted photo to file: ${filename} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      } catch (err) {
        console.error('Failed to convert photo:', err);
      }
    }

    return files;
  } catch (error: any) {
    console.error('Camera API error:', error);
    
    // Handle permission denied
    if (error.message?.includes('permission') || error.message?.includes('denied')) {
      throw new Error('Photo access permission denied. Please enable photo access in your device settings.');
    }
    
    throw error;
  }
}
