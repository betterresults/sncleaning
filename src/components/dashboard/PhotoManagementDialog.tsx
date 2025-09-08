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
          <img
            src={imageUrl}
            alt={`${photo.photo_type} photo`}
            className="w-full h-full object-cover"
          />
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
          onClick={() => handleViewPhoto(photo.file_path)}
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

  const bookingDate = new Date(booking.date_time).toISOString().split('T')[0];
  const folderPath = `${booking.id}_${booking.postcode}_${bookingDate}_${booking.customer}`;

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
      setPhotos(data || []);
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
    if (!files) return;
    
    const fileArray = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024 // 5MB limit
    );

    if (fileArray.length !== files.length) {
      toast({
        title: 'Invalid Files',
        description: 'Some files were skipped. Only images under 5MB are allowed.',
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
    const uploadPromises = files.map(async (file, index) => {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${index}_${file.name}`;
      const filePath = `${folderPath}/${photoType}/${fileName}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cleaning.photos')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
      }

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
        throw new Error(`Database error: ${dbError.message}`);
      }

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
        if (!additionalDetails.trim()) {
          toast({
            title: 'Additional Details Required',
            description: 'Please provide details about the additional information.',
            variant: 'destructive'
          });
          setUploading(false);
          return;
        }
        uploadPromises.push(uploadFiles(additionalFiles, 'additional'));
      }

      await Promise.all(uploadPromises);

      toast({
        title: 'Photos Uploaded Successfully',
        description: `Uploaded ${beforeFiles.length + afterFiles.length + additionalFiles.length} photos.`
      });

      // Reset form
      setBeforeFiles([]);
      setAfterFiles([]);
      setAdditionalFiles([]);
      setAdditionalDetails('');
      setShowAdditionalTab(false);
      
      // Refresh photos
      await fetchPhotos();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload photos. Please try again.',
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

      // Delete from database
      const { error: dbError } = await supabase
        .from('cleaning_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

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
  }) => (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-gray-300 transition-colors">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onFileSelect(e.target.files)}
          className="hidden"
          id={`file-${type}`}
        />
        <label htmlFor={`file-${type}`} className="cursor-pointer">
          <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">
            Click to select {type} photos or drag and drop
          </p>
          <p className="text-xs text-gray-400 mt-1">
            JPG, PNG, WebP up to 5MB each
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {files.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={`${type} photo ${index + 1}`}
                className="w-full h-24 object-cover rounded border"
              />
              <button
                onClick={() => onRemove(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

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
                const photoLink = `https://ffa08752-d853-4e87-8f4f-92b4f1e65779.sandbox.lovable.dev/photos/${folderPath}`;
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
                {uploading ? 'Uploading...' : 'Upload Photos'}
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