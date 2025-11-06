import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Camera, AlertTriangle, Trash2, Eye, Download, Link2 } from 'lucide-react';
import { compressImage } from '@/utils/imageCompression';

interface PhotoManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: number;
    customer: number;
    cleaner: number;
    postcode: string;
    date_time: string;
    first_name?: string;
    last_name?: string;
  };
}

interface CleaningPhoto {
  id: string;
  file_path: string;
  photo_type: string;
  caption: string | null;
  damage_details: string | null;
  created_at: string;
}

const PhotoItem = ({ photo }: { photo: CleaningPhoto }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loadingImage, setLoadingImage] = useState(true);

  const getSignedUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('cleaning.photos')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  };

  const handleViewPhoto = async (filePath: string) => {
    const signedUrl = await getSignedUrl(filePath);
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    }
  };

  const handleDownloadPhoto = async (filePath: string, fileName: string) => {
    const signedUrl = await getSignedUrl(filePath);
    if (signedUrl) {
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    getSignedUrl(photo.file_path).then(url => {
      if (url) {
        setImageUrl(url);
      }
      setLoadingImage(false);
    });
  }, [photo.file_path]);

  return (
    <div className="relative group border rounded-lg overflow-hidden">
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        {loadingImage ? (
          <Camera className="h-8 w-8 text-gray-400 animate-pulse" />
        ) : imageUrl ? (
          photo.file_path.toLowerCase().endsWith('.pdf') ? (
            <div className="w-full h-full bg-red-50 border-2 border-red-200 flex flex-col items-center justify-center">
              <svg className="h-8 w-8 text-red-600 mb-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-red-600 text-center px-1">PDF</p>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={`${photo.photo_type} photo`}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <Camera className="h-8 w-8 text-gray-400" />
        )}
      </div>
      <div className="p-2">
        <p className="text-xs text-gray-500 truncate">
          {photo.file_path.split('/').pop()}
        </p>
        <p className="text-xs text-gray-400">
          {new Date(photo.created_at).toLocaleDateString()}
        </p>
        {photo.damage_details && (
          <p className="text-xs text-orange-600 mt-1 truncate" title={photo.damage_details}>
            {photo.damage_details}
          </p>
        )}
      </div>
      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const isPDF = photo.file_path.toLowerCase().endsWith('.pdf');
            if (isPDF) {
              handleViewPhoto(photo.file_path);
            } else {
              handleViewPhoto(photo.file_path);
            }
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleDownloadPhoto(photo.file_path, photo.file_path.split('/').pop() || 'photo')}
        >
          <Download className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Photo</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this photo? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  // Call parent delete function - we'll need to pass this down
                  const event = new CustomEvent('deletePhoto', { 
                    detail: { id: photo.id, filePath: photo.file_path } 
                  });
                  window.dispatchEvent(event);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

const PhotoManagementDialog = ({ open, onOpenChange, booking }: PhotoManagementDialogProps) => {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const [photos, setPhotos] = useState<CleaningPhoto[]>([]);
const [loading, setLoading] = useState(false);
const [uploading, setUploading] = useState(false);
const [beforeFiles, setBeforeFiles] = useState<File[]>([]);
const [afterFiles, setAfterFiles] = useState<File[]>([]);
const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
const [additionalDetails, setAdditionalDetails] = useState('');
const [showAdditionalTab, setShowAdditionalTab] = useState(false);
// Upload progress tracking
const [uploadedCount, setUploadedCount] = useState(0);
const [totalToUpload, setTotalToUpload] = useState(0);

// Device detection
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const deviceMemory = (navigator as any).deviceMemory || 'unknown';

  const bookingDate = new Date(booking.date_time).toISOString().split('T')[0];
  const safePostcode = booking.postcode?.toString().replace(/[\s\u00A0]+/g, '').toUpperCase() || 'NA';
  const folderPath = `${booking.id}_${safePostcode}_${bookingDate}_${booking.customer}`;

  const fetchPhotos = async () => {
    if (!open) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cleaning_photos')
        .select('*')
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const dbPhotos = data || [];

      // Also scan storage for 'additional' files that might be missing DB rows
      const baseFolder = dbPhotos[0]?.file_path?.split('/')[0] || folderPath;
      const additionalPrefix = `${baseFolder}/additional`;

      const { data: storageAdditional, error: listErr } = await supabase.storage
        .from('cleaning.photos')
        .list(additionalPrefix, { limit: 200, sortBy: { column: 'name', order: 'asc' } });

      const dbPaths = new Set(dbPhotos.map(p => p.file_path));
      const orphans = (storageAdditional || [])
        .filter(f => f.name && /(jpg|jpeg|png|gif|webp|pdf)$/i.test(f.name))
        .map(f => ({
          id: `orphan:${additionalPrefix}/${f.name}`,
          file_path: `${additionalPrefix}/${f.name}`,
          photo_type: 'additional',
          caption: null,
          damage_details: null,
          created_at: new Date().toISOString(),
        }))
        .filter(p => !dbPaths.has(p.file_path));

      setPhotos([...dbPhotos, ...orphans]);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to load photos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getSignedUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('cleaning.photos')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  };

const handleFileSelect = (files: FileList | null, type: 'before' | 'after' | 'additional') => {
  console.info(`📥 Selecting files for ${type}...`, { inputCount: files?.length || 0 });
  if (!files) return;

  const all = Array.from(files);
  const accepted: File[] = [];
  const skipped: { name: string; reason: string }[] = [];
  let heicDetected = false;

  for (const file of all) {
    const lower = file.name.toLowerCase();
    const isHeic = /\.(heic|heif)$/i.test(lower);
    const isImageByType = !!file.type && file.type.startsWith('image/');
    const isImageByExt = /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(lower);

    if (type === 'additional') {
      if (file.size <= 10 * 1024 * 1024) {
        accepted.push(file);
      } else {
        skipped.push({ name: file.name, reason: 'Exceeds 10MB' });
      }
      continue;
    }

    if (isHeic) heicDetected = true;

    // Before/After: accept images by MIME or extension (no size limit, will compress on upload)
    if (isImageByType || isImageByExt) {
      accepted.push(file);
    } else {
      skipped.push({ name: file.name, reason: 'Unsupported type' });
    }
  }

  if (heicDetected) {
    console.warn('⚠️ HEIC/HEIF files detected in selection');
    toast({
      title: 'HEIC Files Detected',
      description: 'HEIC may not preview or compress but will upload. JPG is recommended for compatibility.',
    });
  }

  console.info('✅ File selection complete', {
    type,
    inputCount: all.length,
    accepted: accepted.length,
    skipped,
  });

  if (accepted.length === 0) {
    toast({
      title: 'No Compatible Files',
      description: type === 'additional' ? 'All files exceeded 10MB.' : 'Please select image files (JPG, PNG, WebP, HEIC).',
      variant: 'destructive',
    });
    return;
  }

  // Memory warning for large selections on mobile
  if (accepted.length > 30 && isMobile) {
    toast({
      title: 'Large Upload Detected',
      description: `Uploading ${accepted.length} photos may take several minutes on mobile. Please keep this tab active.`,
    });
  }

  let previousCount = 0;
  switch (type) {
    case 'before':
      previousCount = beforeFiles.length;
      setBeforeFiles(prev => [...prev, ...accepted]);
      break;
    case 'after':
      previousCount = afterFiles.length;
      setAfterFiles(prev => [...prev, ...accepted]);
      break;
    case 'additional':
      previousCount = additionalFiles.length;
      setAdditionalFiles(prev => [...prev, ...accepted]);
      break;
  }

  console.info('✅ State updated:', { 
    type, 
    previousCount, 
    addedCount: accepted.length,
    newTotal: previousCount + accepted.length 
  });
};

  const removeFile = (index: number, type: 'before' | 'after' | 'additional') => {
    switch (type) {
      case 'before':
        setBeforeFiles(prev => prev.filter((_, i) => i !== index));
        break;
      case 'after':
        setAfterFiles(prev => prev.filter((_, i) => i !== index));
        break;
      case 'additional':
        setAdditionalFiles(prev => prev.filter((_, i) => i !== index));
        break;
    }
  };

const uploadFiles = async (files: File[], photoType: 'before' | 'after' | 'additional') => {
  const baseFolder = photos[0]?.file_path?.split('/')[0] || folderPath;
  const results: string[] = [];
  const errors: string[] = [];
  const CONCURRENCY = isMobile 
    ? Math.min(2, Math.max(1, files.length)) // Max 2 on mobile
    : Math.min(3, Math.max(1, files.length)); // Max 3 on desktop
  let index = 0;

  console.info(`🚀 Starting upload batch:`, { 
    photoType, 
    totalFiles: files.length, 
    concurrency: CONCURRENCY,
    isMobile,
    deviceMemory
  });

  const worker = async () => {
    while (index < files.length) {
      const i = index++;
      const file = files[i];

      const timestamp = Date.now();
      const fileName = `${timestamp}_${i}_${file.name}`;
      const filePath = `${baseFolder}/${photoType}/${fileName}`;

      try {
        const lower = file.name.toLowerCase();
        const isHeic = /\.(heic|heif)$/i.test(lower);
        const isCompressibleImage = !isHeic && ((file.type && file.type.startsWith('image/')) || /\.(jpg|jpeg|png|webp)$/i.test(lower));

        let toUpload: File = file;
        if (isCompressibleImage && !isMobile) {
          // Only compress on desktop
          try {
            console.info(`🗜️ Compressing: ${file.name}`);
            toUpload = await compressImage(file);
          } catch (err) {
            console.warn(`Compression failed for ${file.name}, uploading original.`, err);
            toUpload = file;
          }
        } else if (isMobile) {
          console.info(`📱 Mobile detected: skipping compression for ${file.name}`);
        }

        const { error: uploadError } = await supabase.storage
          .from('cleaning.photos')
          .upload(filePath, toUpload, {
            cacheControl: '3600',
            upsert: true,
            contentType: toUpload.type || file.type || 'application/octet-stream',
          });

        if (uploadError) throw new Error(uploadError.message);

        const { error: dbError } = await supabase
          .from('cleaning_photos')
          .insert({
            booking_id: booking.id,
            customer_id: booking.customer,
            cleaner_id: booking.cleaner,
            file_path: filePath,
            photo_type: photoType,
            postcode: booking.postcode,
            booking_date: bookingDate,
            damage_details: photoType === 'additional' ? additionalDetails : null,
          });

        if (dbError) throw new Error(dbError.message);

        results.push(filePath);
        setUploadedCount((c) => c + 1);
        console.info(`✅ Uploaded ${file.name} -> ${filePath}`);
      } catch (e: any) {
        const msg = e?.message || 'Unknown error';
        errors.push(`${file.name}: ${msg}`);
        console.error(`❌ Upload failed for ${file.name}: ${msg}`);
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  if (errors.length) {
    throw new Error(`Some files failed: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '…' : ''}`);
  }
  return results;
};

  const handleUpload = async () => {
    if (!beforeFiles.length && !afterFiles.length && !additionalFiles.length) {
      toast({
        title: 'No Files Selected',
        description: 'Please select at least one photo to upload.',
        variant: 'destructive'
      });
      return;
    }

const total = beforeFiles.length + afterFiles.length + additionalFiles.length;
setTotalToUpload(total);
setUploadedCount(0);
setUploading(true);

    try {
      const uploadPromises = [];

      if (beforeFiles.length > 0) {
        uploadPromises.push(uploadFiles(beforeFiles, 'before'));
      }

      if (afterFiles.length > 0) {
        uploadPromises.push(uploadFiles(afterFiles, 'after'));
      }

      if (additionalFiles.length > 0) {
        uploadPromises.push(uploadFiles(additionalFiles, 'additional'));
      }

      await Promise.all(uploadPromises);

      toast({
        title: 'Files Uploaded Successfully',
        description: `Uploaded ${beforeFiles.length + afterFiles.length + additionalFiles.length} file${beforeFiles.length + afterFiles.length + additionalFiles.length === 1 ? '' : 's'}.`
      });

// Reset form
setBeforeFiles([]);
setAfterFiles([]);
setAdditionalFiles([]);
setAdditionalDetails('');
setShowAdditionalTab(false);
setTotalToUpload(0);
setUploadedCount(0);
      
      // Refresh photos
      await fetchPhotos();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload files. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('cleaning.photos')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database if not an orphaned storage-only file
      const isOrphan = typeof photoId === 'string' && photoId.startsWith('orphan:');
      if (!isOrphan) {
        const { error: dbError } = await supabase
          .from('cleaning_photos')
          .delete()
          .eq('id', photoId);
        if (dbError) throw dbError;
      }

      toast({
        title: 'Photo Deleted',
        description: 'Photo has been successfully deleted.'
      });

      // Refresh photos
      await fetchPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete photo.',
        variant: 'destructive'
      });
    }
  };

  const handleViewPhoto = async (filePath: string) => {
    const signedUrl = await getSignedUrl(filePath);
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    } else {
      toast({
        title: 'Error',
        description: 'Unable to load photo.',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadPhoto = async (filePath: string, fileName: string) => {
    const signedUrl = await getSignedUrl(filePath);
    if (signedUrl) {
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast({
        title: 'Error',
        description: 'Unable to download photo.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (open) {
      fetchPhotos();
    }

    // Add event listener for photo deletion
    const handleDeleteEvent = (event: CustomEvent) => {
      const { id, filePath } = event.detail;
      handleDeletePhoto(id, filePath);
    };

    window.addEventListener('deletePhoto', handleDeleteEvent as EventListener);

    return () => {
      window.removeEventListener('deletePhoto', handleDeleteEvent as EventListener);
    };
  }, [open, booking.id]);

  const FileUploadArea = ({ type, files, onFileSelect, onRemove }: {
    type: 'before' | 'after' | 'additional';
    files: File[];
    onFileSelect: (files: FileList | null) => void;
    onRemove: (index: number) => void;
  }) => {
    const showThumbnails = !isMobile || files.length <= 10;
    
    return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-gray-300 transition-colors">
        <input
          type="file"
          accept={type === 'additional' ? '*/*' : 'image/*'}
          multiple
          onChange={(e) => { 
            const input = e.target as HTMLInputElement; 
            const fl = input.files; 
            console.info(`📱 Device:`, { isMobile, memory: deviceMemory, userAgent: navigator.userAgent });
            console.info(`📥 Input change (${type}):`, { 
              filesLength: fl?.length || 0,
              filesNull: fl === null,
              filesEmpty: fl?.length === 0,
              timestamp: new Date().toISOString()
            });
            if (fl && fl.length > 0) {
              const sizes = Array.from(fl).slice(0, 3).map(f => `${f.name}: ${(f.size/1024/1024).toFixed(1)}MB`);
              console.info('📸 First 3 files:', sizes);
            }
            onFileSelect(fl); 
            input.value = ''; 
          }}
          className="hidden"
          id={`file-${type}`}
        />
        <label htmlFor={`file-${type}`} className="cursor-pointer">
          <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">
            Click to select {type} {type === 'additional' ? 'files' : 'photos'} or drag and drop
          </p>
<p className="text-xs text-gray-400 mt-1">
  {type === 'additional' ? 'Any file type up to 10MB each' : 'JPG, PNG, WebP, HEIC (large files will be compressed)'}
</p>
        </label>
      </div>

        {files.length > 0 && (
          <>
            <p className="text-sm font-medium">
              {files.length} file{files.length === 1 ? '' : 's'} selected
              {files.length > 10 && isMobile && ' (thumbnails hidden to save memory)'}
            </p>
            
            {showThumbnails ? (
          <div className="grid grid-cols-2 gap-2">
            {files.slice(0, 60).map((file, index) => (
              <div key={index} className="relative">
                {file.type === 'application/pdf' ? (
                  <div className="w-full h-24 bg-red-50 border-2 border-red-200 rounded flex flex-col items-center justify-center">
                    <svg className="h-6 w-6 text-red-600 mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <p className="text-[10px] text-red-600 text-center px-1 break-all">{file.name}</p>
                  </div>
                ) : file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`${type} photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                ) : (
                  <div className="w-full h-24 bg-gray-50 border-2 border-gray-200 rounded flex flex-col items-center justify-center">
                    <svg className="h-6 w-6 text-gray-600 mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-[10px] text-gray-600 text-center px-1 break-all">{file.name}</p>
                    <p className="text-[10px] text-gray-400">{(file.size / 1024 / 1024).toFixed(1)}MB</p>
                  </div>
                )}
                <button
                  onClick={() => onRemove(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="text-gray-400 mx-2">{(file.size/1024/1024).toFixed(1)}MB</span>
                    <button onClick={() => onRemove(index)} className="text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
    </div>
    );
  };

  const groupedPhotos = photos.reduce((acc, photo) => {
    if (!acc[photo.photo_type]) {
      acc[photo.photo_type] = [];
    }
    acc[photo.photo_type].push(photo);
    return acc;
  }, {} as Record<string, CleaningPhoto[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photo Management - Booking #{booking.id}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {booking.first_name} {booking.last_name} - {booking.postcode} ({bookingDate})
          </p>
          {userRole === 'admin' && photos.length > 0 && (
            <Button
              onClick={() => {
                const existingFolder = photos[0]?.file_path?.split('/')[0] || folderPath;
                const encodedFolderPath = encodeURIComponent(existingFolder);
                const photoLink = `https://account.sncleaningservices.co.uk/photos/${encodedFolderPath}`;
                navigator.clipboard.writeText(photoLink).then(() => {
                  toast({
                    title: 'Link Copied',
                    description: 'Photo viewing link has been copied to clipboard',
                  });
                }).catch(() => {
                  toast({
                    title: 'Copy Failed',
                    description: 'Failed to copy link to clipboard',
                    variant: 'destructive'
                  });
                });
              }}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Copy Link for Client
            </Button>
          )}
        </DialogHeader>

        <Tabs defaultValue="existing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Existing Photos ({photos.length})</TabsTrigger>
            <TabsTrigger value="upload">Upload New Photos</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading photos...</div>
            ) : photos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No photos found for this booking.
              </div>
            ) : (
                  <div className="space-y-6">
                {Object.entries(groupedPhotos).map(([type, typePhotos]) => (
                  <div key={type} className="space-y-2">
                    <h3 className="font-semibold capitalize text-lg">{type} Photos ({typePhotos.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {typePhotos.map((photo) => (
                        <PhotoItem key={photo.id} photo={photo} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <Tabs defaultValue="before" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="before">Before Photos</TabsTrigger>
                <TabsTrigger value="after">After Photos</TabsTrigger>
                <TabsTrigger 
                  value="additional" 
                  className={showAdditionalTab ? "text-orange-600" : ""}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Additional Info
                </TabsTrigger>
              </TabsList>

              <TabsContent value="before" className="space-y-4">
                <FileUploadArea
                  type="before"
                  files={beforeFiles}
                  onFileSelect={(files) => handleFileSelect(files, 'before')}
                  onRemove={(index) => removeFile(index, 'before')}
                />
              </TabsContent>

              <TabsContent value="after" className="space-y-4">
                <FileUploadArea
                  type="after"
                  files={afterFiles}
                  onFileSelect={(files) => handleFileSelect(files, 'after')}
                  onRemove={(index) => removeFile(index, 'after')}
                />
              </TabsContent>

              <TabsContent value="additional" className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <h4 className="font-medium text-orange-800">Additional Information</h4>
                  </div>
                  <p className="text-sm text-orange-700">
                    Use this section to report damage, missing items, or any other additional information.
                  </p>
                </div>

                {!showAdditionalTab ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowAdditionalTab(true)}
                    className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Add Additional Information
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="additional-details">Additional Details *</Label>
                      <Textarea
                        id="additional-details"
                        placeholder="Describe any damage, missing items, or other important information..."
                        value={additionalDetails}
                        onChange={(e) => setAdditionalDetails(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <FileUploadArea
                      type="additional"
                      files={additionalFiles}
                      onFileSelect={(files) => handleFileSelect(files, 'additional')}
                      onRemove={(index) => removeFile(index, 'additional')}
                    />

                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowAdditionalTab(false);
                        setAdditionalFiles([]);
                        setAdditionalDetails('');
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Cancel Additional Info
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
<Button onClick={handleUpload} disabled={uploading}>
  {uploading ? `Uploading... ${uploadedCount}/${totalToUpload}` : 'Upload Files'}
</Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoManagementDialog;