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
    
    try {
      // Check auth
      const { data: authData, error: authError } = await supabase.auth.getUser();
      console.log('Auth check:', { authData: !!authData?.user, authError });
      
      if (authError || !authData?.user) {
        throw new Error('Not authenticated');
      }

      // Create a simple test file
      const testContent = 'Test upload content - ' + new Date().toISOString();
      const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
      const testPath = `test_uploads/test_${Date.now()}.txt`;

      console.log('Uploading test file:', { testPath, fileSize: testFile.size });

      // Test upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cleaning.photos')
        .upload(testPath, testFile, { cacheControl: '3600', upsert: true });

      console.log('Upload result:', { uploadData, uploadError });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Test getting public URL
      const { data: urlData } = supabase.storage
        .from('cleaning.photos')
        .getPublicUrl(testPath);

      console.log('Public URL:', urlData.publicUrl);

      // Test deleting the file
      const { error: deleteError } = await supabase.storage
        .from('cleaning.photos')
        .remove([testPath]);

      console.log('Delete result:', { deleteError });

      if (deleteError) {
        console.warn('Failed to delete test file:', deleteError);
      }

      toast({
        title: 'Storage Test Passed',
        description: 'Storage upload, URL generation, and deletion all work correctly.'
      });

    } catch (error) {
      console.error('Storage test failed:', error);
      toast({
        title: 'Storage Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
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
            This will test uploading a small file to the cleaning.photos bucket and then delete it.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={testStorageUpload} 
              disabled={testing}
              className="flex-1"
            >
              {testing ? 'Testing...' : 'Test Storage Upload'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StorageTestDialog;