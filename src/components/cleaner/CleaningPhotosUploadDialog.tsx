
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
  const [beforeFiles, setBeforeFiles] = useState<File[]>([]);
  const [afterFiles, setAfterFiles] = useState<File[]>([]);
  const [damageFiles, setDamageFiles] = useState<File[]>([]);
  const [damageDetails, setDamageDetails] = useState('');
  const [showDamageTab, setShowDamageTab] = useState(false);

  const bookingDate = new Date(booking.date_time).toISOString().split('T')[0];
  const folderPath = `${booking.postcode}_${bookingDate}_${booking.customer}`;

  const handleFileSelect = (files: FileList | null, type: 'before' | 'after' | 'damage') => {
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
      case 'damage':
        setDamageFiles(prev => [...prev, ...fileArray]);
        break;
    }
  };

  const removeFile = (index: number, type: 'before' | 'after' | 'damage') => {
    switch (type) {
      case 'before':
        setBeforeFiles(prev => prev.filter((_, i) => i !== index));
        break;
      case 'after':
        setAfterFiles(prev => prev.filter((_, i) => i !== index));
        break;
      case 'damage':
        setDamageFiles(prev => prev.filter((_, i) => i !== index));
        break;
    }
  };

  const uploadFiles = async (files: File[], photoType: 'before' | 'after' | 'damage') => {
    const uploadPromises = files.map(async (file, index) => {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${index}_${file.name}`;
      const filePath = `${folderPath}/${photoType}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('cleaning.photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

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
          damage_details: photoType === 'damage' ? damageDetails : null
        });

      if (dbError) throw dbError;

      return filePath;
    });

    return Promise.all(uploadPromises);
  };

  const handleUpload = async () => {
    if (!beforeFiles.length && !afterFiles.length && !damageFiles.length) {
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

      if (damageFiles.length > 0) {
        if (!damageDetails.trim()) {
          toast({
            title: 'Damage Details Required',
            description: 'Please provide details about the damage.',
            variant: 'destructive'
          });
          setUploading(false);
          return;
        }
        uploadPromises.push(uploadFiles(damageFiles, 'damage'));
      }

      await Promise.all(uploadPromises);

      toast({
        title: 'Photos Uploaded Successfully',
        description: `Uploaded ${beforeFiles.length + afterFiles.length + damageFiles.length} photos.`
      });

      // Reset form
      setBeforeFiles([]);
      setAfterFiles([]);
      setDamageFiles([]);
      setDamageDetails('');
      setShowDamageTab(false);
      onOpenChange(false);

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

  const FileUploadArea = ({ type, files, onFileSelect, onRemove }: {
    type: 'before' | 'after' | 'damage';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Cleaning Photos
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Booking #{booking.id} - {booking.postcode} ({bookingDate})
          </p>
        </DialogHeader>

        <Tabs defaultValue="before" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="before">Before Photos</TabsTrigger>
            <TabsTrigger value="after">After Photos</TabsTrigger>
            <TabsTrigger 
              value="damage" 
              className={showDamageTab ? "text-orange-600" : ""}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Damage Report
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

          <TabsContent value="damage" className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <h4 className="font-medium text-orange-800">Damage Report</h4>
              </div>
              <p className="text-sm text-orange-700">
                Use this section only if you need to report any damages or issues found during cleaning.
              </p>
            </div>

            {!showDamageTab ? (
              <Button
                variant="outline"
                onClick={() => setShowDamageTab(true)}
                className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report Damage or Issues
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="damage-details">Damage Details *</Label>
                  <Textarea
                    id="damage-details"
                    placeholder="Describe the damage or issue in detail..."
                    value={damageDetails}
                    onChange={(e) => setDamageDetails(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <FileUploadArea
                  type="damage"
                  files={damageFiles}
                  onFileSelect={(files) => handleFileSelect(files, 'damage')}
                  onRemove={(index) => removeFile(index, 'damage')}
                />

                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowDamageTab(false);
                    setDamageFiles([]);
                    setDamageDetails('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cancel Damage Report
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Photos'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CleaningPhotosUploadDialog;
