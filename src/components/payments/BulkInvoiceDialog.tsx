import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, FileText, Users, Link2, Split } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const [invoiceMethod, setInvoiceMethod] = useState<'stripe' | 'invoiless'>('stripe');
  const [stripeMode, setStripeMode] = useState<'combined' | 'individual'>('individual');
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

    setLoading(true);
    try {
      if (invoiceMethod === 'invoiless') {
        await handleInvoilessInvoices();
      } else {
        await handleStripePaymentLink();
      }
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

  const handleInvoilessInvoices = async () => {
    let successCount = 0;
    let failCount = 0;

    for (const booking of selectedBookings) {
      try {
        const cost = typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) || 0 : booking.total_cost;
        
        const { data, error } = await supabase.functions.invoke('invoiless-auto-invoice', {
          body: {
            bookingId: booking.id,
            bookingType: 'past',
            isResend: false
          }
        });

        if (error) throw error;
        
        successCount++;
      } catch (error) {
        console.error(`Failed to send invoice for booking ${booking.id}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: 'Invoices sent',
        description: `${successCount} invoice${successCount > 1 ? 's' : ''} sent successfully${failCount > 0 ? `, ${failCount} failed` : ''}`
      });
    }

    if (successCount > 0) {
      onSuccess();
      onOpenChange(false);
    }
  };

  const handleStripePaymentLink = async () => {
    if (stripeMode === 'individual') {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const booking of selectedBookings) {
        try {
          if (!booking.email || !booking.first_name || !booking.total_cost) {
            errors.push(`Booking #${booking.id}: Missing email, name, or cost`);
            errorCount++;
            continue;
          }

          const { data, error } = await supabase.functions.invoke('stripe-send-payment-link', {
            body: {
              customer_id: booking.id, // keep parity with working flow
              email: booking.email,
              name: `${booking.first_name} ${booking.last_name || ''}`.trim(),
              amount: typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) || 0 : booking.total_cost,
              description: `Cleaning Service - ${format(new Date(booking.date_time), 'dd MMM yyyy')}`,
              booking_id: booking.id,
              collect_payment_method: true,
            }
          });

          if (error) throw error;

          // Send email with the payment link
          if (data?.payment_link_url) {
            const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
              body: {
                recipient_email: booking.email,
                recipient_name: `${booking.first_name} ${booking.last_name || ''}`.trim(),
                custom_subject: `Payment for Cleaning Service - ${format(new Date(booking.date_time), 'dd MMM yyyy')}`,
                custom_content: `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background-color: #fafafa; padding: 40px 20px;">
                    <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                      <h2 style="color: hsl(196, 62%, 25%); font-size: 22px; margin: 0 0 16px;">Complete Your Payment</h2>
                      <p style="color: hsl(210, 20%, 15%); font-size: 16px;">Please complete your payment of <strong>£${(typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) || 0 : booking.total_cost).toFixed(2)}</strong> for your cleaning service on ${format(new Date(booking.date_time), 'dd MMM yyyy')}.</p>
                      
                      <div style="background-color: hsl(45, 100%, 96%); border-left: 4px solid hsl(45, 100%, 51%); padding: 16px; margin: 20px 0; border-radius: 4px;">
                        <h3 style="color: hsl(45, 100%, 35%); margin: 0 0 10px 0; font-size: 16px;">🔔 Important: We've Moved to Automatic Invoices</h3>
                        <p style="color: hsl(210, 20%, 15%); font-size: 13px; line-height: 1.6; margin: 0;">
                          We are no longer sending invoices after each service. Instead, your payment details will be securely saved on file and used automatically for all future services. Here's how it works:
                        </p>
                        <ul style="color: hsl(210, 20%, 15%); font-size: 13px; line-height: 1.7; margin: 10px 0 0 0; padding-left: 18px;">
                          <li><strong>24 Hours Before Service:</strong> We'll place a hold on your card for the service amount</li>
                          <li><strong>After Service Completion:</strong> The actual charge will be processed automatically</li>
                          <li><strong>No More Manual Invoices:</strong> Everything happens seamlessly in the background</li>
                        </ul>
                      </div>
                      
                      <div style="text-align: center; margin: 24px 0;">
                        <a href="${data.payment_link_url}" style="background-color: hsl(180, 75%, 37%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Pay Now</a>
                      </div>
                      <p style="color: hsl(210, 15%, 35%); font-size: 12px;">If the button doesn’t work, copy this link:</p>
                      <p style="word-break: break-all; background-color: hsl(0, 0%, 96%); padding: 10px; border-radius: 4px; font-size: 12px; color: hsl(210, 20%, 15%);">${data.payment_link_url}</p>
                    </div>
                  </div>
                `,
              }
            });
            if (emailError) throw emailError;
          }

          successCount++;
        } catch (e: any) {
          console.error('Payment link error:', e);
          errorCount++;
          if (e?.message) errors.push(e.message);
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Payment Links Sent',
          description: `Successfully sent ${successCount} payment link${successCount !== 1 ? 's' : ''}.`,
        });
        onSuccess();
        onOpenChange(false);
      }

      if (errorCount > 0) {
        toast({
          title: 'Some links failed',
          description: `${errorCount} link${errorCount !== 1 ? 's' : ''} failed. ${errors.slice(0,3).join('; ')}`,
          variant: 'destructive'
        });
      }

      return;
    }

    // Combined single payment link covering all selected services
    const customerEmail = selectedBookings[0].email;
    const customerName = `${selectedBookings[0].first_name} ${selectedBookings[0].last_name}`.trim();

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
          // Create a single combined link (no email here)
          customer_id: selectedBookings[0].customer,
          email: customerEmail,
          name: customerName,
          amount: totalAmount,
          description: `Combined invoice for ${selectedBookings.length} cleaning service${selectedBookings.length > 1 ? 's' : ''}`,
          booking_ids: selectedBookings.map(b => b.id),
        }
      });

      if (error) throw error;

      // Send email with the combined payment link
      if (data?.payment_link_url) {
        const emailHtml = `
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

                <div style="background-color: hsl(45, 100%, 96%); border-left: 4px solid hsl(45, 100%, 51%); padding: 20px; margin: 24px 0; border-radius: 4px;">
                  <h3 style="color: hsl(45, 100%, 35%); margin: 0 0 12px 0; font-size: 18px;">🔔 Important: We've Moved to Automatic Invoices</h3>
                  <p style="color: hsl(210, 20%, 15%); font-size: 14px; line-height: 1.7; margin: 0;">
                    We are no longer sending invoices after each service. Instead, your payment details will be securely saved on file and used automatically for all future services. Here's how it works:
                  </p>
                  <ul style="color: hsl(210, 20%, 15%); font-size: 14px; line-height: 1.8; margin: 12px 0 0 0; padding-left: 20px;">
                    <li><strong>24 Hours Before Service:</strong> We'll place a hold on your card for the service amount</li>
                    <li><strong>After Service Completion:</strong> The actual charge will be processed automatically</li>
                    <li><strong>No More Manual Invoices:</strong> Everything happens seamlessly in the background</li>
                  </ul>
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

                <div style="text-align: center; margin: 24px 0;">
                  <a href="${data.payment_link_url}" style="background-color: hsl(180, 75%, 37%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Pay Now</a>
                </div>

                <p style="color: hsl(210, 15%, 35%); font-size: 12px;">If the button doesn’t work, copy this link:</p>
                <p style="word-break: break-all; background-color: hsl(0, 0%, 96%); padding: 10px; border-radius: 4px; font-size: 12px; color: hsl(210, 20%, 15%);">${data.payment_link_url}</p>

                <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid hsl(0, 0%, 90%);">
                  <p style="color: hsl(210, 20%, 30%); font-size: 14px; line-height: 1.6;">If you have any questions about this invoice, please don't hesitate to contact us.</p>
                  <p style="color: hsl(210, 20%, 30%); font-size: 14px; margin-top: 16px;">Best regards,<br/>The SN Cleaning Team</p>
                </div>
              </div>
            </div>
          `;

        const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
          body: {
            recipient_email: customerEmail,
            recipient_name: customerName,
            custom_subject: `Cleaning Services Invoice - £${totalAmount.toFixed(2)}`,
            custom_content: emailHtml,
          }
        });
        if (emailError) throw emailError;
      }

      toast({
        title: 'Bulk invoice sent',
        description: `Invoice for ${selectedBookings.length} services (£${totalAmount.toFixed(2)}) sent to ${customerEmail}`
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      throw error;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Send Payment Links
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Send payment links or invoices to your customers
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Invoice Method Selection - Card Style */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Choose Payment Method</Label>
            <div className="grid grid-cols-2 gap-4">
              {/* Stripe Option */}
              <button
                type="button"
                onClick={() => setInvoiceMethod('stripe')}
                className={cn(
                  "relative p-6 rounded-xl border-2 transition-all duration-200 text-left group hover:shadow-lg",
                  invoiceMethod === 'stripe'
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50 bg-card"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-3 rounded-lg transition-colors",
                    invoiceMethod === 'stripe'
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground group-hover:text-primary"
                  )}>
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-semibold text-base">Stripe Payment Link</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Secure payment processing with card details saved for future bookings
                    </p>
                  </div>
                </div>
                {invoiceMethod === 'stripe' && (
                  <div className="absolute top-3 right-3">
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                    </div>
                  </div>
                )}
              </button>

              {/* Invoiless Option */}
              <button
                type="button"
                onClick={() => setInvoiceMethod('invoiless')}
                className={cn(
                  "relative p-6 rounded-xl border-2 transition-all duration-200 text-left group hover:shadow-lg",
                  invoiceMethod === 'invoiless'
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50 bg-card"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-3 rounded-lg transition-colors",
                    invoiceMethod === 'invoiless'
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground group-hover:text-primary"
                  )}>
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-semibold text-base">Invoiless Invoice</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Professional invoices sent individually for each service
                    </p>
                  </div>
                </div>
                {invoiceMethod === 'invoiless' && (
                  <div className="absolute top-3 right-3">
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Stripe Mode Selection */}
          {invoiceMethod === 'stripe' && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <Label className="text-base font-semibold">Delivery Mode</Label>
              <div className="grid grid-cols-2 gap-4">
                {/* Individual Mode */}
                <button
                  type="button"
                  onClick={() => setStripeMode('individual')}
                  className={cn(
                    "relative p-5 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md",
                    stripeMode === 'individual'
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 bg-card"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Split className={cn(
                      "h-5 w-5",
                      stripeMode === 'individual' ? "text-primary" : "text-muted-foreground"
                    )} />
                    <div>
                      <div className="font-medium">Individual Links</div>
                      <p className="text-xs text-muted-foreground">Separate link per booking</p>
                    </div>
                  </div>
                </button>

                {/* Combined Mode */}
                <button
                  type="button"
                  onClick={() => setStripeMode('combined')}
                  className={cn(
                    "relative p-5 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md",
                    stripeMode === 'combined'
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 bg-card"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Link2 className={cn(
                      "h-5 w-5",
                      stripeMode === 'combined' ? "text-primary" : "text-muted-foreground"
                    )} />
                    <div>
                      <div className="font-medium">Combined Link</div>
                      <p className="text-xs text-muted-foreground">One link for all bookings</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Selected Bookings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-semibold">
                Selected Bookings ({selectedBookings.length})
              </Label>
            </div>
            <div className="border rounded-lg bg-muted/30 overflow-hidden">
              <div className="max-h-56 overflow-y-auto p-4 space-y-3">
                {selectedBookings.map((booking, index) => {
                  const cost = typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost) || 0 : booking.total_cost;
                  return (
                    <div 
                      key={booking.id} 
                      className="flex justify-between items-center p-3 bg-card rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {booking.first_name} {booking.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {booking.address}
                        </div>
                      </div>
                      <div className="ml-4 font-semibold text-sm whitespace-nowrap">
                        £{cost.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Total Amount Bar */}
              <div className="bg-primary/10 border-t border-primary/20 p-4 flex justify-between items-center">
                <span className="font-semibold text-sm">Total Amount</span>
                <span className="font-bold text-lg text-primary">
                  £{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-base font-semibold">
              Additional Notes <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Add any additional notes for the customer..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={loading}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSendBulkInvoice} 
            disabled={loading}
            className="min-w-[140px] gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {!loading && <CreditCard className="h-4 w-4" />}
            {invoiceMethod === 'stripe' 
              ? (stripeMode === 'individual' ? 'Send Links' : 'Send Link')
              : 'Send Invoices'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkInvoiceDialog;
