import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhotoFile {
  name: string;
  url: string;
}

const CustomerPhotos = () => {
  const { folderName } = useParams<{ folderName: string }>();
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (folderName) {
      fetchPhotos();
    }
  }, [folderName]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      
      // List all files in the folder
      const { data: files, error: listError } = await supabase.storage
        .from('cleaning.photos')
        .list(folderName, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (listError) {
        throw listError;
      }

      if (!files || files.length === 0) {
        setError('No photos found in this folder');
        return;
      }

      // Filter for image files and create URLs
      const imageFiles = files
        .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
        .map(file => ({
          name: file.name,
          url: supabase.storage
            .from('cleaning.photos')
            .getPublicUrl(`${folderName}/${file.name}`).data.publicUrl
        }));

      setPhotos(imageFiles);
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
            <Button onClick={() => window.history.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6">
          <Button 
            onClick={() => window.history.back()} 
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
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
            <Card key={photo.name} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <img
                    src={photo.url}
                    alt={`Cleaning photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                    <Button
                      onClick={() => downloadPhoto(photo.url, photo.name)}
                      size="sm"
                      className="bg-white text-black hover:bg-gray-100"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
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