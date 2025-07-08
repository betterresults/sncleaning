import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

export const TestEmailButton = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
    <Button 
      onClick={sendTestEmail} 
      disabled={loading}
      className="flex items-center gap-2"
    >
      <Mail className="h-4 w-4" />
      {loading ? 'Sending...' : 'Send Test Email'}
    </Button>
  );
};