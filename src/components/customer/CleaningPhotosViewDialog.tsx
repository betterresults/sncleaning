
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Download, AlertTriangle, Calendar, MapPin, X, Link2 } from 'lucide-react';

interface CleaningPhoto {
  id: string;
  file_path: string;
  photo_type: 'before' | 'after' | 'damage';
  caption?: string;
  damage_details?: string;
  created_at: string;
}

interface CleaningPhotosViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: number;
    postcode: string;
    date_time: string;
    address: string;
    service_type: string;
  };
}

const CleaningPhotosViewDialog = ({ open, onOpenChange, booking }: CleaningPhotosViewDialogProps) => {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const [photos, setPhotos] = useState<CleaningPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      // Work around the type issue by using any cast
      const { data, error } = await (supabase as any)
        .from('cleaning_photos')
        .select('*')
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Ensure we only set valid photo data
      const validPhotos = (data || []).filter((item: any) => 
        item && typeof item === 'object' && 
        'file_path' in item && 
        'photo_type' in item
      );

      setPhotos(validPhotos);
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

  useEffect(() => {
    if (open) {
      fetchPhotos();
    }
  }, [open, booking.id]);

  const getPhotoUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('cleaning.photos')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    return data?.signedUrl;
  };

  const downloadPhoto = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('cleaning.photos')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download photo',
        variant: 'destructive'
      });
    }
  };

  const copyPhotoLink = () => {
    const bookingDate = new Date(booking.date_time).toISOString().split('T')[0];
    const folderPath = `${booking.id}_${booking.postcode}_${bookingDate}`;
    const encodedFolderPath = encodeURIComponent(folderPath);
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
  };

  const PhotoGrid = ({ photos, type }: { photos: CleaningPhoto[], type: 'before' | 'after' | 'damage' }) => {
    const typePhotos = photos.filter(p => p.photo_type === type);

    if (typePhotos.length === 0) {
      return (
        <div className="text-center py-6 sm:py-8">
          <Camera className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm sm:text-base text-gray-500">No {type} photos available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {typePhotos.map((photo) => (
          <PhotoItem key={photo.id} photo={photo} onSelect={setSelectedPhoto} />
        ))}
      </div>
    );
  };

  const PhotoItem = ({ photo, onSelect }: { photo: CleaningPhoto, onSelect: (path: string) => void }) => {
    const [imageUrl, setImageUrl] = useState<string>('');

    useEffect(() => {
      getPhotoUrl(photo.file_path).then(url => {
        if (url) setImageUrl(url);
      });
    }, [photo.file_path]);

    return (
      <div className="relative group">
      <div 
        className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => {
          const isPDF = photo.file_path.toLowerCase().endsWith('.pdf');
          if (isPDF) {
            getPhotoUrl(photo.file_path).then(url => {
              if (url) window.open(url, '_blank');
            });
          } else {
            onSelect(photo.file_path);
          }
        }}
      >
        {imageUrl ? (
          photo.file_path.toLowerCase().endsWith('.pdf') ? (
            <div className="w-full h-full bg-red-50 border-2 border-red-200 flex flex-col items-center justify-center">
              <svg className="h-8 w-8 text-red-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-red-600 text-center px-1">PDF Document</p>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={`${photo.photo_type} photo`}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
          </div>
        )}
      </div>
        
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              downloadPhoto(photo.file_path, `${photo.photo_type}_${photo.id}.jpg`);
            }}
            className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-xs"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {photo.photo_type === 'damage' && photo.damage_details && (
          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle className="h-3 w-3 text-orange-600" />
              <span className="font-medium text-orange-800">Damage Report</span>
            </div>
            <p className="text-orange-700 text-xs">{photo.damage_details}</p>
          </div>
        )}

        <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
          {new Date(photo.created_at).toLocaleDateString()}
        </p>
      </div>
    );
  };

  const PhotoViewer = ({ filePath, onClose }: { filePath: string, onClose: () => void }) => {
    const [imageUrl, setImageUrl] = useState<string>('');

    useEffect(() => {
      getPhotoUrl(filePath).then(url => {
        if (url) setImageUrl(url);
      });
    }, [filePath]);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
        <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </Button>
          
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Full size photo"
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
      </div>
    );
  };

  const beforePhotos = photos.filter(p => p.photo_type === 'before');
  const afterPhotos = photos.filter(p => p.photo_type === 'after');
  const damagePhotos = photos.filter(p => p.photo_type === 'damage');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
              Cleaning Photos
            </DialogTitle>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">{booking.address} ({booking.postcode})</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                {new Date(booking.date_time).toLocaleDateString()}
              </div>
              <Badge variant="outline" className="text-xs">{booking.service_type}</Badge>
            </div>
            {userRole === 'admin' && photos.length > 0 && (
              <Button
                onClick={copyPhotoLink}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                <Link2 className="h-4 w-4 mr-2" />
                Copy Link for Client
              </Button>
            )}
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Camera className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
                <p className="text-sm sm:text-base text-gray-500">Loading photos...</p>
              </div>
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-8">
              <Camera className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm sm:text-base text-gray-500">No photos available for this booking</p>
            </div>
          ) : (
            <Tabs defaultValue="before" className="w-full">
              <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
                <TabsTrigger value="before" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <span className="hidden sm:inline">Before Photos</span>
                  <span className="sm:hidden">Before</span>
                  {beforePhotos.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs px-1">
                      {beforePhotos.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="after" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <span className="hidden sm:inline">After Photos</span>
                  <span className="sm:hidden">After</span>
                  {afterPhotos.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs px-1">
                      {afterPhotos.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="damage" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Damage Reports</span>
                  <span className="sm:hidden">Damage</span>
                  {damagePhotos.length > 0 && (
                    <Badge variant="destructive" className="ml-1 text-[10px] sm:text-xs px-1">
                      {damagePhotos.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="before" className="mt-4 sm:mt-6">
                <PhotoGrid photos={photos} type="before" />
              </TabsContent>

              <TabsContent value="after" className="mt-4 sm:mt-6">
                <PhotoGrid photos={photos} type="after" />
              </TabsContent>

              <TabsContent value="damage" className="mt-4 sm:mt-6">
                {damagePhotos.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                      <h4 className="font-medium text-orange-800 text-sm sm:text-base">Damage Reports Found</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-orange-700">
                      The cleaner has reported {damagePhotos.length} issue(s) during the cleaning.
                    </p>
                  </div>
                )}
                <PhotoGrid photos={photos} type="damage" />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {selectedPhoto && (
        <PhotoViewer 
          filePath={selectedPhoto} 
          onClose={() => setSelectedPhoto(null)} 
        />
      )}
    </>
  );
};

export default CleaningPhotosViewDialog;
