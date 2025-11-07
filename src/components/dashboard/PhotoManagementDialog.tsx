import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Camera, AlertTriangle, Trash2, Eye, Download, CheckSquare, Square, ArrowLeft } from 'lucide-react';
import { compressImage } from '@/utils/imageCompression';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

const PhotoManagementDialog = ({ open, onOpenChange, booking }: PhotoManagementDialogProps) => {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const [photos, setPhotos] = useState<CleaningPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Upload states
  const [beforeFiles, setBeforeFiles] = useState<File[]>([]);
  const [afterFiles, setAfterFiles] = useState<File[]>([]);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalToUpload, setTotalToUpload] = useState(0);

  const bookingDate = new Date(booking.date_time).toISOString().split('T')[0];
  const folderPath = `${bookingDate}/${booking.postcode}/${booking.id}`;

  useEffect(() => {
    if (open) {
      fetchPhotos();
    }
  }, [open, booking.id]);

  const fetchPhotos = async () => {
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
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after' | 'additional') => {
    const files = Array.from(event.target.files || []);
    if (type === 'before') setBeforeFiles(prev => [...prev, ...files]);
    if (type === 'after') setAfterFiles(prev => [...prev, ...files]);
    if (type === 'additional') setAdditionalFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number, type: 'before' | 'after' | 'additional') => {
    if (type === 'before') setBeforeFiles(prev => prev.filter((_, i) => i !== index));
    if (type === 'after') setAfterFiles(prev => prev.filter((_, i) => i !== index));
    if (type === 'additional') setAdditionalFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const allFiles = [
      ...beforeFiles.map(f => ({ file: f, type: 'before' })),
      ...afterFiles.map(f => ({ file: f, type: 'after' })),
      ...additionalFiles.map(f => ({ file: f, type: 'additional' }))
    ];

    if (allFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select files to upload',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setTotalToUpload(allFiles.length);
    setUploadedCount(0);

    const filePaths: string[] = [];

    try {
      for (let i = 0; i < allFiles.length; i++) {
        const { file, type } = allFiles[i];
        
        // Compress if image
        let fileToUpload = file;
        const isImage = file.type.startsWith('image/');
        if (isImage && file.size > 500 * 1024) {
          try {
            fileToUpload = await compressImage(file, { maxSizeMB: 2, maxWidthOrHeight: 1920 });
          } catch (error) {
            console.error('Compression failed, using original:', error);
          }
        }

        const fileName = `${type}_${Date.now()}_${file.name}`;
        const filePath = `${folderPath}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cleaning.photos')
          .upload(filePath, fileToUpload);

        if (uploadError) throw uploadError;

        filePaths.push(filePath);
        setUploadedCount(i + 1);
      }

      // Call edge function to process in background
      const { error: functionError } = await supabase.functions.invoke('process-cleaning-photos', {
        body: {
          filePaths,
          bookingId: booking.id,
          photoType: 'mixed',
          customerId: booking.customer,
          cleanerId: booking.cleaner,
          postcode: booking.postcode,
          bookingDate: bookingDate,
        },
      });

      if (functionError) {
        console.error('Background processing error:', functionError);
      }

      toast({
        title: 'Success',
        description: `${allFiles.length} photo(s) uploaded successfully`,
      });

      // Clear files
      setBeforeFiles([]);
      setAfterFiles([]);
      setAdditionalFiles([]);
      setAdditionalDetails('');
      
      // Refresh photos
      await fetchPhotos();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload photos',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadedCount(0);
      setTotalToUpload(0);
    }
  };

  const toggleSelectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map(p => p.id)));
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      newSelection.add(photoId);
    }
    setSelectedPhotos(newSelection);
  };

  const handleBulkDelete = async () => {
    if (selectedPhotos.size === 0) return;

    try {
      const photosToDelete = photos.filter(p => selectedPhotos.has(p.id));
      
      // Delete from storage
      const filePaths = photosToDelete.map(p => p.file_path);
      const { error: storageError } = await supabase.storage
        .from('cleaning.photos')
        .remove(filePaths);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('cleaning_photos')
        .delete()
        .in('id', Array.from(selectedPhotos));

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: `Deleted ${selectedPhotos.size} photo(s)`,
      });

      setSelectedPhotos(new Set());
      setSelectMode(false);
      setShowDeleteDialog(false);
      await fetchPhotos();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete photos',
        variant: 'destructive',
      });
    }
  };

  const handleSingleDelete = async (photo: CleaningPhoto) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('cleaning.photos')
        .remove([photo.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('cleaning_photos')
        .delete()
        .eq('id', photo.id);

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Photo deleted',
      });

      await fetchPhotos();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete photo',
        variant: 'destructive',
      });
    }
  };

  const getSignedUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('cleaning.photos')
        .createSignedUrl(filePath, 3600);

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

  const handleDownloadPhoto = async (filePath: string) => {
    const signedUrl = await getSignedUrl(filePath);
    if (signedUrl) {
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = filePath.split('/').pop() || 'photo';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const photosByType = {
    before: photos.filter(p => p.photo_type === 'before'),
    after: photos.filter(p => p.photo_type === 'after'),
    additional: photos.filter(p => p.photo_type === 'additional'),
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[100vw] w-full h-[100vh] max-h-[100vh] p-0 gap-0">
          <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="rounded-full"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Photo Management</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {booking.first_name && booking.last_name 
                      ? `${booking.first_name} ${booking.last_name}` 
                      : `Booking #${booking.id}`} · {new Date(booking.date_time).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {photos.length > 0 && (
                  <>
                    {!selectMode ? (
                      <Button
                        onClick={() => setSelectMode(true)}
                        variant="outline"
                        className="rounded-full"
                      >
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Select Photos
                      </Button>
                    ) : (
                      <>
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                          {selectedPhotos.size} selected
                        </Badge>
                        <Button
                          onClick={toggleSelectAll}
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                        >
                          {selectedPhotos.size === photos.length ? 'Deselect All' : 'Select All'}
                        </Button>
                        <Button
                          onClick={() => selectedPhotos.size > 0 && setShowDeleteDialog(true)}
                          disabled={selectedPhotos.size === 0}
                          variant="destructive"
                          size="sm"
                          className="rounded-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete {selectedPhotos.size > 0 && `(${selectedPhotos.size})`}
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectMode(false);
                            setSelectedPhotos(new Set());
                          }}
                          variant="ghost"
                          size="sm"
                          className="rounded-full"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <Tabs defaultValue="view" className="w-full">
                <TabsList className="mb-6 bg-white rounded-full p-1 shadow-sm">
                  <TabsTrigger value="view" className="rounded-full px-6">
                    <Eye className="h-4 w-4 mr-2" />
                    View Photos ({photos.length})
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="rounded-full px-6">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photos
                  </TabsTrigger>
                </TabsList>

                {/* View Photos Tab */}
                <TabsContent value="view" className="space-y-6 mt-0">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : photos.length === 0 ? (
                    <div className="rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 p-12 shadow-[0_8px_30px_rgb(0,0,0,0.08)] text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <Camera className="h-8 w-8 text-gray-500" />
                      </div>
                      <p className="text-lg font-semibold text-gray-700 mb-2">No photos yet</p>
                      <p className="text-sm text-gray-500">Upload photos using the Upload Photos tab</p>
                    </div>
                  ) : (
                    <>
                      {/* Before Photos */}
                      {photosByType.before.length > 0 && (
                        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6">
                          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            Before Photos ({photosByType.before.length})
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {photosByType.before.map((photo) => (
                              <PhotoCard
                                key={photo.id}
                                photo={photo}
                                selected={selectedPhotos.has(photo.id)}
                                selectMode={selectMode}
                                onSelect={() => togglePhotoSelection(photo.id)}
                                onView={() => handleViewPhoto(photo.file_path)}
                                onDownload={() => handleDownloadPhoto(photo.file_path)}
                                onDelete={() => handleSingleDelete(photo)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* After Photos */}
                      {photosByType.after.length > 0 && (
                        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6">
                          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            After Photos ({photosByType.after.length})
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {photosByType.after.map((photo) => (
                              <PhotoCard
                                key={photo.id}
                                photo={photo}
                                selected={selectedPhotos.has(photo.id)}
                                selectMode={selectMode}
                                onSelect={() => togglePhotoSelection(photo.id)}
                                onView={() => handleViewPhoto(photo.file_path)}
                                onDownload={() => handleDownloadPhoto(photo.file_path)}
                                onDelete={() => handleSingleDelete(photo)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Photos */}
                      {photosByType.additional.length > 0 && (
                        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6">
                          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            Additional Photos ({photosByType.additional.length})
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {photosByType.additional.map((photo) => (
                              <PhotoCard
                                key={photo.id}
                                photo={photo}
                                selected={selectedPhotos.has(photo.id)}
                                selectMode={selectMode}
                                onSelect={() => togglePhotoSelection(photo.id)}
                                onView={() => handleViewPhoto(photo.file_path)}
                                onDownload={() => handleDownloadPhoto(photo.file_path)}
                                onDelete={() => handleSingleDelete(photo)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                {/* Upload Photos Tab */}
                <TabsContent value="upload" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Before Photos Upload */}
                    <FileUploadSection
                      title="Before Photos"
                      color="blue"
                      files={beforeFiles}
                      onFileSelect={(e) => handleFileSelect(e, 'before')}
                      onRemove={(index) => removeFile(index, 'before')}
                      disabled={uploading}
                    />

                    {/* After Photos Upload */}
                    <FileUploadSection
                      title="After Photos"
                      color="green"
                      files={afterFiles}
                      onFileSelect={(e) => handleFileSelect(e, 'after')}
                      onRemove={(index) => removeFile(index, 'after')}
                      disabled={uploading}
                    />

                    {/* Additional Photos Upload */}
                    <FileUploadSection
                      title="Additional Photos"
                      color="orange"
                      files={additionalFiles}
                      onFileSelect={(e) => handleFileSelect(e, 'additional')}
                      onRemove={(index) => removeFile(index, 'additional')}
                      disabled={uploading}
                    />
                  </div>

                  {/* Additional Details */}
                  <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 mt-6">
                    <Label htmlFor="details" className="text-base font-semibold mb-2 block">
                      Additional Details (Optional)
                    </Label>
                    <Textarea
                      id="details"
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                      placeholder="Add any notes about the photos..."
                      className="min-h-[100px]"
                      disabled={uploading}
                    />
                  </div>

                  {/* Upload Progress */}
                  {uploading && (
                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Uploading photos...</span>
                        <span className="text-sm text-muted-foreground">
                          {uploadedCount} / {totalToUpload}
                        </span>
                      </div>
                      <Progress value={(uploadedCount / totalToUpload) * 100} className="h-2" />
                    </div>
                  )}

                  {/* Upload Button */}
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={handleUpload}
                      disabled={uploading || (beforeFiles.length === 0 && afterFiles.length === 0 && additionalFiles.length === 0)}
                      size="lg"
                      className="rounded-full px-8 shadow-lg"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Photos
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedPhotos.size} photo(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected photos will be permanently deleted from storage and the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// PhotoCard Component
interface PhotoCardProps {
  photo: CleaningPhoto;
  selected: boolean;
  selectMode: boolean;
  onSelect: () => void;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

const PhotoCard = ({ photo, selected, selectMode, onSelect, onView, onDownload, onDelete }: PhotoCardProps) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const getUrl = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('cleaning.photos')
          .createSignedUrl(photo.file_path, 3600);

        if (error) throw error;
        setImageUrl(data.signedUrl);
      } catch (error) {
        console.error('Error loading image:', error);
      } finally {
        setLoading(false);
      }
    };

    getUrl();
  }, [photo.file_path]);

  const isPDF = photo.file_path.toLowerCase().endsWith('.pdf');

  return (
    <>
      <div className={`relative group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''}`}>
        {/* Selection Checkbox */}
        {selectMode && (
          <div className="absolute top-2 left-2 z-10">
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="bg-white rounded-lg p-1 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              {selected ? (
                <CheckSquare className="h-5 w-5 text-primary" />
              ) : (
                <Square className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
        )}

        {/* Image */}
        <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden" onClick={selectMode ? onSelect : undefined}>
          {loading ? (
            <Camera className="h-8 w-8 text-gray-400 animate-pulse" />
          ) : isPDF ? (
            <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center">
              <svg className="h-12 w-12 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-red-600 mt-2 font-medium">PDF</p>
            </div>
          ) : imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Camera className="h-8 w-8 text-gray-400" />
          )}
        </div>

        {/* Info */}
        <div className="p-3 bg-white">
          <p className="text-xs text-muted-foreground truncate">
            {photo.file_path.split('/').pop()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(photo.created_at).toLocaleDateString()}
          </p>
          {photo.damage_details && (
            <Badge variant="destructive" className="mt-2 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Damage
            </Badge>
          )}
        </div>

        {/* Actions Overlay */}
        {!selectMode && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={onView} className="rounded-full shadow-lg">
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={onDownload} className="rounded-full shadow-lg">
              <Download className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setShowDeleteDialog(true)} className="rounded-full shadow-lg">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Single Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This photo will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// File Upload Section Component
interface FileUploadSectionProps {
  title: string;
  color: 'blue' | 'green' | 'orange';
  files: File[];
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  disabled: boolean;
}

const FileUploadSection = ({ title, color, files, onFileSelect, onRemove, disabled }: FileUploadSectionProps) => {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    green: 'from-green-50 to-green-100 border-green-200',
    orange: 'from-orange-50 to-orange-100 border-orange-200',
  };

  const dotColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6">
      <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${dotColors[color]}`}></div>
        {title}
      </h3>
      
      <div className={`relative border-2 border-dashed rounded-2xl p-6 bg-gradient-to-br ${colorClasses[color]} mb-4 transition-all hover:shadow-md`}>
        <input
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={onFileSelect}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Click to upload</p>
          <p className="text-xs text-muted-foreground mt-1">Images or PDF files</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {file.type.startsWith('image/') ? (
                  <Camera className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <svg className="h-4 w-4 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="text-xs font-medium truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                disabled={disabled}
                className="flex-shrink-0 ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoManagementDialog;
