import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCcw } from 'lucide-react';
import PaymentMethodManager from './PaymentMethodManager';
import { AdminCustomerProvider, useAdminCustomer } from '@/contexts/AdminCustomerContext';

interface CustomerPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  customerName: string;
  customerEmail: string;
  onPaymentMethodsChange?: () => void;
}

// Payment Manager Wrapper with Customer Context
const PaymentManagerWithCustomer = ({ customerId }: { customerId: number }) => {
  const { setSelectedCustomerId } = useAdminCustomer();
  
  useEffect(() => {
    setSelectedCustomerId(customerId);
    return () => setSelectedCustomerId(null);
  }, [customerId, setSelectedCustomerId]);

  return <PaymentMethodManager />;
};

const CustomerPaymentDialog = ({ 
  open, 
  onOpenChange, 
  customerId, 
  customerName, 
  customerEmail,
  onPaymentMethodsChange 
}: CustomerPaymentDialogProps) => {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const handleSyncStripe = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-customer-stripe-accounts', {
        body: { customerId: customerId }  // Send specific customer ID
      });
      
      if (error) throw error;
      
      toast({
        title: "Sync Complete",
        description: `Synced ${data.customersProcessed} customers. Added ${data.paymentMethodsAdded} payment methods.`,
      });
      
      // Trigger refresh of payment methods
      if (onPaymentMethodsChange) {
        onPaymentMethodsChange();
      }
    } catch (error) {
      console.error('Error syncing with Stripe:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync with Stripe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Payment Methods for {customerName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">{customerName}</p>
              <p className="text-sm text-muted-foreground">{customerEmail}</p>
              <p className="text-sm text-muted-foreground">Customer ID: {customerId}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncStripe}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-2" />
              )}
              Sync with Stripe
            </Button>
          </div>

          {/* Wrap with AdminCustomerProvider to manage customer context */}
          <AdminCustomerProvider>
            <PaymentManagerWithCustomer customerId={customerId} />
          </AdminCustomerProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerPaymentDialog;