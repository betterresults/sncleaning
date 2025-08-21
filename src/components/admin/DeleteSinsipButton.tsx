import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

const DeleteSinsipButton = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const deleteSinsipCustomer = async () => {
    if (!confirm('Are you sure you want to delete the sinsip.2014@gmail.com customer completely?')) {
      return;
    }

    setLoading(true);
    try {
      // Delete the business customer (id 28)
      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        body: { user_id: "28" }
      });

      if (error) {
        console.error('Error calling delete function:', error);
        throw error;
      }

      console.log('Delete response:', data);
      
      toast({
        title: "Success",
        description: "Customer sinsip.2014@gmail.com deleted successfully!",
      });

    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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