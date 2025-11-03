import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Booking {
  id: number;
  total_cost: number;
  payment_status: string;
  first_name: string;
  last_name: string;
  invoice_id?: string;
}

interface AdjustPaymentParams {
  bookingId: number;
  newAmount: number;
  reason: string;
  action?: 'adjust' | 'reauthorize';
}

export const usePaymentAdjustment = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const adjustPaymentAmount = async ({ bookingId, newAmount, reason, action = 'adjust' }: AdjustPaymentParams) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('stripe-adjust-payment-amount', {
        body: {
          bookingId,
          newAmount,
          reason,
          action
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to adjust payment amount');
      }

      const actionText = action === 'reauthorize' 
        ? 'Authorization cancelled and new authorization created'
        : 'Additional amount authorized';
      
      toast({
        title: "Payment Adjusted Successfully",
        description: `${actionText} - New total: £${newAmount}`,
      });

      return data;
      
    } catch (error) {
      console.error('Error adjusting payment amount:', error);
      toast({
        title: "Adjustment Failed",
        description: error.message || "Failed to adjust payment amount",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const canAdjustPayment = (booking: Booking): { canAdjust: boolean; reason?: string } => {
    // Check if payment can be adjusted based on current status
    const allowedStatuses = ['authorized', 'unpaid', 'pending'];
    
    if (!allowedStatuses.includes(booking.payment_status?.toLowerCase())) {
      return {
        canAdjust: false,
        reason: `Cannot adjust payment for ${booking.payment_status} bookings`
      };
    }

    if (!booking.total_cost || booking.total_cost <= 0) {
      return {
        canAdjust: false,
        reason: 'Invalid booking amount'
      };
    }

    return { canAdjust: true };
  };

  return {
    adjustPaymentAmount,
    canAdjustPayment,
    loading
  };
};