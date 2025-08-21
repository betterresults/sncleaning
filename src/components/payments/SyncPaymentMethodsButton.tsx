import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

interface SyncPaymentMethodsButtonProps {
  customerId?: number;
  onSyncComplete?: () => void;
}

export const SyncPaymentMethodsButton: React.FC<SyncPaymentMethodsButtonProps> = ({
  customerId,
  onSyncComplete
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setLoading(true);
    try {
      console.log('Syncing payment methods...', { customerId });
      
      const { data, error } = await supabase.functions.invoke('sync-customer-payment-methods', {
        body: customerId ? { customer_id: customerId } : { sync_all: true }
      });

      if (error) {
        console.error('Error syncing payment methods:', error);
        toast({
          title: "Error",
          description: `Failed to sync payment methods: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('Sync complete:', data);
      
      toast({
        title: "Sync Complete",
        description: `Synced ${data.synced_count} payment methods for ${data.total_customers_processed} customers. ${data.error_count} errors.`,
      });

      if (onSyncComplete) {
        onSyncComplete();
      }

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: `Failed to sync payment methods: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSync} 
      disabled={loading}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Syncing...' : customerId ? 'Sync Payment Methods' : 'Sync All Payment Methods'}
    </Button>
  );
};