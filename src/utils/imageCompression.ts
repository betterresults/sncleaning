import imageCompression from 'browser-image-compression';

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  initialQuality?: number;
}

export const compressImage = async (
  file: File, 
  customOptions?: CompressionOptions
): Promise<File> => {
  const options = {
    maxSizeMB: customOptions?.maxSizeMB ?? 0.8,
    maxWidthOrHeight: customOptions?.maxWidthOrHeight ?? 1600,
    useWebWorker: true,
    initialQuality: customOptions?.initialQuality ?? 0.70,
  };
  
  try {
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed ${file.name} from ${(file.size/1024/1024).toFixed(2)}MB to ${(compressedFile.size/1024/1024).toFixed(2)}MB`);
    return compressedFile;
  } catch (error) {
    console.error('Compression failed:', error);
    return file;
  }
};
