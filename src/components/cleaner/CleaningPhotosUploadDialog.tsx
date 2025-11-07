
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Camera, AlertTriangle, ChevronDown, ChevronUp, Image as ImageIcon, Trash2, CheckCircle2, ZoomIn } from 'lucide-react';
import { compressImage } from '@/utils/imageCompression';

interface CleaningPhotosUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: number;
    customer: number;
    cleaner: number;
    postcode: string;
    date_time: string;
    address: string;
  };
}

const INITIAL_PREVIEW_COUNT = 60; // Show first 60 thumbnails by default
const LOW_MEMORY_THRESHOLD = 40; // Switch to low-memory mode for >40 files on iOS
const DIRECT_UPLOAD_BATCH = 10; // Upload 10 files at once

const CleaningPhotosUploadDialog = ({ open, onOpenChange, booking }: CleaningPhotosUploadDialogProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [autoUploading, setAutoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadStep, setUploadStep] = useState('');
  const [beforeFiles, setBeforeFiles] = useState<File[]>([]);
  const [afterFiles, setAfterFiles] = useState<File[]>([]);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [showAdditionalTab, setShowAdditionalTab] = useState(false);
  const [showAllPreviews, setShowAllPreviews] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFilesToUpload, setTotalFilesToUpload] = useState(0);
  const [existingPhotos, setExistingPhotos] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [showExistingPhotos, setShowExistingPhotos] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [showDeleteAnimation, setShowDeleteAnimation] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const bookingDate = new Date(booking.date_time).toISOString().split('T')[0];
  const safePostcode = booking.postcode?.toString().replace(/\s+/g, '').toUpperCase() || 'NA';
  const folderPath = `${booking.id}_${safePostcode}_${bookingDate}_${booking.customer}`;

  // Device detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;
  const totalFiles = beforeFiles.length + afterFiles.length + additionalFiles.length;
  const isLowMemoryMode = isIOS && totalFiles > LOW_MEMORY_THRESHOLD;

  useEffect(() => {
    if (open) {
      fetchExistingPhotos();
    }
  }, [open, booking.id]);

  const fetchExistingPhotos = async () => {
    setLoadingPhotos(true);
    try {
      const { data, error } = await supabase
        .from('cleaning_photos')
        .select('*')
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const photos = data || [];
      setExistingPhotos(photos);
      
      // Pre-fetch all thumbnail URLs
      const urlPromises = photos.map(async (photo) => {
        const { data } = await supabase.storage
          .from('cleaning.photos')
          .createSignedUrl(photo.file_path, 3600, {
            transform: {
              width: 200,
              height: 200,
              resize: 'cover'
            }
          });
        return { id: photo.id, url: data?.signedUrl || '' };
      });
      
      const urlResults = await Promise.all(urlPromises);
      const urlMap = urlResults.reduce((acc, { id, url }) => {
        if (url) acc[id] = url;
        return acc;
      }, {} as Record<string, string>);
      
      setPhotoUrls(urlMap);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const deletePhoto = async (photoId: string, filePath: string) => {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('cleaning_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('cleaning.photos')
        .remove([filePath]);

      if (storageError) console.warn('Storage deletion warning:', storageError);

      // Update local state without triggering re-fetch
      setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
      setPhotoUrls(prev => {
        const updated = { ...prev };
        delete updated[photoId];
        return updated;
      });

      // Show animated checkmark
      setShowDeleteAnimation(true);
      setTimeout(() => setShowDeleteAnimation(false), 1500);

    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete photo",
        variant: "destructive",
      });
    }
  };


  const ExistingPhotoItem = ({ photo }: { photo: any }) => {
    const imageUrl = photoUrls[photo.id];

    return (
      <div className="relative group">
        <div 
          className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setViewingPhoto(photo.file_path)}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={photo.photo_type}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="h-6 w-6 text-gray-400 animate-pulse" />
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deletePhoto(photo.id, photo.file_path);
          }}
          className="absolute top-1 right-1 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:scale-110 transition-transform"
          title="Delete photo"
        >
          <Trash2 className="h-3 w-3" />
        </button>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {new Date(photo.created_at).toLocaleDateString()}
        </p>
      </div>
    );
  };

  const PhotoViewer = ({ filePath, onClose }: { filePath: string; onClose: () => void }) => {
    const [fullImageUrl, setFullImageUrl] = useState<string>('');

    useEffect(() => {
      const loadFullImage = async () => {
        const { data } = await supabase.storage
          .from('cleaning.photos')
          .createSignedUrl(filePath, 3600);
        if (data?.signedUrl) setFullImageUrl(data.signedUrl);
      };
      loadFullImage();
    }, [filePath]);

    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
      <div 
        className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 animate-fade-in"
        onClick={onClose}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 p-3 sm:p-4 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-50 backdrop-blur-sm"
          title="Close (or press Escape)"
        >
          <X className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2.5} />
        </button>
        
        <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
          {fullImageUrl ? (
            <img
              src={fullImageUrl}
              alt="Full size"
              className="max-w-full max-h-full object-contain rounded-lg animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center justify-center">
              <Camera className="h-12 w-12 text-white/50 animate-pulse" />
            </div>
          )}
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
          <p className="text-white text-sm flex items-center gap-2">
            <ZoomIn className="h-4 w-4" />
            Tap outside or press X to close
          </p>
        </div>
      </div>
    );
  };

  const handleFileSelect = async (files: FileList | null, type: 'before' | 'after' | 'additional') => {
    console.info('🎬 File selection started', {
      type,
      filesCount: files?.length || 0,
      device: isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop',
      userAgent: navigator.userAgent,
      availableMemory: (navigator as any).deviceMemory || 'unknown',
      firstThreeSizes: Array.from(files || []).slice(0, 3).map(f => ({
        name: f.name,
        sizeMB: (f.size / 1024 / 1024).toFixed(2),
        type: f.type || 'unknown'
      }))
    });

    if (!files || files.length === 0) {
      console.warn('⚠️ No files returned from file input', { filesNull: files === null, filesLength: files?.length });
      toast({ 
        title: 'No Files Selected', 
        description: 'Your device did not return any files. Try selecting fewer files or restart the app.',
        variant: 'destructive' 
      });
      return;
    }

    const fileArray = Array.from(files);
    
    // Calculate total size of selection
    const totalMB = fileArray.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);
    console.info(`🧮 Total selected size: ${totalMB.toFixed(2)}MB across ${fileArray.length} files`);
    
    const accepted: File[] = [];
    const skipped: { name: string; reason: string }[] = [];

    console.info(`📋 Processing ${fileArray.length} files...`);

    let heicDetected = false;
    for (const file of fileArray) {
      const lowerName = file.name.toLowerCase();
      const isImageByType = !!file.type && file.type.startsWith('image/');
      const isImageByExt = /\.(heic|heif|jpg|jpeg|png|webp)$/i.test(lowerName);
      const isHeic = /\.(heic|heif)$/i.test(lowerName);
      if (isHeic) {
        heicDetected = true;
      }

      // Accept all file types for all tabs; compression will handle images, backend enforces limits
      accepted.push(file);
      console.info(`✅ Accepted ${type} file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB, ${file.type || 'unknown type'})`);
    }

    if (heicDetected) {
      console.warn('⚠️ HEIC/HEIF files detected in selection');
      toast({
        title: 'HEIC Files Detected',
        description: 'HEIC may not preview or compress but will upload. JPG is recommended for compatibility.',
        variant: 'default'
      });
    }

    console.info(`✅ File selection complete`, {
      accepted: accepted.length,
      skipped: skipped.length,
      totalSize: `${(accepted.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)}MB`
    });

    if (skipped.length > 0) {
      const allowed = type === 'additional' ? 'files (large images will be compressed)' : 'images only';
      console.warn('⚠️ Files skipped', skipped);
      toast({ 
        title: 'Some Files Skipped', 
        description: `${skipped.length} file(s) were skipped. Only ${allowed} are allowed.`, 
        variant: 'destructive' 
      });
    }

    if (accepted.length === 0) {
      console.warn('❌ No compatible files accepted from selection');
      toast({
        title: 'No Compatible Files',
        description: 'Please select image files (JPG, PNG, WebP, HEIC) or other supported files.',
        variant: 'destructive'
      });
      return;
    }

    // Show immediate feedback
    toast({ 
      title: 'Auto-uploading...', 
      description: `Starting upload of ${accepted.length} ${type} file${accepted.length === 1 ? '' : 's'}...` 
    });

    // Auto-show debug on mobile if many files selected
    if (isMobile && accepted.length > 30) {
      setShowDebug(true);
    }

    // Trigger auto-upload immediately
    await handleAutoUpload(accepted, type);
  };

  const removeFile = (index: number, type: 'before' | 'after' | 'additional') => {
    console.info(`🗑️ Removing file at index ${index} from ${type}`);
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

  // Auto-upload handler - uploads immediately when files are selected
  const handleAutoUpload = async (files: File[], type: 'before' | 'after' | 'additional') => {
    console.log(`🚀 Auto-upload triggered for ${files.length} ${type} files`);

    // Verify authentication
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      toast({
        title: 'Not Signed In',
        description: 'Please sign in again and retry.',
        variant: 'destructive'
      });
      // Keep files in state for manual retry
      switch (type) {
        case 'before': setBeforeFiles(files); break;
        case 'after': setAfterFiles(files); break;
        case 'additional': setAdditionalFiles(files); break;
      }
      return;
    }

    setAutoUploading(true);
    setUploading(true);
    setUploadStep(`Auto-uploading ${type} photos...`);
    setUploadProgress('Starting...');
    setTotalFilesToUpload(files.length);
    setCurrentFileIndex(0);
    const startTime = Date.now();

    try {
      // Upload files directly
      const { uploadedPaths, failCount, errors } = await uploadFilesDirectly(files, type);

      // Call edge function for background processing
      if (uploadedPaths.length > 0) {
        setUploadStep('Starting background processing...');
        try {
          await supabase.functions.invoke('process-cleaning-photos', {
            body: {
              filePaths: uploadedPaths,
              bookingId: booking.id,
              photoType: type,
              customerId: booking.customer,
              cleanerId: booking.cleaner,
              postcode: booking.postcode,
              bookingDate: bookingDate
            }
          });
          console.log(`✓ Started background processing for ${uploadedPaths.length} ${type} photos`);
        } catch (processError) {
          console.error(`Failed to start background processing for ${type}:`, processError);
        }

        // Update booking status
        await supabase.from('bookings').update({ has_photos: true }).eq('id', booking.id);
        try {
          await supabase.from('past_bookings').update({ has_photos: true }).eq('id', booking.id);
        } catch (e) {
          console.warn('Past booking update skipped:', e);
        }
      }

      const uploadTime = ((Date.now() - startTime) / 1000).toFixed(1);

      // Show result toast
      if (failCount > 0) {
        const errorSummary = errors.slice(0, 2).join('; ');
        const moreErrors = errors.length > 2 ? ` +${errors.length - 2} more` : '';
        console.error('Upload failures:', errors);
        
        toast({
          title: "Upload Partially Complete",
          description: `${uploadedPaths.length} uploaded, ${failCount} failed. ${errorSummary}${moreErrors}`,
          variant: "destructive",
        });

        // Keep failed files in state for retry
        switch (type) {
          case 'before': setBeforeFiles(files); break;
          case 'after': setAfterFiles(files); break;
          case 'additional': setAdditionalFiles(files); break;
        }
      } else {
        toast({
          title: "Auto-Upload Complete!",
          description: `${uploadedPaths.length} ${type} photos uploaded in ${uploadTime}s`,
        });
      }

      console.log(`✅ Auto-upload complete in ${uploadTime}s. ${uploadedPaths.length} uploaded, ${failCount} failed`);

      // Refresh existing photos
      fetchExistingPhotos();

    } catch (error) {
      console.error('Auto-upload error:', error);
      toast({
        title: "Auto-Upload Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      
      // Keep files in state for manual retry
      switch (type) {
        case 'before': setBeforeFiles(files); break;
        case 'after': setAfterFiles(files); break;
        case 'additional': setAdditionalFiles(files); break;
      }
    } finally {
      setAutoUploading(false);
      setUploading(false);
      setUploadProgress('');
      setUploadStep('');
      setCurrentFileIndex(0);
      setTotalFilesToUpload(0);
    }
  };

  // Direct upload (no compression, no retry - backend handles it)
  const uploadFilesDirectly = async (
    files: File[],
    photoType: 'before' | 'after' | 'additional'
  ): Promise<{ uploadedPaths: string[]; failCount: number; errors: string[] }> => {
    const uploadedPaths: string[] = [];
    let failCount = 0;
    const errors: string[] = [];

    console.log(`📤 Starting direct upload of ${files.length} files (Type: ${photoType})`);
    
    // Check if files are still accessible (mobile browsers may revoke access)
    try {
      const testFile = files[0];
      if (testFile) {
        const testSlice = testFile.slice(0, 1);
        await testSlice.arrayBuffer();
        console.log('✅ File access check passed');
      }
    } catch (accessError) {
      console.error('❌ Files no longer accessible:', accessError);
      errors.push('Files no longer accessible. Please re-select photos and upload immediately.');
      return { uploadedPaths: [], failCount: files.length, errors };
    }
    
    // Upload in batches
    for (let i = 0; i < files.length; i += DIRECT_UPLOAD_BATCH) {
      const batch = files.slice(i, i + DIRECT_UPLOAD_BATCH);
      const batchNum = Math.floor(i / DIRECT_UPLOAD_BATCH) + 1;
      const totalBatches = Math.ceil(files.length / DIRECT_UPLOAD_BATCH);
      
      console.log(`📦 Uploading batch ${batchNum}/${totalBatches} (${batch.length} files)`);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (file, batchIndex) => {
          const fileNum = i + batchIndex + 1;
          const timestamp = Date.now();
          const fileName = `${timestamp}_${fileNum}_${file.name}`;
          const filePath = `${folderPath}/${photoType}/${fileName}`;
          
          // Check file accessibility before processing
          try {
            await file.slice(0, 1).arrayBuffer();
          } catch (accessError) {
            throw new Error(`File "${file.name}" no longer accessible (browser revoked access)`);
          }
          
          // Optional light compression for large images (>3MB)
          let fileToUpload = file;
          const isImage = file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.heic');
          const isLarge = file.size > 3 * 1024 * 1024;
          
          if (isImage && isLarge) {
            console.log(`🗜️  [${fileNum}] Compressing ${file.name} (${(file.size/1024/1024).toFixed(2)}MB)...`);
            try {
              fileToUpload = await compressImage(file, {
                maxSizeMB: 5,
                maxWidthOrHeight: 2560,
                initialQuality: 0.85
              });
              const saved = ((1 - fileToUpload.size / file.size) * 100).toFixed(0);
              console.log(`✅ [${fileNum}] Frontend compression: saved ${saved}%`);
            } catch (compError) {
              console.warn(`⚠️  [${fileNum}] Frontend compression failed, uploading original:`, compError);
              // If compression fails, verify original file is still accessible
              try {
                await file.slice(0, 1).arrayBuffer();
              } catch (accessError) {
                throw new Error(`File "${file.name}" became inaccessible during compression`);
              }
            }
          }
          
          setCurrentFileIndex(fileNum);
          setUploadProgress(`Uploading ${file.name} (${fileNum}/${files.length})`);
          console.log(`⬆️  [${fileNum}/${files.length}] Uploading: ${file.name}`);
          
          try {
            const { error } = await supabase.storage
              .from('cleaning.photos')
              .upload(filePath, fileToUpload, {
                cacheControl: '3600',
                upsert: true
              });

            if (error) {
              throw new Error(`Storage upload failed for "${file.name}": ${error.message}`);
            }
          } catch (uploadError: any) {
            // Provide more context about the failure
            const errorMsg = uploadError.message || 'Unknown upload error';
            if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
              throw new Error(`Network error uploading "${file.name}" (check connection and try again)`);
            }
            throw new Error(`Upload failed for "${file.name}": ${errorMsg}`);
          }
          
          console.log(`✅ [${fileNum}] Upload successful`);
          return { filePath, fileName: file.name };
        })
      );

      // Process batch results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          uploadedPaths.push(result.value.filePath);
        } else {
          failCount++;
          const errorMsg = result.reason?.message || 'Upload failed';
          errors.push(errorMsg);
          console.error(`❌ Upload failed:`, errorMsg);
        }
      }

      // Update progress
      const progress = Math.round(((uploadedPaths.length + failCount) / files.length) * 100);
      setUploadProgress(`Uploaded ${uploadedPaths.length + failCount}/${files.length} (${progress}%)`);
    }

    return { uploadedPaths, failCount, errors };
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

    console.log('🚀 Starting instant upload for', { before: beforeFiles.length, after: afterFiles.length, additional: additionalFiles.length });

    // Verify authentication
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      toast({
        title: 'Not Signed In',
        description: 'Please sign in again and retry.',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setUploadStep('Uploading files...');
    setUploadProgress('Starting...');
    setTotalFilesToUpload(totalFiles);
    setCurrentFileIndex(0);
    const startTime = Date.now();

    try {
      let totalUploaded = 0;
      let totalFailed = 0;
      const allErrors: string[] = [];
      const allUploadedPaths: Array<{ paths: string[], type: string }> = [];

      // Upload before files
      if (beforeFiles.length > 0) {
        setUploadStep('Uploading before photos...');
        const { uploadedPaths, failCount, errors } = await uploadFilesDirectly(beforeFiles, 'before');
        if (uploadedPaths.length > 0) {
          allUploadedPaths.push({ paths: uploadedPaths, type: 'before' });
          totalUploaded += uploadedPaths.length;
        }
        totalFailed += failCount;
        allErrors.push(...errors);
      }

      // Upload after files
      if (afterFiles.length > 0) {
        setUploadStep('Uploading after photos...');
        const { uploadedPaths, failCount, errors } = await uploadFilesDirectly(afterFiles, 'after');
        if (uploadedPaths.length > 0) {
          allUploadedPaths.push({ paths: uploadedPaths, type: 'after' });
          totalUploaded += uploadedPaths.length;
        }
        totalFailed += failCount;
        allErrors.push(...errors);
      }

      // Upload additional files
      if (additionalFiles.length > 0) {
        setUploadStep('Uploading additional files...');
        const { uploadedPaths, failCount, errors } = await uploadFilesDirectly(additionalFiles, 'additional');
        if (uploadedPaths.length > 0) {
          allUploadedPaths.push({ paths: uploadedPaths, type: 'additional' });
          totalUploaded += uploadedPaths.length;
        }
        totalFailed += failCount;
        allErrors.push(...errors);
      }

      // Call edge function to process photos in background
      if (allUploadedPaths.length > 0) {
        setUploadStep('Starting background processing...');
        for (const { paths, type } of allUploadedPaths) {
          try {
            await supabase.functions.invoke('process-cleaning-photos', {
              body: {
                filePaths: paths,
                bookingId: booking.id,
                photoType: type,
                customerId: booking.customer,
                cleanerId: booking.cleaner,
                postcode: booking.postcode,
                bookingDate: bookingDate
              }
            });
            console.log(`✓ Started background processing for ${paths.length} ${type} photos`);
          } catch (processError) {
            console.error(`Failed to start background processing for ${type}:`, processError);
          }
        }

        // Update booking status
        await supabase.from('bookings').update({ has_photos: true }).eq('id', booking.id);
        try {
          await supabase.from('past_bookings').update({ has_photos: true }).eq('id', booking.id);
        } catch (e) {
          console.warn('Past booking update skipped:', e);
        }
      }

      const uploadTime = ((Date.now() - startTime) / 1000).toFixed(1);

      // Show success toast with detailed error info
      if (totalFailed > 0) {
        const errorSummary = allErrors.slice(0, 3).join('; ');
        const moreErrors = allErrors.length > 3 ? ` +${allErrors.length - 3} more` : '';
        console.error('Upload failures:', allErrors);
        
        toast({
          title: "Upload Partially Complete",
          description: `${totalUploaded} uploaded, ${totalFailed} failed. Errors: ${errorSummary}${moreErrors}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Photos Uploaded!",
          description: `${totalUploaded} photos uploaded! Processing in background...`,
        });
      }

      console.log(`✅ Upload complete in ${uploadTime}s. ${totalUploaded} uploaded, ${totalFailed} failed`);

      // Reset form
      setBeforeFiles([]);
      setAfterFiles([]);
      setAdditionalFiles([]);
      setAdditionalDetails('');
      setShowAdditionalTab(false);
      setUploadProgress('');
      setUploadStep('');
      setCurrentFileIndex(0);
      setTotalFilesToUpload(0);
      
      // Refresh existing photos
      fetchExistingPhotos();
      
      // Close dialog after short delay only if no failures
      if (totalFailed === 0) {
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload photos",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const FileUploadArea = ({ type, files, onFileSelect, onRemove }: {
    type: 'before' | 'after' | 'additional';
    files: File[];
    onFileSelect: (files: FileList | null) => void;
    onRemove: (index: number) => void;
  }) => {
    const displayFiles = showAllPreviews ? files : files.slice(0, INITIAL_PREVIEW_COUNT);
    const hiddenCount = files.length - INITIAL_PREVIEW_COUNT;

    const handleSmartPick = async (e: React.MouseEvent<HTMLElement>) => {
      // On mobile devices, skip showOpenFilePicker and use native input
      if (isMobile) {
        console.info('📱 Mobile device detected - using native file input');
        return; // Let the label's htmlFor trigger the native input
      }

      // Desktop: Try to use showOpenFilePicker for better UX
      const picker = (window as any).showOpenFilePicker;
      if (typeof picker !== 'function') return; // fallback to native input
      try {
        e.preventDefault();
        e.stopPropagation();
        const types = type === 'additional'
          ? [{ description: 'All files', accept: { '*/*': ['.*'] } }]
          : [{ description: 'Images', accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'] } }];
        const handles = await picker({
          multiple: true,
          types,
          excludeAcceptAllOption: type !== 'additional',
        });
        const filesPicked = await Promise.all(handles.map((h: any) => h.getFile()));
        const dt = new DataTransfer();
        filesPicked.forEach((f: File) => dt.items.add(f));
        console.info(`📥 showOpenFilePicker returned ${filesPicked.length} files for ${type}`);
        onFileSelect(dt.files);
      } catch (err) {
        console.warn('showOpenFilePicker failed, falling back to input', err);
      }
    };

    return (
      <div className="space-y-6">
        <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer">
          <input
            type="file"
            accept={type === 'additional' ? "*/*" : "image/*"}
            multiple
            disabled={uploading}
            onChange={(e) => { const fl = (e.target as HTMLInputElement).files; console.info(`📥 Input change (${type}):`, { filesLength: fl?.length || 0 }); onFileSelect(fl); (e.target as HTMLInputElement).value = ''; }}
            className="hidden"
            id={`file-${type}`}
          />
          <label htmlFor={`file-${type}`} onClick={handleSmartPick} className="cursor-pointer block">
            <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
              <Camera className="h-12 w-12 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">
              Select {type} {type === 'additional' ? 'files' : 'photos'}
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              {isMobile 
                ? 'Tap to select from gallery or take photo (up to 150)'
                : 'Click to select multiple files (up to 150)'
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {type === 'additional' 
                ? 'Any file type - large images will be compressed automatically' 
                : 'JPG, PNG, WebP, HEIC - will be compressed automatically'
              }
            </p>
          </label>
        </div>

        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-sm font-medium text-foreground">
                {files.length} {files.length === 1 ? 'file' : 'files'} selected
                {isLowMemoryMode && <span className="ml-2 text-xs text-orange-600">(Low-memory mode active)</span>}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => files.forEach((_, i) => onRemove(0))}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Clear all
              </Button>
            </div>

            {!isLowMemoryMode ? (
              <>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 max-h-[50vh] overflow-y-auto p-1">
                  {displayFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      {file.type === 'application/pdf' ? (
                        <div className="w-full aspect-square bg-red-50 border-2 border-red-200 rounded-lg flex flex-col items-center justify-center p-2">
                          <svg className="h-10 w-10 text-red-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                          <p className="text-xs text-red-600 text-center px-1 line-clamp-2">{file.name}</p>
                        </div>
                      ) : file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`${type} photo ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg border-2 border-border shadow-sm hover:shadow-md transition-shadow"
                          onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                        />
                      ) : (
                        <div className="w-full aspect-square bg-muted border-2 border-border rounded-lg flex flex-col items-center justify-center p-2">
                          <svg className="h-10 w-10 text-muted-foreground mb-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <p className="text-xs text-muted-foreground text-center px-1 break-all line-clamp-2">{file.name}</p>
                        </div>
                      )}
                      <button
                        onClick={() => onRemove(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        aria-label={`Remove ${type} file ${index + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {hiddenCount > 0 && !showAllPreviews && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllPreviews(true)}
                    className="w-full"
                  >
                    Show all ({hiddenCount} more)
                  </Button>
                )}
              </>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                <p className="text-sm text-orange-800 font-medium">
                  Low-memory mode: {files.length} files ready to upload
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Previews disabled to save memory. Files will upload normally.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent fullScreen className="flex flex-col bg-background">
        {/* Delete Animation Overlay */}
        {showDeleteAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="animate-scale-in">
              <CheckCircle2 className="h-20 w-20 text-green-500 animate-[scale-in_0.3s_ease-out]" strokeWidth={2.5} />
            </div>
          </div>
        )}

        <DialogHeader className="flex-shrink-0 space-y-3 p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="p-2 rounded-lg bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <span>Upload Cleaning Photos</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {booking.address} • {booking.postcode} • {new Date(booking.date_time).toLocaleDateString()}
          </p>
          
          {/* Mobile Auto-Upload Info Banner */}
          {isMobile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
              <p className="text-xs text-blue-800 flex items-center gap-2">
                <Camera className="h-4 w-4 flex-shrink-0" />
                <span>📱 Photos upload automatically when selected for best reliability</span>
              </p>
            </div>
          )}
        </DialogHeader>

        {/* Debug Panel */}
        {(showDebug || (isMobile && totalFiles > 30)) && (
          <div className="flex-shrink-0 mx-6 mt-4">
            <div className="border border-border rounded-lg bg-muted/30">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                <span>Debug Information</span>
                {showDebug ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showDebug && (
                <div className="p-4 pt-0 space-y-2 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="font-semibold text-muted-foreground">Device</p>
                      <p>{isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">Memory Mode</p>
                      <p className={isLowMemoryMode ? 'text-orange-600' : 'text-green-600'}>
                        {isLowMemoryMode ? 'Low Memory' : 'Normal'}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">Files Selected</p>
                      <p>Before: {beforeFiles.length}, After: {afterFiles.length}, Additional: {additionalFiles.length}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">Total Size</p>
                      <p>{((beforeFiles.reduce((s, f) => s + f.size, 0) + afterFiles.reduce((s, f) => s + f.size, 0) + additionalFiles.reduce((s, f) => s + f.size, 0)) / 1024 / 1024).toFixed(2)}MB</p>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">Processing Mode</p>
                      <p>Strictly Sequential (1-by-1)</p>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">Available Memory</p>
                      <p>{(navigator as any).deviceMemory || 'Unknown'} GB</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Existing Photos Section - Collapsible */}
        {loadingPhotos ? (
          <div className="flex-shrink-0 mx-6 mt-4 p-4 border rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">Loading existing photos...</p>
          </div>
        ) : existingPhotos.length > 0 && (
          <div className="flex-shrink-0 mx-6 mt-4 border rounded-lg bg-muted/30">
            <button
              onClick={() => setShowExistingPhotos(!showExistingPhotos)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-lg"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <h3 className="font-semibold">
                  Uploaded Photos ({existingPhotos.length})
                </h3>
              </div>
              {showExistingPhotos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {showExistingPhotos && (
              <div className="p-4 pt-0">
                <Tabs defaultValue="before" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="before">
                      Before ({existingPhotos.filter(p => p.photo_type === 'before').length})
                    </TabsTrigger>
                    <TabsTrigger value="after">
                      After ({existingPhotos.filter(p => p.photo_type === 'after').length})
                    </TabsTrigger>
                    <TabsTrigger value="additional">
                      Additional ({existingPhotos.filter(p => p.photo_type === 'additional').length})
                    </TabsTrigger>
                  </TabsList>

                  {(['before', 'after', 'additional'] as const).map(type => {
                    const photosByType = existingPhotos.filter(p => p.photo_type === type);
                    return (
                      <TabsContent key={type} value={type} className="mt-4">
                        {photosByType.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No {type} photos yet
                          </p>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[350px] overflow-y-auto">
                            {photosByType.map((photo) => (
                              <ExistingPhotoItem key={photo.id} photo={photo} />
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-hidden p-6">
          <Tabs defaultValue="before" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-6 h-12 p-1 shrink-0">
              <TabsTrigger value="before" className="text-base py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Before {beforeFiles.length > 0 && `(${beforeFiles.length})`}
              </TabsTrigger>
              <TabsTrigger value="after" className="text-base py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                After {afterFiles.length > 0 && `(${afterFiles.length})`}
              </TabsTrigger>
              <TabsTrigger 
                value="additional" 
                className="text-base py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                Additional {additionalFiles.length > 0 && `(${additionalFiles.length})`}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              <TabsContent value="before" className="mt-0 h-auto">
                <div className="space-y-4">
                  <FileUploadArea
                    type="before"
                    files={beforeFiles}
                    onFileSelect={(files) => handleFileSelect(files, 'before')}
                    onRemove={(index) => removeFile(index, 'before')}
                  />
                </div>
              </TabsContent>

              <TabsContent value="after" className="mt-0 h-auto">
                <div className="space-y-4">
                  <FileUploadArea
                    type="after"
                    files={afterFiles}
                    onFileSelect={(files) => handleFileSelect(files, 'after')}
                    onRemove={(index) => removeFile(index, 'after')}
                  />
                </div>
              </TabsContent>

              <TabsContent value="additional" className="mt-0 h-auto">
                <div className="space-y-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      <h4 className="font-medium text-orange-800 text-sm">Additional Information</h4>
                    </div>
                    <p className="text-xs text-orange-700">
                      Use this section to report damage, missing items, or any other additional information. You can upload both photos and PDF documents.
                    </p>
                  </div>

                  {!showAdditionalTab ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowAdditionalTab(true)}
                      className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 py-3 text-sm"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                      Add Additional Information
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="additional-details" className="text-sm font-medium">
                          Additional Details *
                        </Label>
                        <Textarea
                          id="additional-details"
                          placeholder="Describe any damage, missing items, or other important information..."
                          value={additionalDetails}
                          onChange={(e) => setAdditionalDetails(e.target.value)}
                          className="mt-2 text-sm min-h-[60px]"
                          rows={2}
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
                        className="text-gray-500 hover:text-gray-700 text-sm w-full py-2"
                      >
                        Cancel Additional Info
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Upload Progress with Animation */}
        {uploading && (
          <div className="flex-shrink-0 bg-primary/10 border border-primary/20 rounded-lg p-4 mx-6 mb-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{currentFileIndex}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-base font-semibold text-foreground">
                    {uploadStep}
                  </p>
                  <p className="text-sm font-medium text-primary">
                    {currentFileIndex}/{totalFilesToUpload}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {uploadProgress}
                </p>
                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300 ease-out"
                    style={{ width: `${totalFilesToUpload > 0 ? (currentFileIndex / totalFilesToUpload) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-shrink-0 border-t p-6 bg-background pb-[env(safe-area-inset-bottom)]">
          {totalFiles > 0 && !uploading && (
            <div className="mb-3 text-center">
              <p className="text-xs text-muted-foreground">
                Files ready • Click to manually upload or wait for auto-upload to complete
              </p>
            </div>
          )}
          <Button 
            onClick={handleUpload} 
            disabled={uploading || totalFiles === 0}
            className="w-full py-6 text-lg font-semibold"
          >
            {uploading ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>{autoUploading ? 'Auto-uploading...' : 'Uploading...'} {currentFileIndex}/{totalFilesToUpload}</span>
              </div>
            ) : totalFiles > 0 ? (
              <>Retry Upload ({totalFiles} {totalFiles === 1 ? 'File' : 'Files'})</>
            ) : (
              <>Select Photos to Upload</>
            )}
          </Button>
        </div>
      </DialogContent>

      {/* Photo Viewer Modal */}
      {viewingPhoto && (
        <PhotoViewer 
          filePath={viewingPhoto}
          onClose={() => setViewingPhoto(null)}
        />
      )}
    </Dialog>
  );
};

export default CleaningPhotosUploadDialog;
