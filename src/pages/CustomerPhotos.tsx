import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  Download, ArrowLeft, Home, X, ChevronLeft, ChevronRight, 
  FolderOpen, Share, Archive, Eye, Grid3x3, Image as ImageIcon, FileText 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhotoFile {
  name: string;
  url: string;
  type?: string;
  fullPath: string;
  isPdf?: boolean;
}

interface PhotoFolder {
  name: string;
  photos: PhotoFile[];
  count: number;
}

interface BookingInfo {
  address: string;
  postcode: string;
  date_only: string;
}

const CustomerPhotos = () => {
  const { folderName } = useParams<{ folderName: string }>();
  const navigate = useNavigate();
  const [allPhotos, setAllPhotos] = useState<PhotoFile[]>([]);
  const [photoFolders, setPhotoFolders] = useState<PhotoFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [currentPhotos, setCurrentPhotos] = useState<PhotoFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'folders' | 'grid'>('folders');
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (folderName) {
      fetchPhotos();
      fetchBookingInfo();
    }
  }, [folderName]);

  const fetchBookingInfo = async () => {
    try {
      // Extract booking ID from folder name (format: bookingId_postcode_date_time)
      const bookingIdStr = folderName?.split('_')[0];
      if (!bookingIdStr) return;
      
      const bookingId = parseInt(bookingIdStr, 10);
      if (isNaN(bookingId)) return;

      const { data, error } = await supabase
        .from('bookings')
        .select('address, postcode, date_only')
        .eq('id', bookingId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching booking info:', error);
        return;
      }

      if (data) {
        setBookingInfo(data);
      }
    } catch (err) {
      console.error('Error fetching booking info:', err);
    }
  };

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching photos for folder:', folderName);

      // Try multiple variants of the folder to handle special/nbsp spaces in postcodes
      const candidates = Array.from(new Set([
        folderName || '',
        (folderName || '').replace(/\u00A0/g, ' '), // NBSP to normal space
        (folderName || '').replace(/[\u00A0 ]+/g, ''), // remove all spaces
      ].filter(Boolean)));

      let usedFolder = candidates[0];
      let mainFiles: any[] | null = null;
      let mainError: any = null;

      for (const cand of candidates) {
        const { data, error } = await supabase.storage
          .from('cleaning.photos')
          .list(cand, {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (error) {
          mainError = error;
          continue;
        }

        // Prefer the first candidate that returns files
        if (data && data.length > 0) {
          mainFiles = data;
          usedFolder = cand;
          break;
        }

        // If no files, keep the last empty result in case all are empty
        if (data) {
          mainFiles = data;
          usedFolder = cand;
        }
      }

      if (mainError && !mainFiles) {
        console.error('Error listing folder variants:', mainError);
        throw mainError;
      }

      let allFiles: PhotoFile[] = [];

      console.log('Resolved folder:', usedFolder);
      console.log('Main folder contents:', mainFiles);

      if (mainFiles && mainFiles.length > 0) {
        // Check for subfolders (before, after, damage, etc.)
        const subfolders = mainFiles.filter(file => file.name && !file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i));
        const directImages = mainFiles.filter(file => file.name && file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i));
        
        // Add direct images
        allFiles.push(...directImages.map(file => ({
          name: file.name,
          fullPath: `${usedFolder}/${file.name}`,
          url: supabase.storage.from('cleaning.photos').getPublicUrl(`${usedFolder}/${file.name}`).data.publicUrl,
          type: 'general'
        })));

        // Check subfolders for images and PDFs
        for (const subfolder of subfolders) {
          const { data: subFiles } = await supabase.storage
            .from('cleaning.photos')
            .list(`${usedFolder}/${subfolder.name}`, {
              limit: 100,
              sortBy: { column: 'name', order: 'asc' }
            });

          if (subFiles) {
            const wanted = subFiles.filter(file => file.name && (/(jpg|jpeg|png|gif|webp)$/i.test(file.name) || /\.pdf$/i.test(file.name)));
            allFiles.push(...wanted.map(file => ({
              name: file.name,
              fullPath: `${usedFolder}/${subfolder.name}/${file.name}`,
              url: supabase.storage.from('cleaning.photos').getPublicUrl(`${usedFolder}/${subfolder.name}/${file.name}`).data.publicUrl,
              type: subfolder.name,
              isPdf: /\.pdf$/i.test(file.name)
            })));
          }
        }
      }

      console.log('All found files:', allFiles);

      if (allFiles.length === 0) {
        setError('No photos found in this folder');
        return;
      }

      // Group photos by folder
      const folders: { [key: string]: PhotoFile[] } = {};
      allFiles.forEach(photo => {
        const folderType = photo.type || 'general';
        if (!folders[folderType]) {
          folders[folderType] = [];
        }
        folders[folderType].push(photo);
      });

      const folderArray = Object.entries(folders).map(([name, photos]) => ({
        name: name === 'general' ? 'All Photos' : name.charAt(0).toUpperCase() + name.slice(1),
        photos,
        count: photos.length
      }));

      setAllPhotos(allFiles);
      setPhotoFolders(folderArray);
      setCurrentPhotos(allFiles); // Show all photos by default
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

  const downloadAllPhotos = async () => {
    if (currentPhotos.length === 0) return;
    
    toast({
      title: "Download Started",
      description: `Downloading ${currentPhotos.length} photos...`,
    });

    for (const photo of currentPhotos) {
      await downloadPhoto(photo.url, photo.name);
      // Small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const sharePhotos = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cleaning Photos',
          text: `Check out these cleaning photos from your service!`,
          url: shareUrl,
        });
        toast({
          title: "Shared Successfully",
          description: "Photos shared successfully!",
        });
      } catch (error) {
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Link Copied",
        description: "Photo link copied to clipboard!",
      });
    });
  };

  const selectFolder = (folder: PhotoFolder) => {
    setSelectedFolder(folder.name);
    setCurrentPhotos(folder.photos);
    setViewMode('grid');
  };

  const backToFolders = () => {
    setSelectedFolder(null);
    setCurrentPhotos(allPhotos);
    setViewMode('folders');
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
    const images = currentPhotos.filter(p => !p.isPdf);
    if (selectedPhotoIndex !== null && selectedPhotoIndex < images.length - 1) {
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
        {/* Header */}
        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={selectedFolder ? backToFolders : () => window.history.back()} 
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {selectedFolder ? 'Back to Folders' : 'Back'}
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              variant="default"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            
            {/* Action Buttons */}
            <div className="ml-auto flex gap-2">
              <Button onClick={sharePhotos} variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button onClick={downloadAllPhotos} variant="outline" size="sm">
                <Archive className="h-4 w-4 mr-2" />
                Download All ({currentPhotos.length})
              </Button>
              <Button 
                onClick={() => setViewMode(viewMode === 'folders' ? 'grid' : 'folders')}
                variant="outline" 
                size="sm"
              >
                {viewMode === 'folders' ? <Grid3x3 className="h-4 w-4" /> : <FolderOpen className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {selectedFolder || 'Your Cleaning Photos'}
            </h1>
            <p className="text-muted-foreground mb-1">
              Service completed on {bookingInfo?.date_only || (folderName?.includes('_') ? folderName.split('_')[2] : 'your selected date')}
            </p>
            {bookingInfo && (
              <p className="text-muted-foreground mb-1">
                <strong>Address:</strong> {bookingInfo.address}, {bookingInfo.postcode}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {selectedFolder 
                ? `${currentPhotos.length} photo${currentPhotos.length !== 1 ? 's' : ''} in ${selectedFolder}`
                : `${allPhotos.length} photo${allPhotos.length !== 1 ? 's' : ''} total • ${photoFolders.length} folder${photoFolders.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>

        {/* Folder View */}
        {viewMode === 'folders' && !selectedFolder && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {photoFolders.map((folder) => (
              <Card 
                key={folder.name} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer group animate-fade-in"
                onClick={() => selectFolder(folder)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <FolderOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{folder.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {folder.count} photo{folder.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  
                  {/* Preview thumbnails */}
                  <div className="grid grid-cols-3 gap-2">
                    {folder.photos.slice(0, 3).map((photo, index) => (
                      <div key={index} className="aspect-square rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                        {photo.isPdf ? (
                          <div className="w-full h-full bg-red-50 border-2 border-red-200 flex flex-col items-center justify-center text-red-700">
                            <FileText className="h-6 w-6 mb-1" />
                            <span className="text-xs">PDF</span>
                          </div>
                        ) : (
                          <img
                            src={photo.url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover hover-scale"
                          />
                        )}
                      </div>
                    ))}
                    {folder.photos.length > 3 && (
                      <div className="aspect-square rounded-md bg-gray-100 flex items-center justify-center">
                        <span className="text-sm text-muted-foreground font-medium">
                          +{folder.photos.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Photo Grid */}
        {(viewMode === 'grid' || selectedFolder) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentPhotos.map((photo, index) => (
              <Card key={photo.name} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group animate-fade-in">
                <CardContent className="p-0">
                  <div className="aspect-square relative" onClick={() => {
                    if (photo.isPdf) {
                      window.open(photo.url, '_blank');
                    } else {
                      const images = currentPhotos.filter(p => !p.isPdf);
                      const imageIndex = images.findIndex(p => p.fullPath === photo.fullPath);
                      openGallery(imageIndex);
                    }
                  }}>
                    {photo.isPdf ? (
                      <div className="w-full h-full bg-red-50 border-2 border-red-200 flex flex-col items-center justify-center text-red-700">
                        <FileText className="h-10 w-10 mb-2" />
                        <span className="text-sm font-medium">PDF Document</span>
                      </div>
                    ) : (
                      <img
                        src={photo.url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (photo.isPdf) {
                              window.open(photo.url, '_blank');
                            } else {
                              const images = currentPhotos.filter(p => !p.isPdf);
                              const imageIndex = images.findIndex(p => p.fullPath === photo.fullPath);
                              openGallery(imageIndex);
                            }
                          }}
                          size="sm"
                          className="bg-white/90 text-black hover:bg-white backdrop-blur-sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {photo.isPdf ? 'Open' : 'View'}
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadPhoto(photo.url, photo.name);
                          }}
                          size="sm"
                          className="bg-white/90 text-black hover:bg-white backdrop-blur-sm"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-muted-foreground truncate">
                      {photo.name}
                    </p>
                    {photo.type && photo.type !== 'general' && (
                      <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded-full mt-1">
                        {photo.type}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Photos Message */}
        {currentPhotos.length === 0 && !loading && (
          <div className="text-center py-12">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-muted-foreground">No photos found in this folder.</p>
          </div>
        )}

        {/* Enhanced Full Screen Gallery */}
        {isGalleryOpen && selectedPhotoIndex !== null && (
          <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
            <DialogContent 
              className="max-w-none w-screen h-screen p-0 bg-black border-0 m-0"
              onKeyDown={handleKeyDown}
            >
              <div className="relative w-full h-full flex flex-col">
                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                  <div className="text-white">
                    <p className="text-xl font-semibold">
                      Photo {selectedPhotoIndex + 1} of {currentPhotos.filter(p => !p.isPdf).length}
                    </p>
                    <p className="text-sm opacity-80 mt-1">
                      {currentPhotos.filter(p => !p.isPdf)[selectedPhotoIndex].name}
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={() => downloadPhoto(currentPhotos.filter(p => !p.isPdf)[selectedPhotoIndex].url, currentPhotos.filter(p => !p.isPdf)[selectedPhotoIndex].name)}
                      size="sm"
                      className="bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    
                    <button
                      onClick={closeGallery}
                      className="p-2 bg-white/10 border border-white/20 text-white rounded-md hover:bg-white/20 transition-all backdrop-blur-sm"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Navigation Buttons */}
                {selectedPhotoIndex > 0 && (
                  <button
                    onClick={goToPrevious}
                    className="absolute left-6 top-1/2 -translate-y-1/2 z-50 p-4 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all backdrop-blur-sm border border-white/20"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>
                )}

                {selectedPhotoIndex < currentPhotos.length - 1 && (
                  <button
                    onClick={goToNext}
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-50 p-4 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all backdrop-blur-sm border border-white/20"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                )}

                {/* Main Photo Container */}
                <div className="flex-1 flex items-center justify-center p-6 pt-24 pb-24">
                  <div className="relative max-w-full max-h-full">
                    <img
                      src={currentPhotos[selectedPhotoIndex].url}
                      alt={`Photo ${selectedPhotoIndex + 1}`}
                      className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl"
                      style={{ maxHeight: 'calc(100vh - 12rem)' }}
                    />
                  </div>
                </div>

                {/* Thumbnail Strip */}
                <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6">
                  <div className="flex justify-center">
                    <div className="flex gap-3 overflow-x-auto max-w-full pb-2" style={{ scrollbarWidth: 'thin' }}>
                      {currentPhotos.map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedPhotoIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            index === selectedPhotoIndex 
                              ? 'border-white shadow-lg scale-110 ring-2 ring-white/50' 
                              : 'border-white/30 hover:border-white/60 hover:scale-105'
                          }`}
                        >
                          <img
                            src={photo.url}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Navigation hint */}
                  <div className="text-center mt-3">
                    <p className="text-white/60 text-sm">
                      Use arrow keys or click thumbnails to navigate • ESC to close
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default CustomerPhotos;