
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Camera, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
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
  };
}

const INITIAL_PREVIEW_COUNT = 60; // Show first 60 thumbnails by default
const LOW_MEMORY_THRESHOLD = 40; // Switch to low-memory mode for >40 files on iOS
const LAST_EDIT_TIME = new Date().toLocaleString('en-GB', { 
  day: '2-digit', 
  month: '2-digit', 
  year: 'numeric', 
  hour: '2-digit', 
  minute: '2-digit',
  second: '2-digit'
});

const CleaningPhotosUploadDialog = ({ open, onOpenChange, booking }: CleaningPhotosUploadDialogProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
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

  const bookingDate = new Date(booking.date_time).toISOString().split('T')[0];
  const safePostcode = booking.postcode?.toString().replace(/\s+/g, '').toUpperCase() || 'NA';
  const folderPath = `${booking.id}_${safePostcode}_${bookingDate}_${booking.customer}`;

  // Device detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;
  const totalFiles = beforeFiles.length + afterFiles.length + additionalFiles.length;
  const isLowMemoryMode = isIOS && totalFiles > LOW_MEMORY_THRESHOLD;

  const handleFileSelect = async (files: FileList | null, type: 'before' | 'after' | 'additional') => {
    console.info('🎬 File selection started', {
      type,
      filesCount: files?.length || 0,
      device: isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop',
      userAgent: navigator.userAgent,
      availableMemory: (navigator as any).deviceMemory || 'unknown'
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

      if (type === 'additional') {
        // Additional files: allow any type up to 10MB
        if (file.size <= 10 * 1024 * 1024) {
          accepted.push(file);
          console.info(`✅ Accepted additional file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        } else {
          skipped.push({ name: file.name, reason: 'File too large (max 10MB)' });
          console.warn(`❌ Skipped: ${file.name} - too large (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        }
      } else {
        // Before/After: accept images by MIME or common extensions (handles iOS HEIC with empty type)
        if (isImageByType || isImageByExt) {
          accepted.push(file);
          console.info(`✅ Accepted image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB, ${file.type || 'unknown type'})`);
        } else {
          skipped.push({ name: file.name, reason: 'Unsupported file type' });
          console.warn(`❌ Skipped: ${file.name} - unsupported (${file.type || 'unknown'})`);
        }
      }
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
      const allowed = type === 'additional' ? 'images or files under 10MB' : 'images only';
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
        description: type === 'additional' ? 'All files exceeded 10MB.' : 'Please select image files (JPG, PNG, WebP, HEIC).',
        variant: 'destructive'
      });
      return;
    }

    // Add files to state immediately - no chunking
    switch (type) {
      case 'before':
        setBeforeFiles(prev => {
          const newFiles = [...prev, ...accepted];
          console.info(`📁 Before files updated: ${newFiles.length} total`);
          return newFiles;
        });
        break;
      case 'after':
        setAfterFiles(prev => {
          const newFiles = [...prev, ...accepted];
          console.info(`📁 After files updated: ${newFiles.length} total`);
          return newFiles;
        });
        break;
      case 'additional':
        setAdditionalFiles(prev => {
          const newFiles = [...prev, ...accepted];
          console.info(`📁 Additional files updated: ${newFiles.length} total`);
          return newFiles;
        });
        break;
    }

    if (accepted.length > 0) {
      toast({ 
        title: 'Files Selected', 
        description: `${accepted.length} file${accepted.length === 1 ? '' : 's'} added. Ready to upload.` 
      });
      
      // Auto-show debug on mobile if many files selected
      if (isMobile && accepted.length > 30) {
        setShowDebug(true);
      }
    }
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

  // Strictly one-by-one sequential upload with continue-on-error
  const uploadFilesSequentially = async (files: File[], photoType: 'before' | 'after' | 'additional') => {
    const successfulUploads: string[] = [];
    const failedUploads: { name: string; error: string }[] = [];
    const fileType = photoType === 'additional' ? 'files' : 'photos';
    
    console.info(`🚀 Starting strictly sequential upload for ${files.length} ${photoType} ${fileType}`);
    setUploadStep(`Uploading ${photoType} ${fileType}...`);

    // Determine compression options based on file count
    const compressionOptions = files.length > 50 
      ? { maxWidthOrHeight: 1600, initialQuality: 0.7, maxSizeMB: 1.5 }
      : undefined;

    // Process files one-by-one
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileNumber = i + 1;
      
      setCurrentFileIndex(fileNumber);
      console.info(`📤 [${fileNumber}/${files.length}] Processing: ${file.name}`);

      try {
        let fileToUpload = file;

        // Compress images
        if (file.type.startsWith('image/')) {
          setUploadProgress(`Compressing ${file.name} (${fileNumber}/${files.length})`);
          console.info(`🗜️ [${fileNumber}/${files.length}] Compressing ${file.name}...`);
          
          try {
            const originalSize = (file.size / 1024 / 1024).toFixed(2);
            fileToUpload = await compressImage(file, compressionOptions);
            const compressedSize = (fileToUpload.size / 1024 / 1024).toFixed(2);
            console.info(`✅ [${fileNumber}/${files.length}] Compressed ${file.name}: ${originalSize}MB → ${compressedSize}MB`);
          } catch (e) {
            console.warn(`⚠️ [${fileNumber}/${files.length}] Compression failed for ${file.name}, using original:`, e);
          }
        } else if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
          // Handle HEIC/HEIF with empty MIME type
          fileToUpload = new File([file], file.name, { type: 'image/heic' });
        }

        const timestamp = Date.now();
        const fileName = `${timestamp}_${i}_${file.name}`;
        const filePath = `${folderPath}/${photoType}/${fileName}`;

        setUploadProgress(`Uploading ${file.name} (${fileNumber}/${files.length})`);
        console.info(`📤 [${fileNumber}/${files.length}] Uploading to: ${filePath}`);

        // Upload to storage with retry logic
        let uploadData, uploadError;
        let retryCount = 0;
        const maxRetries = 3;
        
        do {
          const response = await supabase.storage
            .from('cleaning.photos')
            .upload(filePath, fileToUpload, { 
              cacheControl: '3600', 
              upsert: true, 
              contentType: fileToUpload.type || 'application/octet-stream'
            });
          
          uploadData = response.data;
          uploadError = response.error;
          
          if (uploadError && retryCount < maxRetries - 1) {
            console.warn(`⚠️ [${fileNumber}/${files.length}] Upload attempt ${retryCount + 1} failed, retrying...`, uploadError);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            retryCount++;
          }
        } while (uploadError && retryCount < maxRetries);

        if (uploadError) {
          const errorMsg = uploadError.message;
          console.error(`❌ [${fileNumber}/${files.length}] Upload failed after ${maxRetries} attempts:`, uploadError);
          failedUploads.push({ name: file.name, error: errorMsg });
          continue; // Skip to next file
        }

        console.info(`✅ [${fileNumber}/${files.length}] Upload successful: ${filePath}`);
        setUploadProgress(`Saving metadata for ${file.name} (${fileNumber}/${files.length})`);

        // Save metadata to database
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
            damage_details: photoType === 'additional' ? additionalDetails : null
          });

        if (dbError) {
          console.error(`❌ [${fileNumber}/${files.length}] Database insert failed:`, dbError);
          failedUploads.push({ name: file.name, error: dbError.message });
          continue; // Skip to next file
        }

        console.info(`✅ [${fileNumber}/${files.length}] Metadata saved successfully`);
        setUploadProgress(`✓ ${file.name} completed (${fileNumber}/${files.length})`);
        successfulUploads.push(filePath);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ [${fileNumber}/${files.length}] Unexpected error:`, error);
        failedUploads.push({ name: file.name, error: errorMsg });
      }

      // Micro-yield between files to keep UI responsive
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.info(`✅ Upload batch complete for ${photoType}:`, {
      successful: successfulUploads.length,
      failed: failedUploads.length
    });

    if (failedUploads.length > 0) {
      console.warn(`⚠️ Failed uploads:`, failedUploads);
    }

    return { successfulUploads, failedUploads };
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

    console.info('🚀 Upload initiated', {
      before: beforeFiles.length,
      after: afterFiles.length,
      additional: additionalFiles.length,
      total: totalFiles
    });

    // Verify authentication
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      console.error('❌ Authentication check failed:', authError);
      toast({
        title: 'Not Signed In',
        description: 'Please sign in again and retry the upload.',
        variant: 'destructive'
      });
      return;
    }

    console.info('✅ Authentication verified:', { userId: authData.user.id });

    setUploading(true);
    setUploadStep('Starting upload...');
    setUploadProgress('Preparing files...');
    setTotalFilesToUpload(totalFiles);
    setCurrentFileIndex(0);

    try {
      let totalSuccessful = 0;
      let totalFailed = 0;
      const allFailedFiles: { name: string; error: string }[] = [];

      if (beforeFiles.length > 0) {
        console.info(`📤 Uploading ${beforeFiles.length} before photos...`);
        const { successfulUploads, failedUploads } = await uploadFilesSequentially(beforeFiles, 'before');
        totalSuccessful += successfulUploads.length;
        totalFailed += failedUploads.length;
        allFailedFiles.push(...failedUploads);
      }

      if (afterFiles.length > 0) {
        console.info(`📤 Uploading ${afterFiles.length} after photos...`);
        const { successfulUploads, failedUploads } = await uploadFilesSequentially(afterFiles, 'after');
        totalSuccessful += successfulUploads.length;
        totalFailed += failedUploads.length;
        allFailedFiles.push(...failedUploads);
      }

      if (additionalFiles.length > 0) {
        if (!additionalDetails.trim()) {
          console.warn('⚠️ Additional files selected but no details provided');
          toast({
            title: 'Additional Details Required',
            description: 'Please provide details about the additional information.',
            variant: 'destructive'
          });
          setUploading(false);
          setUploadStep('');
          setUploadProgress('');
          return;
        }
        console.info(`📤 Uploading ${additionalFiles.length} additional files...`);
        const { successfulUploads, failedUploads } = await uploadFilesSequentially(additionalFiles, 'additional');
        totalSuccessful += successfulUploads.length;
        totalFailed += failedUploads.length;
        allFailedFiles.push(...failedUploads);
      }

      // Update booking status if at least one file succeeded
      if (totalSuccessful > 0) {
        setUploadStep('Updating booking status...');
        console.info('📝 Updating booking status...');
        
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ has_photos: true })
          .eq('id', booking.id);

        if (updateError) {
          console.error('⚠️ Failed to update booking status:', updateError);
        } else {
          console.info('✅ Booking status updated');
        }

        // Also update past_bookings table
        try {
          const { error: pastUpdateError } = await supabase
            .from('past_bookings')
            .update({ has_photos: true })
            .eq('id', booking.id);

          if (pastUpdateError) {
            console.warn('⚠️ Failed to update past booking status (non-critical):', pastUpdateError);
          } else {
            console.info('✅ Past booking status updated');
          }
        } catch (pastError) {
          console.warn('⚠️ Past booking update error (non-critical):', pastError);
        }
      }

      // Show summary
      console.info('🎉 Upload process completed!', {
        totalFiles,
        successful: totalSuccessful,
        failed: totalFailed
      });

      if (totalFailed === 0) {
        setUploadStep('Upload completed successfully!');
        setUploadProgress(`✓ All ${totalSuccessful} photos uploaded`);
        toast({
          title: 'All Files Uploaded Successfully',
          description: `Uploaded ${totalSuccessful} file${totalSuccessful === 1 ? '' : 's'} successfully. Customer will be notified in 15 minutes.`
        });
      } else if (totalSuccessful > 0) {
        setUploadStep('Upload partially completed');
        setUploadProgress(`✓ ${totalSuccessful} succeeded, ${totalFailed} failed`);
        toast({
          title: 'Upload Partially Completed',
          description: `${totalSuccessful} file${totalSuccessful === 1 ? '' : 's'} uploaded successfully. ${totalFailed} file${totalFailed === 1 ? '' : 's'} failed.`,
          variant: 'default'
        });
      } else {
        setUploadStep('Upload failed');
        setUploadProgress('All files failed to upload');
        toast({
          title: 'Upload Failed',
          description: `All ${totalFailed} file${totalFailed === 1 ? '' : 's'} failed to upload. Please try again.`,
          variant: 'destructive'
        });
      }

      // Reset form after delay if at least one succeeded
      if (totalSuccessful > 0) {
        setTimeout(() => {
          console.info('🔄 Resetting form...');
          setBeforeFiles([]);
          setAfterFiles([]);
          setAdditionalFiles([]);
          setAdditionalDetails('');
          setShowAdditionalTab(false);
          setUploadStep('');
          setUploadProgress('');
          setCurrentFileIndex(0);
          setTotalFilesToUpload(0);
          onOpenChange(false);
        }, 2000);
      }

    } catch (error) {
      console.error('❌ Unexpected upload error:', error);
      setUploadStep('Upload failed');
      setUploadProgress('Please try again');
      
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload photos. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setTimeout(() => {
        setUploading(false);
        if (!uploading) {
          setUploadStep('');
          setUploadProgress('');
        }
      }, 2000);
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

    return (
      <div className="space-y-6">
        <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer">
          <input
            type="file"
            accept={type === 'additional' ? "*/*" : "image/*"}
            multiple
            onChange={(e) => { const fl = (e.target as HTMLInputElement).files; console.info(`📥 Input change (${type}):`, { filesLength: fl?.length || 0 }); onFileSelect(fl); (e.target as HTMLInputElement).value = ''; }}
            className="hidden"
            id={`file-${type}`}
          />
          <label htmlFor={`file-${type}`} className="cursor-pointer block">
            <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
              <Camera className="h-12 w-12 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">
              Select {type} {type === 'additional' ? 'files' : 'photos'}
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              Click to select multiple files (up to 150)
            </p>
            <p className="text-xs text-muted-foreground">
              {type === 'additional' 
                ? 'Any file type up to 10MB each' 
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
        <DialogHeader className="flex-shrink-0 space-y-3 p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="p-2 rounded-lg bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <span>Upload Cleaning Photos</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Booking #{booking.id} - {booking.postcode} - {bookingDate}
          </p>
          <p className="text-xs text-muted-foreground/70 italic">
            Last edit: {LAST_EDIT_TIME}
          </p>
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
          <Button 
            onClick={handleUpload} 
            disabled={uploading || totalFiles === 0}
            className="w-full py-6 text-lg font-semibold"
          >
            {uploading ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Uploading... {currentFileIndex}/{totalFilesToUpload}</span>
              </div>
            ) : (
              <>Upload {totalFiles} {totalFiles === 1 ? 'Photo' : 'Photos'}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CleaningPhotosUploadDialog;
