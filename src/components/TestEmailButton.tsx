import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

export const TestEmailButton = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendTestPhotoEmail = async () => {
    setLoading(true);
    try {
      console.log('Testing photo notification for booking 108248...');
      
      const { data, error } = await supabase.functions.invoke('send-photo-notification', {
        body: {
          booking_id: 108248,
          customer_email: 'test@example.com',
          customer_name: 'Test Customer',
          service_type: 'Standard Cleaning',
          booking_date: '2025-01-03',
          photo_count: 16,
          photo_folder_path: 'SE164NF_2025-01-03_108248'
        }
      });

      if (error) {
        console.error('Error sending photo notification:', error);
        toast({
          title: "Error",
          description: `Failed to send notification: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('Photo notification sent successfully:', data);
        toast({
          title: "Success",
          description: "Photo notification sent successfully to customer and sales emails!",
        });
      }
    } catch (error: any) {
      console.error('Photo notification test error:', error);
      toast({
        title: "Error",
        description: `Failed to send test notification: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: {
          email: 'sinsip.2014@gmail.com',
          customerName: 'Test Customer',
          bookingDetails: {
            service: 'Deep Cleaning Service',
            date: new Date().toLocaleDateString(),
            address: '123 Test Street, Test City'
          }
        }
      });

      if (error) {
        console.error('Error sending test email:', error);
        toast({
          title: "Error",
          description: `Failed to send test email: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('Test email sent successfully:', data);
        toast({
          title: "Success",
          description: "Test email sent to sinsip.2014@gmail.com",
        });
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: `Failed to send test email: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        onClick={sendTestEmail} 
        disabled={loading}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Mail className="h-4 w-4" />
        {loading ? 'Sending...' : 'Test General Email'}
      </Button>
      
      <Button 
        onClick={sendTestPhotoEmail} 
        disabled={loading}
        className="flex items-center gap-2"
      >
        <Mail className="h-4 w-4" />
        {loading ? 'Sending...' : 'Test Photo Notification'}
      </Button>
    </div>
  );
};