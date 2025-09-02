import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send } from 'lucide-react';
import { useManualEmailNotification } from '@/hooks/useManualEmailNotification';
import { useToast } from '@/hooks/use-toast';

interface AdminEmailControlsProps {
  bookingId: number;
  customerName?: string;
  customerEmail?: string;
}

export function AdminEmailControls({ 
  bookingId, 
  customerName = 'Customer',
  customerEmail 
}: AdminEmailControlsProps) {
  const [selectedEmailType, setSelectedEmailType] = useState<string>('');
  const { sendManualEmail, isLoading } = useManualEmailNotification();
  const { toast } = useToast();

  const emailTypes = [
    { value: 'booking_confirmation', label: 'Booking Confirmation' },
    { value: 'booking_status_update', label: 'Status Update' },
    { value: 'booking_completion', label: 'Completion Notice' },
    { value: 'payment_reminder', label: 'Payment Reminder' },
  ];

  const handleSendEmail = async () => {
    if (!selectedEmailType) {
      toast({
        title: "Please Select Email Type",
        description: "Choose an email template to send.",
        variant: "destructive",
      });
      return;
    }

    if (!customerEmail) {
      toast({
        title: "No Email Address",
        description: "Customer has no email address on file.",
        variant: "destructive",
      });
      return;
    }

    await sendManualEmail({
      bookingId,
      emailType: selectedEmailType as any,
      customerName,
    });

    setSelectedEmailType(''); // Reset after sending
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="h-5 w-5" />
          Send Email Notification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            To: {customerName} ({customerEmail || 'No email address'})
          </label>
        </div>
        
        <div>
          <Select value={selectedEmailType} onValueChange={setSelectedEmailType}>
            <SelectTrigger>
              <SelectValue placeholder="Select email template" />
            </SelectTrigger>
            <SelectContent>
              {emailTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleSendEmail}
          disabled={isLoading || !selectedEmailType || !customerEmail}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {isLoading ? 'Sending...' : 'Send Email'}
        </Button>

        <p className="text-xs text-muted-foreground">
          Manual email notifications for booking #{bookingId}
        </p>
      </CardContent>
    </Card>
  );
}