import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncPaymentMethodsButtonProps {
  customerId?: number;
  onSyncComplete?: () => void;
}

const SyncPaymentMethodsButton: React.FC<SyncPaymentMethodsButtonProps> = ({ 
  customerId, 
  onSyncComplete 
}) => {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-customer-stripe-accounts', {
        body: customerId ? { customerId } : {}
      });
      
      if (error) throw error;

      toast({
        title: 'Sync Complete',
        description: `Processed ${data.customersProcessed} customers, added ${data.paymentMethodsAdded} payment methods`,
      });

      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync payment methods',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={syncing}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Syncing...' : 'Sync Payment Methods'}
    </Button>
  );
};

export default SyncPaymentMethodsButton;