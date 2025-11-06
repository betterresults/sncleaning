
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Camera, AlertTriangle } from 'lucide-react';

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

  const bookingDate = new Date(booking.date_time).toISOString().split('T')[0];
  const safePostcode = booking.postcode?.toString().replace(/\s+/g, '').toUpperCase() || 'NA';
  const folderPath = `${booking.id}_${safePostcode}_${bookingDate}_${booking.customer}`;

  const handleFileSelect = (files: FileList | null, type: 'before' | 'after' | 'additional') => {
    if (!files) return;
    
    let fileArray: File[];
    
    if (type === 'additional') {
      // Allow any file type for additional information
      fileArray = Array.from(files).filter(file => {
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit for additional files
        return isValidSize;
      });
    } else {
      // Only images for before/after photos
      fileArray = Array.from(files).filter(file => 
        file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024 // 5MB limit
      );
    }

    if (fileArray.length !== files.length) {
      const allowedTypes = type === 'additional' ? 'files under 10MB' : 'images under 5MB';
      toast({
        title: 'Invalid Files',
        description: `Some files were skipped. Only ${allowedTypes} are allowed.`,
        variant: 'destructive'
      });
    }

    switch (type) {
      case 'before':
        setBeforeFiles(prev => [...prev, ...fileArray]);
        break;
      case 'after':
        setAfterFiles(prev => [...prev, ...fileArray]);
        break;
      case 'additional':
        setAdditionalFiles(prev => [...prev, ...fileArray]);
        break;
    }
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
    const totalFiles = files.length;
    const fileType = photoType === 'additional' ? 'files' : 'photos';
    setUploadStep(`Uploading ${photoType} ${fileType}...`);
    
    const uploadPromises = files.map(async (file, index) => {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${index}_${file.name}`;
      const filePath = `${folderPath}/${photoType}/${fileName}`;

      setUploadProgress(`Uploading ${file.name} (${index + 1}/${totalFiles})`);
      console.log('Attempting to upload file:', { filePath, fileSize: file.size, fileType: file.type });

      // Upload to storage with retry logic and detailed error logging
      let uploadData, uploadError;
      let retryCount = 0;
      const maxRetries = 3;
      
      do {
        const response = await supabase.storage
          .from('cleaning.photos')
          .upload(filePath, file, { cacheControl: '3600', upsert: true, contentType: file.type });
        
        uploadData = response.data;
        uploadError = response.error;
        
        if (uploadError && retryCount < maxRetries - 1) {
          console.warn(`Upload attempt ${retryCount + 1} failed, retrying...`, uploadError);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          retryCount++;
        }
      } while (uploadError && retryCount < maxRetries);

      if (uploadError) {
        console.error('Storage upload error after all retries:', {
          error: uploadError,
          filePath,
          fileSize: file.size,
          fileType: file.type,
          retryCount
        });
        
        // More specific error messages
        if (uploadError.message.includes('JWT')) {
          throw new Error(`Authentication failed while uploading ${file.name}. Please try logging out and back in.`);
        } else if (uploadError.message.includes('Policy')) {
          throw new Error(`Permission denied for ${file.name}. Please contact support if this persists.`);
        } else if (uploadError.message.includes('size')) {
          throw new Error(`File ${file.name} is too large. Maximum size is ${photoType === 'additional' ? '10MB' : '5MB'}.`);
        } else {
          throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
        }
      }

      console.log('File uploaded successfully:', { filePath, uploadData });
      setUploadProgress(`Saving ${file.name} metadata (${index + 1}/${totalFiles})`);

      // Save metadata to database with better error handling
      console.log('Saving photo metadata to database:', {
        booking_id: booking.id,
        customer_id: booking.customer,
        cleaner_id: booking.cleaner,
        file_path: filePath,
        photo_type: photoType,
        postcode: booking.postcode,
        booking_date: bookingDate
      });

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
        console.error('Database insert error for file:', filePath, dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('Photo metadata saved successfully for:', filePath);
      setUploadProgress(`✓ ${file.name} completed`);

      return filePath;
    });

    return Promise.all(uploadPromises);
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

    // Verify authenticated session before uploading
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      toast({
        title: 'Not signed in',
        description: 'Please sign in again and retry the upload.',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setUploadStep('Starting upload...');
    setUploadProgress('Preparing files...');

    try {
      const totalFiles = beforeFiles.length + afterFiles.length + additionalFiles.length;
      let completedFiles = 0;

      const updateProgress = () => {
        completedFiles++;
        setUploadProgress(`Completed ${completedFiles}/${totalFiles} photos`);
      };

      if (beforeFiles.length > 0) {
        await uploadFiles(beforeFiles, 'before');
        completedFiles += beforeFiles.length;
      }

      if (afterFiles.length > 0) {
        await uploadFiles(afterFiles, 'after');
        completedFiles += afterFiles.length;
      }

      if (additionalFiles.length > 0) {
        if (!additionalDetails.trim()) {
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
        await uploadFiles(additionalFiles, 'additional');
        completedFiles += additionalFiles.length;
      }

      // Mark booking as having photos
      try {
        setUploadStep('Updating booking status...');
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ has_photos: true })
          .eq('id', booking.id);

        if (updateError) {
          console.error('Failed to update booking status:', updateError);
        }

        // Also update past_bookings table if the booking exists there
        try {
          const { error: pastUpdateError } = await supabase
            .from('past_bookings')
            .update({ has_photos: true })
            .eq('id', booking.id);

          if (pastUpdateError) {
            console.error('Failed to update past booking status:', pastUpdateError);
            // This is non-critical - don't fail the main upload
          }
        } catch (pastError) {
          console.error('Past booking update error:', pastError);
          // This is non-critical - don't fail the main upload
        }
      } catch (updateError) {
        console.error('Booking update error:', updateError);
        // Don't fail the upload if status update fails
      }

      setUploadStep('Upload completed successfully!');
      setUploadProgress(`✓ All ${totalFiles} photos uploaded`);

      toast({
        title: 'Files Uploaded Successfully',
        description: `Uploaded ${totalFiles} file${totalFiles === 1 ? '' : 's'} successfully. Customer will be notified in 15 minutes.`
      });

      // Reset form after a short delay
      setTimeout(() => {
        setBeforeFiles([]);
        setAfterFiles([]);
        setAdditionalFiles([]);
        setAdditionalDetails('');
        setShowAdditionalTab(false);
        setUploadStep('');
        setUploadProgress('');
        onOpenChange(false);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
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
  }) => (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer">
        <input
          type="file"
          accept={type === 'additional' ? "*/*" : "image/*"}
          multiple
          onChange={(e) => onFileSelect(e.target.files)}
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
            Click to select multiple files
          </p>
          <p className="text-xs text-muted-foreground">
            {type === 'additional' 
              ? 'Any file type up to 10MB each' 
              : 'JPG, PNG, WebP up to 5MB each'
            }
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-medium text-foreground">
              {files.length} {files.length === 1 ? 'file' : 'files'} selected
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[50vh] overflow-y-auto p-1">
            {files.map((file, index) => (
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
                  />
                ) : (
                  <div className="w-full aspect-square bg-muted border-2 border-border rounded-lg flex flex-col items-center justify-center p-2">
                    <svg className="h-10 w-10 text-muted-foreground mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-muted-foreground text-center px-1 break-all line-clamp-2">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(1)}MB</p>
                  </div>
                )}
                <button
                  onClick={() => onRemove(index)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${type} file ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none flex flex-col p-0 m-0 rounded-none">
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
        </DialogHeader>

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

            <div className="flex-1 overflow-y-auto">
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

        {/* Upload Progress Indicator */}
        {uploading && (
          <div className="flex-shrink-0 bg-primary/10 border border-primary/20 rounded-lg p-4 mx-6 mb-4">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-foreground">
                  {uploadStep}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {uploadProgress}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-shrink-0 border-t p-6 bg-background">
          <Button 
            onClick={handleUpload} 
            disabled={uploading}
            className="w-full py-6 text-lg font-semibold"
          >
            {uploading ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Uploading...</span>
              </div>
            ) : (
              <>Upload {beforeFiles.length + afterFiles.length + additionalFiles.length} {beforeFiles.length + afterFiles.length + additionalFiles.length === 1 ? 'Photo' : 'Photos'}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CleaningPhotosUploadDialog;
