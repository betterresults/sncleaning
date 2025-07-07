
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Download, AlertTriangle, Calendar, MapPin, X } from 'lucide-react';

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
  const [photos, setPhotos] = useState<CleaningPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cleaning_photos')
        .select('*')
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: true });

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

  const PhotoGrid = ({ photos, type }: { photos: CleaningPhoto[], type: 'before' | 'after' | 'damage' }) => {
    const typePhotos = photos.filter(p => p.photo_type === type);

    if (typePhotos.length === 0) {
      return (
        <div className="text-center py-8">
          <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No {type} photos available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
          onClick={() => onSelect(photo.file_path)}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${photo.photo_type} photo`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              downloadPhoto(photo.file_path, `${photo.photo_type}_${photo.id}.jpg`);
            }}
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {photo.photo_type === 'damage' && photo.damage_details && (
          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle className="h-3 w-3 text-orange-600" />
              <span className="font-medium text-orange-800">Damage Report</span>
            </div>
            <p className="text-orange-700">{photo.damage_details}</p>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-1">
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Cleaning Photos
            </DialogTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {booking.address} ({booking.postcode})
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(booking.date_time).toLocaleDateString()}
              </div>
              <Badge variant="outline">{booking.service_type}</Badge>
            </div>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
                <p className="text-gray-500">Loading photos...</p>
              </div>
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No photos available for this booking</p>
            </div>
          ) : (
            <Tabs defaultValue="before" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="before" className="flex items-center gap-2">
                  Before Photos
                  {beforePhotos.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {beforePhotos.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="after" className="flex items-center gap-2">
                  After Photos
                  {afterPhotos.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {afterPhotos.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="damage" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Damage Reports
                  {damagePhotos.length > 0 && (
                    <Badge variant="destructive" className="ml-1 text-xs">
                      {damagePhotos.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="before" className="mt-6">
                <PhotoGrid photos={photos} type="before" />
              </TabsContent>

              <TabsContent value="after" className="mt-6">
                <PhotoGrid photos={photos} type="after" />
              </TabsContent>

              <TabsContent value="damage" className="mt-6">
                {damagePhotos.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <h4 className="font-medium text-orange-800">Damage Reports Found</h4>
                    </div>
                    <p className="text-sm text-orange-700">
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
