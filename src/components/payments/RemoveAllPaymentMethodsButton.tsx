import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Trash2 } from 'lucide-react';

interface RemoveAllPaymentMethodsButtonProps {
  onRemoveComplete?: () => void;
}

const RemoveAllPaymentMethodsButton = ({ onRemoveComplete }: RemoveAllPaymentMethodsButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const removeAllPaymentMethods = async () => {
    if (!confirm('Are you sure you want to remove ALL payment methods from ALL customers? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('customer_payment_methods')
        .delete()
        .neq('id', ''); // Delete all records

      if (error) {
        console.error('Error removing payment methods:', error);
        throw error;
      }
      
      toast({
        title: "Success",
        description: "All payment methods removed successfully!",
      });

      if (onRemoveComplete) {
        onRemoveComplete();
      }

    } catch (error: any) {
      console.error('Error removing payment methods:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove payment methods",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={removeAllPaymentMethods}
      disabled={loading}
      variant="outline"
      size="sm"
      className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
      {loading ? 'Removing...' : 'Remove All Payment Methods'}
    </Button>
  );
};

export default RemoveAllPaymentMethodsButton;