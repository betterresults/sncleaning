import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Mail } from 'lucide-react';

interface Booking {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_cost: string;
  address: string;
  cleaning_type: string;
  service_type: string;
  date_time: string;
  customer: number;
}

interface CombinedPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookings: Booking[];
  onPaymentSent: () => void;
}

export const CombinedPaymentDialog = ({ open, onOpenChange, bookings, onPaymentSent }: CombinedPaymentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [collectForFuture, setCollectForFuture] = useState(true);
  const { toast } = useToast();

  if (bookings.length === 0) return null;

  const firstBooking = bookings[0];
  const totalAmount = bookings.reduce((sum, b) => sum + parseFloat(b.total_cost || '0'), 0);

  const generateDescription = () => {
    return bookings.map((b, index) => {
      const date = new Date(b.date_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      return `${index + 1}. ${b.cleaning_type || b.service_type} - ${date} - £${parseFloat(b.total_cost || '0').toFixed(2)}`;
    }).join('\n');
  };

  const handleSendPayment = async () => {
    setLoading(true);
    try {
      // Generate the payment link
      const { data: linkData, error: linkError } = await supabase.functions.invoke('stripe-send-payment-link', {
        body: {
          customer_id: firstBooking.customer,
          email: firstBooking.email,
          name: `${firstBooking.first_name} ${firstBooking.last_name}`.trim(),
          amount: totalAmount,
          description: `Combined Invoice - ${bookings.length} services`,
          booking_id: bookings.map(b => b.id).join(','), // Store all booking IDs
          collect_payment_method: collectForFuture
        }
      });

      if (linkError) throw linkError;

      if (!linkData.payment_link_url) {
        throw new Error('No payment link URL returned');
      }

      // Generate itemized service list for email
      const servicesHtml = bookings.map((b, index) => {
        const date = new Date(b.date_time).toLocaleDateString('en-GB', { 
          weekday: 'short', 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        });
        return `
          <tr style="border-bottom: 1px solid hsl(0, 0%, 87%);">
            <td style="padding: 12px 8px; color: hsl(210, 20%, 15%);">${index + 1}. ${b.cleaning_type || b.service_type}</td>
            <td style="padding: 12px 8px; color: hsl(210, 15%, 35%); text-align: center;">${date}</td>
            <td style="padding: 12px 8px; color: hsl(210, 20%, 15%); text-align: right; font-weight: 600;">£${parseFloat(b.total_cost || '0').toFixed(2)}</td>
          </tr>
        `;
      }).join('');

      // Send email with the payment link
      const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
        body: {
          recipient_email: firstBooking.email,
          recipient_name: `${firstBooking.first_name} ${firstBooking.last_name}`.trim(),
          custom_subject: `Combined Cleaning Services Invoice - £${totalAmount.toFixed(2)}`,
          custom_content: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background-color: #fafafa; padding: 40px 20px;">
              <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 32px;">
                  <h1 style="color: hsl(180, 75%, 37%); margin: 0; font-size: 28px;">SN Cleaning Services</h1>
                </div>
                
                <h2 style="color: hsl(196, 62%, 25%); font-size: 24px; margin-bottom: 16px;">Combined Cleaning Services Invoice</h2>
                
                <p style="color: hsl(210, 20%, 15%); font-size: 16px; line-height: 1.6;">Dear ${firstBooking.first_name},</p>
                
                <p style="color: hsl(210, 20%, 15%); font-size: 16px; line-height: 1.6;">Please complete your payment for the following services:</p>
                
                <div style="background-color: hsl(0, 0%, 96%); border-radius: 8px; padding: 20px; margin: 24px 0;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                      <tr style="border-bottom: 2px solid hsl(180, 75%, 37%);">
                        <th style="padding: 12px 8px; color: hsl(196, 62%, 25%); text-align: left; font-size: 14px;">Service</th>
                        <th style="padding: 12px 8px; color: hsl(196, 62%, 25%); text-align: center; font-size: 14px;">Date</th>
                        <th style="padding: 12px 8px; color: hsl(196, 62%, 25%); text-align: right; font-size: 14px;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${servicesHtml}
                      <tr>
                        <td colspan="2" style="padding: 16px 8px 8px 8px; color: hsl(196, 62%, 25%); text-align: right; font-weight: 600; font-size: 16px;">Total Amount:</td>
                        <td style="padding: 16px 8px 8px 8px; color: hsl(180, 75%, 37%); text-align: right; font-weight: 700; font-size: 20px;">£${totalAmount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                ${collectForFuture ? `
                  <div style="background-color: hsl(180, 75%, 95%); border: 1px solid hsl(180, 75%, 37%); border-radius: 8px; padding: 20px; margin: 24px 0;">
                    <p style="margin: 0 0 12px 0; color: hsl(196, 62%, 25%); font-size: 15px; font-weight: 600;">✨ Automated Payment System</p>
                    <p style="margin: 0; color: hsl(210, 20%, 15%); font-size: 14px; line-height: 1.6;">We've upgraded to automated payments! Your card details will be securely saved. For future bookings, we'll place a hold on your card 24 hours before the service and charge it after the service is completed.</p>
                  </div>
                ` : ''}
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${linkData.payment_link_url}" style="background-color: hsl(180, 75%, 37%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">Complete Payment</a>
                </div>
                
                <p style="color: hsl(210, 15%, 35%); font-size: 13px; text-align: center; margin: 20px 0;">Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background-color: hsl(0, 0%, 96%); padding: 12px; border-radius: 4px; font-size: 12px; color: hsl(210, 20%, 15%);">${linkData.payment_link_url}</p>
                
                <hr style="border: none; border-top: 1px solid hsl(0, 0%, 87%); margin: 32px 0;">
                
                <p style="color: hsl(210, 15%, 35%); font-size: 14px; line-height: 1.6;">If you have any questions, please don't hesitate to contact us.</p>
                
                <p style="color: hsl(210, 20%, 15%); font-size: 14px; margin-top: 24px;">Best regards,<br><strong style="color: hsl(180, 75%, 37%);">SN Cleaning Services Team</strong></p>
              </div>
              
              <p style="text-align: center; color: hsl(210, 15%, 35%); font-size: 12px; margin-top: 24px;">© 2024 SN Cleaning Services. All rights reserved.</p>
            </div>
          `
        }
      });

      if (emailError) throw emailError;

      toast({
        title: 'Combined Invoice Sent',
        description: `Payment request for £${totalAmount.toFixed(2)} covering ${bookings.length} services emailed to ${firstBooking.email}${collectForFuture ? '. Automated payments enabled.' : ''}.`,
      });

      onPaymentSent();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending combined payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send combined invoice',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Combined Invoice</DialogTitle>
          <DialogDescription>
            Send one payment request for {bookings.length} selected bookings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Customer</h3>
            <p className="text-sm">{firstBooking.first_name} {firstBooking.last_name}</p>
            <p className="text-sm text-muted-foreground">{firstBooking.email}</p>
          </div>

          {/* Services List */}
          <div>
            <h3 className="font-semibold mb-3">Services Included ({bookings.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {bookings.map((booking, index) => {
                const date = new Date(booking.date_time).toLocaleDateString('en-GB', { 
                  weekday: 'short', 
                  day: '2-digit', 
                  month: 'short' 
                });
                return (
                  <div key={booking.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{index + 1}. {booking.cleaning_type || booking.service_type}</span>
                      <span className="text-muted-foreground ml-2">• {date}</span>
                    </div>
                    <span className="font-semibold">£{parseFloat(booking.total_cost || '0').toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total Amount */}
          <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
            <span className="text-lg font-semibold">Total Amount</span>
            <span className="text-2xl font-bold text-primary">£{totalAmount.toFixed(2)}</span>
          </div>

          {/* Save Card Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="collect-future"
              checked={collectForFuture}
              onCheckedChange={(checked) => setCollectForFuture(checked as boolean)}
            />
            <Label htmlFor="collect-future" className="text-sm cursor-pointer">
              Enable automated payments (save card for future bookings)
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendPayment}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                'Sending...'
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Combined Invoice
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};