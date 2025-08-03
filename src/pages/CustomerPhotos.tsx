import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Download, ArrowLeft, Home, Expand, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhotoFile {
  name: string;
  url: string;
  type?: string;
}

const CustomerPhotos = () => {
  const { folderName } = useParams<{ folderName: string }>();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (folderName) {
      fetchPhotos();
    }
  }, [folderName]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching photos for folder:', folderName);
      
      // First, try to list the main folder
      const { data: mainFiles, error: mainError } = await supabase.storage
        .from('cleaning.photos')
        .list(folderName, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      let allFiles: any[] = [];

      if (mainError) {
        console.error('Error listing main folder:', mainError);
        throw mainError;
      }

      console.log('Main folder contents:', mainFiles);

      if (mainFiles && mainFiles.length > 0) {
        // Check for subfolders (before, after, damage, etc.)
        const subfolders = mainFiles.filter(file => file.name && !file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i));
        const directImages = mainFiles.filter(file => file.name && file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i));
        
        // Add direct images
        allFiles.push(...directImages.map(file => ({
          name: file.name,
          fullPath: `${folderName}/${file.name}`,
          type: 'general'
        })));

        // Check subfolders for images
        for (const subfolder of subfolders) {
          const { data: subFiles } = await supabase.storage
            .from('cleaning.photos')
            .list(`${folderName}/${subfolder.name}`, {
              limit: 100,
              sortBy: { column: 'name', order: 'asc' }
            });

          if (subFiles) {
            const subImages = subFiles.filter(file => file.name && file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i));
            allFiles.push(...subImages.map(file => ({
              name: file.name,
              fullPath: `${folderName}/${subfolder.name}/${file.name}`,
              type: subfolder.name
            })));
          }
        }
      }

      console.log('All found files:', allFiles);

      if (allFiles.length === 0) {
        setError('No photos found in this folder');
        return;
      }

      // Create photo objects with public URLs
      const photoFiles = allFiles.map(file => ({
        name: `${file.type !== 'general' ? file.type + '/' : ''}${file.name}`,
        url: supabase.storage
          .from('cleaning.photos')
          .getPublicUrl(file.fullPath).data.publicUrl,
        type: file.type
      }));

      console.log('Photo URLs generated:', photoFiles);
      setPhotos(photoFiles);
    } catch (err: any) {
      console.error('Error fetching photos:', err);
      setError(`Failed to load photos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadPhoto = async (photoUrl: string, fileName: string) => {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: `Downloading ${fileName}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the photo",
        variant: "destructive",
      });
    }
  };

  const openGallery = (index: number) => {
    setSelectedPhotoIndex(index);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
    setSelectedPhotoIndex(null);
  };

  const goToPrevious = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') closeGallery();
  };

  if (!folderName) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your cleaning photos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.history.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => navigate('/')} variant="default">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={() => window.history.back()} 
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              variant="default"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Your Cleaning Photos
            </h1>
            <p className="text-muted-foreground mb-1">
              Service completed on {folderName.includes('_') ? folderName.split('_')[1] : 'your selected date'}
            </p>
            <p className="text-sm text-muted-foreground">
              {photos.length} photo{photos.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {photos.map((photo, index) => (
            <Card key={photo.name} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-0">
                <div className="aspect-square relative" onClick={() => openGallery(index)}>
                  <img
                    src={photo.url}
                    alt={`Cleaning photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                    <div className="flex gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          openGallery(index);
                        }}
                        size="sm"
                        className="bg-white text-black hover:bg-gray-100"
                      >
                        <Expand className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadPhoto(photo.url, photo.name);
                        }}
                        size="sm"
                        className="bg-white text-black hover:bg-gray-100"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm text-muted-foreground truncate">
                    {photo.name}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Screen Gallery */}
        {isGalleryOpen && selectedPhotoIndex !== null && (
          <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
            <DialogContent 
              className="max-w-screen-xl w-screen h-screen p-0 bg-black/95"
              onKeyDown={handleKeyDown}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Close Button */}
                <button
                  onClick={closeGallery}
                  className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>

                {/* Navigation Buttons */}
                {selectedPhotoIndex > 0 && (
                  <button
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>
                )}

                {selectedPhotoIndex < photos.length - 1 && (
                  <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                )}

                {/* Photo */}
                <img
                  src={photos[selectedPhotoIndex].url}
                  alt={`Cleaning photo ${selectedPhotoIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />

                {/* Photo Info */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold">
                        Photo {selectedPhotoIndex + 1} of {photos.length}
                      </p>
                      <p className="text-sm opacity-80">
                        {photos[selectedPhotoIndex].name}
                      </p>
                    </div>
                    <Button
                      onClick={() => downloadPhoto(photos[selectedPhotoIndex].url, photos[selectedPhotoIndex].name)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {photos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No photos found in this folder.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPhotos;