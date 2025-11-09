import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

interface FilePickerOptions {
  multiple?: boolean;
  accept?: string;
}

interface PickedFile {
  name: string;
  blob: Blob;
  type: string;
  size: number;
}

/**
 * Native file picker for Capacitor Android
 * Uses Android's native file picker via a custom implementation
 */
export async function pickFilesNative(options: FilePickerOptions = {}): Promise<File[]> {
  const { multiple = true, accept = '*/*' } = options;

  // Only works on native platforms
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Native file picker only works on native platforms');
  }

  try {
    console.log('📱 Using native file picker', { platform: Capacitor.getPlatform(), accept, multiple });

    // For now, we'll use a hybrid approach:
    // Create a hidden input element that triggers Android's native picker
    return new Promise<File[]>((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.multiple = multiple;
      input.style.display = 'none';
      
      // Set capture attribute for camera on mobile
      if (accept.includes('image')) {
        input.setAttribute('capture', 'environment');
      }

      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        const files = target.files;
        
        if (!files || files.length === 0) {
          reject(new Error('No files selected'));
          document.body.removeChild(input);
          return;
        }

        // Convert FileList to File array with stability improvements
        const fileArray: File[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          try {
            // Create stable blob from file
            const buffer = await file.arrayBuffer();
            const stableFile = new File([buffer], file.name, { 
              type: file.type || 'application/octet-stream' 
            });
            fileArray.push(stableFile);
          } catch (err) {
            console.warn(`Failed to stabilize file ${file.name}`, err);
            fileArray.push(file); // Use original if stabilization fails
          }
        }

        console.log(`📱 Native picker returned ${fileArray.length} files`);
        resolve(fileArray);
        document.body.removeChild(input);
      };

      input.onerror = () => {
        reject(new Error('File picker error'));
        document.body.removeChild(input);
      };

      input.oncancel = () => {
        reject(new Error('File picker cancelled'));
        document.body.removeChild(input);
      };

      document.body.appendChild(input);
      
      // Trigger with delay to ensure proper rendering
      setTimeout(() => {
        input.click();
      }, 100);
    });
  } catch (error) {
    console.error('Native file picker error:', error);
    throw error;
  }
}
