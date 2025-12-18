import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SendPaymentSMSOptions {
  bookingId: number;
  phoneNumber: string;
  customerName: string;
  amount: number;
  bookingDate?: string;
  bookingTime?: string;
  totalHours?: number;
}

export function useSendPaymentSMS() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendPaymentSMS = async (options: SendPaymentSMSOptions) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-payment-sms', {
        body: {
          bookingId: options.bookingId,
          phoneNumber: options.phoneNumber,
          customerName: options.customerName,
          amount: options.amount,
          bookingDate: options.bookingDate,
          bookingTime: options.bookingTime,
          totalHours: options.totalHours,
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "SMS Sent",
          description: `Payment reminder sent to ${options.customerName}`,
        });
        return true;
      } else {
        throw new Error(data?.error || 'Failed to send SMS');
      }
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      toast({
        title: "SMS Failed",
        description: error.message || 'Failed to send payment reminder SMS.',
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendPaymentSMS,
    isLoading,
  };
}
