import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 2,                // максимум 2MB след компресия
    maxWidthOrHeight: 1920,      // максимална резолюция 1920px
    useWebWorker: true,          // използва web worker за performance
    initialQuality: 0.8,         // качество 80%
  };
  
  try {
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed ${file.name} from ${(file.size/1024/1024).toFixed(2)}MB to ${(compressedFile.size/1024/1024).toFixed(2)}MB`);
    return compressedFile;
  } catch (error) {
    console.error('Compression failed:', error);
    return file; // връща оригинала при грешка
  }
};
