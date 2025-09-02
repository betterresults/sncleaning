import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EmailNotificationOptions {
  bookingId: number;
  emailType: 'booking_confirmation' | 'booking_status_update' | 'booking_completion' | 'payment_reminder';
  customerName?: string;
  additionalVariables?: Record<string, string>;
}

export function useManualEmailNotification() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendManualEmail = async (options: EmailNotificationOptions) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('send_manual_booking_email', {
        p_booking_id: options.bookingId,
        p_email_type: options.emailType,
        p_additional_variables: options.additionalVariables || {}
      });

      if (error) throw error;

      const result = data as { success: boolean; message?: string; error?: string };
      
      if (result.success) {
        toast({
          title: "Email Sent",
          description: `Email notification sent successfully${options.customerName ? ` to ${options.customerName}` : ''}.`,
        });
        return true;
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error: any) {
      console.error('Error sending manual email:', error);
      toast({
        title: "Email Failed",
        description: error.message || 'Failed to send email notification.',
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendManualEmail,
    isLoading,
  };
}