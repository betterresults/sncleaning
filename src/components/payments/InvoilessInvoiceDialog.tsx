import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, DollarSign, Mail, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Booking {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_cost: number;
  date_time: string;
  address: string;
  invoice_id?: string;
  invoice_term?: number;
}

interface InvoilessInvoiceDialogProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const InvoilessInvoiceDialog = ({ booking, isOpen, onClose, onSuccess }: InvoilessInvoiceDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [dueDate, setDueDate] = useState<string>('');
  const [invoiceTerm, setInvoiceTerm] = useState<number>(7);
  const { toast } = useToast();

  useEffect(() => {
    if (booking) {
      const bookingDate = new Date(booking.date_time);
      const term = booking.invoice_term || 7;
      setInvoiceTerm(term);
      
      // Calculate due date based on invoice term
      const calculatedDueDate = new Date(bookingDate);
      calculatedDueDate.setDate(calculatedDueDate.getDate() + term);
      setDueDate(format(calculatedDueDate, 'yyyy-MM-dd'));
    }
  }, [booking]);

  const handleDueDateChange = (newDate: string) => {
    setDueDate(newDate);
    if (newDate && booking) {
      const bookingDate = new Date(booking.date_time);
      const due = new Date(newDate);
      const diffTime = due.getTime() - bookingDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setInvoiceTerm(diffDays > 0 ? diffDays : 0);
    }
  };

  const handleInvoiceTermChange = (term: number) => {
    setInvoiceTerm(term);
    if (booking) {
      const bookingDate = new Date(booking.date_time);
      const calculatedDueDate = new Date(bookingDate);
      calculatedDueDate.setDate(calculatedDueDate.getDate() + term);
      setDueDate(format(calculatedDueDate, 'yyyy-MM-dd'));
    }
  };

  const handleSendInvoice = async () => {
    if (!booking) return;

    setLoading(true);
    try {
      // First, update booking with invoice_term before creating invoice
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ invoice_term: invoiceTerm })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      // Now call the edge function to create and send invoice
      const { data, error } = await supabase.functions.invoke('invoiless-auto-invoice', {
        body: {
          bookingId: booking.id,
          bookingType: 'upcoming',
          isResend: false
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message || 'Failed to create invoice');

      toast({
        title: 'Invoice Sent Successfully',
        description: `Invoice sent to ${booking.email}`,
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error sending invoice:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invoice',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysUntilDue = () => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!booking) return null;

  const bookingDate = new Date(booking.date_time);
  const daysUntilDue = calculateDaysUntilDue();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 m-0 rounded-none">
        {/* Header with Back Button */}
        <div className="bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10 rounded-full h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-white">Send Invoice</h2>
              <p className="text-slate-200 text-sm">
                Create and send Invoiless invoice
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {/* Booking Information Card */}
          <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-semibold">{booking.first_name} {booking.last_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-semibold truncate">{booking.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Service Date</p>
                  <p className="font-semibold">{format(bookingDate, 'dd MMM yyyy HH:mm')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg">£{Number(booking.total_cost || 0).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <p className="text-muted-foreground mb-1">Address</p>
                <p className="font-medium">{booking.address}</p>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Settings Card */}
          <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Invoice Settings
                </h3>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-base font-medium">
                  Payment Due Date
                </Label>
                <div className="relative">
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => handleDueDateChange(e.target.value)}
                    className="h-12 rounded-xl pl-11 text-base"
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {daysUntilDue > 0 
                    ? `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`
                    : daysUntilDue === 0 
                    ? 'Due today'
                    : `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`
                  }
                </p>
              </div>

              {/* Invoice Term */}
              <div className="space-y-2">
                <Label htmlFor="invoiceTerm" className="text-base font-medium">
                  Payment Terms (days)
                </Label>
                <div className="relative">
                  <Input
                    id="invoiceTerm"
                    type="number"
                    value={invoiceTerm}
                    onChange={(e) => handleInvoiceTermChange(parseInt(e.target.value) || 0)}
                    className="h-12 rounded-xl pl-11 text-base"
                    min="0"
                    max="365"
                  />
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Number of days customer has to pay after invoice date
                </p>
              </div>

              {/* Preview Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">Email Preview</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Invoice will be sent to <strong>{booking.email}</strong> with payment instructions and a link to pay online.
                    </p>
                  </div>
                </div>
              </div>

              {/* Existing Invoice Warning */}
              {booking.invoice_id && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This booking already has an invoice (ID: {booking.invoice_id}). Creating a new invoice will replace it.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-white p-6 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="h-12 px-8 rounded-xl font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendInvoice}
            disabled={loading || !dueDate}
            className="h-12 px-8 rounded-xl font-medium bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Send Invoice
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoilessInvoiceDialog;
