import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload } from 'lucide-react';

interface StorageTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StorageTestDialog = ({ open, onOpenChange }: StorageTestDialogProps) => {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);

  const testStorageUpload = async () => {
    setTesting(true);
    console.log('Starting storage test...');

    try {
      // Create a simple test file
      const testContent = 'This is a test file for storage';
      const testFile = new Blob([testContent], { type: 'text/plain' });
      const fileName = `test_${Date.now()}.txt`;
      const filePath = `test_folder/${fileName}`;

      console.log('Attempting to upload test file:', { filePath, size: testFile.size });

      // Try to upload to the cleaning.photos bucket
      const { data, error } = await supabase.storage
        .from('cleaning.photos')
        .upload(filePath, testFile);

      if (error) {
        console.error('Storage upload failed:', error);
        toast({
          title: 'Storage Test Failed',
          description: `Error: ${error.message}`,
          variant: 'destructive'
        });
      } else {
        console.log('Storage upload successful:', data);
        toast({
          title: 'Storage Test Successful',
          description: `File uploaded successfully: ${data.path}`
        });

        // Try to get the URL
        const { data: urlData } = await supabase.storage
          .from('cleaning.photos')
          .getPublicUrl(filePath);

        console.log('Public URL:', urlData.publicUrl);

        // Clean up - delete the test file
        await supabase.storage
          .from('cleaning.photos')
          .remove([filePath]);
      }
    } catch (error) {
      console.error('Storage test error:', error);
      toast({
        title: 'Storage Test Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Storage Test
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will test if the storage bucket is working properly.
          </p>

          <Button 
            onClick={testStorageUpload} 
            disabled={testing}
            className="w-full"
          >
            {testing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Testing...
              </div>
            ) : (
              'Test Storage Upload'
            )}
          </Button>

          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={testing}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StorageTestDialog;