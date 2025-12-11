import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { pdf } from '@react-pdf/renderer';
import { BookingInvoicePDF } from './BookingInvoicePDF';
import { format } from 'date-fns';
import { Download, Send, Eye, FileText, Calendar, MapPin, User, Clock, Banknote } from 'lucide-react';

interface Booking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  address: string;
  postcode: string;
  cleaning_type: string;
  service_type: string;
  total_cost: number;
  total_hours?: number | null;
  payment_status: string;
  additional_details?: string;
  customer?: number;
}

interface BookingInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
}

export const BookingInvoiceDialog: React.FC<BookingInvoiceDialogProps> = ({
  open,
  onOpenChange,
  booking
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  if (!booking) return null;

  const humanize = (val?: string | null) => {
    if (!val) return '';
    return val
      .split('_')
      .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(' ');
  };

  const getStatusColor = (status: string) => {
    const lower = status?.toLowerCase() || '';
    if (lower.includes('paid') && !lower.includes('unpaid')) return 'bg-green-100 text-green-800';
    if (lower.includes('unpaid') || lower.includes('failed')) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const blob = await pdf(<BookingInvoicePDF booking={booking} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${booking.id}-${format(new Date(booking.date_time), 'yyyy-MM-dd')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Invoice Downloaded",
        description: `Invoice for booking #${booking.id} has been downloaded.`,
      });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to generate PDF.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoiceEmail = async () => {
    setSendingEmail(true);
    try {
      // Generate PDF as base64
      const blob = await pdf(<BookingInvoicePDF booking={booking} />).toBlob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const bookingDate = format(new Date(booking.date_time), 'dd MMMM yyyy');

      // Send email with invoice
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          recipient_email: booking.email,
          recipient_name: `${booking.first_name} ${booking.last_name}`.trim(),
          custom_subject: `Invoice for Cleaning Service - ${bookingDate}`,
          custom_content: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif; max-width: 600px; margin: 0 auto; background-color: #fafafa; padding: 40px 20px;">
              <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 32px;">
                  <h1 style="color: hsl(180, 75%, 37%); margin: 0; font-size: 28px;">SN Cleaning Services</h1>
                </div>
                
                <h2 style="color: hsl(196, 62%, 25%); font-size: 24px; margin-bottom: 16px;">Your Invoice</h2>
                
                <p style="color: hsl(210, 20%, 15%); font-size: 16px; line-height: 1.6;">Dear ${booking.first_name},</p>
                
                <p style="color: hsl(210, 20%, 15%); font-size: 16px; line-height: 1.6;">Please find attached your invoice for the cleaning service on <strong>${bookingDate}</strong>.</p>
                
                <div style="background-color: hsl(0, 0%, 96%); border-left: 4px solid hsl(180, 75%, 37%); padding: 16px; margin: 24px 0; border-radius: 4px;">
                  <p style="margin: 0 0 8px 0; color: hsl(210, 20%, 15%); font-size: 15px;"><strong>Service:</strong> ${humanize(booking.service_type)} - ${humanize(booking.cleaning_type)}</p>
                  <p style="margin: 0 0 8px 0; color: hsl(210, 20%, 15%); font-size: 15px;"><strong>Address:</strong> ${booking.address}, ${booking.postcode}</p>
                  <p style="margin: 0; color: hsl(180, 75%, 37%); font-size: 18px; font-weight: bold;"><strong>Total:</strong> £${booking.total_cost?.toFixed(2) || '0.00'}</p>
                </div>
                
                <hr style="border: none; border-top: 1px solid hsl(0, 0%, 87%); margin: 32px 0;">
                
                <p style="color: hsl(210, 15%, 35%); font-size: 14px; line-height: 1.6;">If you have any questions about this invoice, please don't hesitate to contact us.</p>
                
                <p style="color: hsl(210, 20%, 15%); font-size: 14px; margin-top: 24px;">Best regards,<br><strong style="color: hsl(180, 75%, 37%);">SN Cleaning Services Team</strong></p>
              </div>
              
              <p style="text-align: center; color: hsl(210, 15%, 35%); font-size: 12px; margin-top: 24px;">© ${new Date().getFullYear()} SN Cleaning Services. All rights reserved.</p>
            </div>
          `,
          attachments: [
            {
              filename: `Invoice-${booking.id}-${format(new Date(booking.date_time), 'yyyy-MM-dd')}.pdf`,
              content: base64,
              type: 'application/pdf'
            }
          ]
        }
      });

      if (error) throw error;

      toast({
        title: "Invoice Sent",
        description: `Invoice has been emailed to ${booking.email}.`,
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending invoice email:', error);
      toast({
        title: "Failed to Send",
        description: error.message || "Failed to send invoice email.",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const bookingDate = booking.date_time 
    ? format(new Date(booking.date_time), 'EEE, dd MMM yyyy')
    : 'N/A';
  
  const bookingTime = booking.date_time 
    ? format(new Date(booking.date_time), 'HH:mm')
    : 'N/A';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Booking Invoice
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invoice Header */}
          <div className="bg-primary/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="text-lg font-bold text-primary">INV-{booking.id.toString().padStart(6, '0')}</p>
              </div>
              <Badge className={getStatusColor(booking.payment_status)}>
                {booking.payment_status || 'Unpaid'}
              </Badge>
            </div>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{booking.first_name} {booking.last_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{bookingDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{bookingTime} {booking.total_hours ? `(${booking.total_hours}h)` : ''}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{booking.address}, {booking.postcode}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{humanize(booking.service_type)}</span>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Total Amount</span>
            </div>
            <span className="text-2xl font-bold text-primary">
              £{booking.total_cost?.toFixed(2) || '0.00'}
            </span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={handleDownloadPDF}
              disabled={loading}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button 
              onClick={handleSendInvoiceEmail}
              disabled={sendingEmail}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendingEmail ? 'Sending...' : 'Email Invoice'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Invoice will be sent to: {booking.email}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};