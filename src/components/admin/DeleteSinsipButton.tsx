import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

const DeleteSinsipButton = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const deleteSinsipCustomer = async () => {
    if (!confirm('Are you sure you want to delete ALL sinsip.2014@gmail.com records (both auth user and business customer)?')) {
      return;
    }

    setLoading(true);
    try {
      console.log('Starting deletion of sinsip.2014@gmail.com records...');
      
      // Delete both the auth user and business customer
      const promises = [
        // Delete auth user
        supabase.functions.invoke('delete-user-account', {
          body: { user_id: "fab3fdc7-d43e-41d6-b40f-509de9c5e6d0" }
        }),
        // Delete business customer
        supabase.functions.invoke('delete-user-account', {
          body: { user_id: "28" }
        })
      ];

      const results = await Promise.allSettled(promises);
      
      console.log('Delete results:', results);
      
      // Check results
      let successCount = 0;
      let errors = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && !result.value.error) {
          successCount++;
          console.log(`Delete ${index === 0 ? 'auth user' : 'business customer'} successful:`, result.value.data);
        } else {
          const error = result.status === 'rejected' ? result.reason : result.value.error;
          console.error(`Delete ${index === 0 ? 'auth user' : 'business customer'} failed:`, error);
          errors.push(`${index === 0 ? 'Auth user' : 'Business customer'}: ${error.message || error}`);
        }
      });
      
      if (successCount > 0) {
        toast({
          title: "Success", 
          description: `Deleted ${successCount}/2 sinsip.2014@gmail.com records${errors.length > 0 ? '. Some errors occurred.' : ''}`,
        });
      } else {
        throw new Error(`All deletions failed: ${errors.join(', ')}`);
      }

    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      
      // Force refresh the page after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <Button
      onClick={deleteSinsipCustomer}
      disabled={loading}
      variant="destructive"
      size="sm"
      className="flex items-center gap-2"
    >
      <Trash2 className="h-4 w-4" />
      {loading ? 'Deleting...' : 'Delete Sinsip Customer'}
    </Button>
  );
};

export default DeleteSinsipButton;