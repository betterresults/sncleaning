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
          customer_id: 29,
          cleaner_id: 1,
          folder_name: "108248_SE164NF_2025-07-29_29",
          total_photos: 11
        }
      });

      if (error) {
        console.error('Error sending real photo notification:', error);
        toast({
          title: "Error",
          description: `Failed to send notification: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('Real photo notification sent successfully:', data);
        toast({
          title: "Success",
          description: "Photo notification sent for booking 108248 to frances.douglasthomson@gmail.com",
        });
      }
    } catch (error: any) {
      console.error('Photo notification test error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
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