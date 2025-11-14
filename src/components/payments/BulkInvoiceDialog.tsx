import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Booking {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  address: string;
  date_time: string;
  total_cost: number | string;
  customer: number;
}

interface BulkInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBookings: Booking[];
  onSuccess: () => void;
}

const BulkInvoiceDialog = ({ open, onOpenChange, selectedBookings, onSuccess }: BulkInvoiceDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const totalAmount = selectedBookings.reduce((sum, booking) => {
    const cost = typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) || 0 : booking.total_cost;
    return sum + cost;
  }, 0);

  const handleSendBulkInvoice = async () => {
    if (selectedBookings.length === 0) {
      toast({
        title: 'No bookings selected',
        description: 'Please select at least one booking',
        variant: 'destructive'
      });
      return;
    }

    // Get the first booking's customer email
    const customerEmail = selectedBookings[0].email;
    const customerName = `${selectedBookings[0].first_name} ${selectedBookings[0].last_name}`.trim();

    setLoading(true);
    try {
      // Generate itemized service list
      const serviceItems = selectedBookings.map(booking => {
        const cost = typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) || 0 : booking.total_cost;
        const date = new Date(booking.date_time).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        return `• ${date} - ${booking.address} - £${cost.toFixed(2)}`;
      }).join('\n');

      // Send payment link with combined invoice
      const { data, error } = await supabase.functions.invoke('stripe-send-payment-link', {
        body: {
          recipient_email: customerEmail,
          recipient_name: customerName,
          custom_subject: `Cleaning Services Invoice - £${totalAmount.toFixed(2)}`,
          custom_content: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background-color: #fafafa; padding: 40px 20px;">
              <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 32px;">
                  <h1 style="color: hsl(180, 75%, 37%); margin: 0; font-size: 28px;">SN Cleaning Services</h1>
                </div>
                
                <h2 style="color: hsl(196, 62%, 25%); font-size: 24px; margin-bottom: 16px;">Cleaning Services Invoice</h2>
                
                <p style="color: hsl(210, 20%, 15%); font-size: 16px; line-height: 1.6;">Dear ${customerName.split(' ')[0]},</p>
                
                <p style="color: hsl(210, 20%, 15%); font-size: 16px; line-height: 1.6;">Thank you for choosing SN Cleaning Services. This invoice covers the following services:</p>

                <div style="background-color: hsl(0, 0%, 98%); border-left: 4px solid hsl(180, 75%, 37%); padding: 16px; margin: 24px 0; border-radius: 4px;">
                  <h3 style="color: hsl(196, 62%, 25%); margin: 0 0 12px 0; font-size: 18px;">Services Provided:</h3>
                  <pre style="color: hsl(210, 20%, 15%); font-size: 14px; line-height: 1.8; margin: 0; font-family: inherit; white-space: pre-wrap;">${serviceItems}</pre>
                </div>

                ${description ? `
                <div style="margin: 24px 0;">
                  <h3 style="color: hsl(196, 62%, 25%); font-size: 16px; margin-bottom: 8px;">Additional Notes:</h3>
                  <p style="color: hsl(210, 20%, 15%); font-size: 14px; line-height: 1.6;">${description}</p>
                </div>
                ` : ''}

                <div style="background-color: hsl(180, 75%, 37%); color: white; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
                  <div style="font-size: 16px; margin-bottom: 8px;">Total Amount</div>
                  <div style="font-size: 36px; font-weight: bold;">£${totalAmount.toFixed(2)}</div>
                  <div style="font-size: 14px; margin-top: 8px; opacity: 0.9;">${selectedBookings.length} service${selectedBookings.length > 1 ? 's' : ''}</div>
                </div>

                <div style="background-color: hsl(196, 85%, 95%); border-radius: 8px; padding: 16px; margin: 24px 0;">
                  <p style="color: hsl(196, 62%, 25%); font-size: 14px; line-height: 1.6; margin: 0;">
                    <strong>Automated Payment System:</strong> Your card details will be securely saved for automatic payment of your next bookings. We will place a hold on your card 24 hours before each service and charge it after the service is completed.
                  </p>
                </div>

                <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid hsl(0, 0%, 90%);">
                  <p style="color: hsl(210, 20%, 30%); font-size: 14px; line-height: 1.6;">If you have any questions about this invoice, please don't hesitate to contact us.</p>
                  <p style="color: hsl(210, 20%, 30%); font-size: 14px; margin-top: 16px;">Best regards,<br/>The SN Cleaning Team</p>
                </div>
              </div>
            </div>
          `,
          amount: totalAmount,
          customer_id: selectedBookings[0].customer,
          description: `Combined invoice for ${selectedBookings.length} cleaning service${selectedBookings.length > 1 ? 's' : ''}`
        }
      });

      if (error) throw error;

      toast({
        title: 'Bulk invoice sent',
        description: `Invoice for ${selectedBookings.length} services (£${totalAmount.toFixed(2)}) sent to ${customerEmail}`
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Bulk invoice error:', error);
      toast({
        title: 'Failed to send bulk invoice',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Bulk Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Selected Bookings ({selectedBookings.length})</Label>
            <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
              {selectedBookings.map(booking => {
                const cost = typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) || 0 : booking.total_cost;
                return (
                  <div key={booking.id} className="flex justify-between items-center text-sm">
                    <div>
                      <div className="font-medium">{booking.first_name} {booking.last_name}</div>
                      <div className="text-muted-foreground text-xs">{booking.address}</div>
                    </div>
                    <div className="font-medium">£{cost.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Total Amount</Label>
            <Input 
              value={`£${totalAmount.toFixed(2)}`}
              disabled
              className="font-bold text-lg"
            />
          </div>

          <div>
            <Label htmlFor="description">Additional Notes (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any additional notes for the customer..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSendBulkInvoice} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkInvoiceDialog;
