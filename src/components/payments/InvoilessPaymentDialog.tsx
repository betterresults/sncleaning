import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Send, RefreshCw, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InvoilessPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    total_cost?: number | string;
    payment_method?: string;
    payment_status?: string;
    invoice_id?: string | null;
    invoice_link?: string | null;
    date_time?: string;
    date_only?: string;
    address?: string;
  };
  bookingType: 'upcoming' | 'past';
  onSuccess?: () => void;
}

export function InvoilessPaymentDialog({
  isOpen,
  onClose,
  booking,
  bookingType,
  onSuccess
}: InvoilessPaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const customerName = `${booking.first_name || ''} ${booking.last_name || ''}`.trim() || 'Customer';
  const hasInvoice = !!booking.invoice_id && !!booking.invoice_link;

  const handleCreateSendInvoice = async (isResend = false) => {
    if (!booking.email) {
      toast({
        title: "Missing Email",
        description: "Customer email is required to send invoice",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invoiless-auto-invoice', {
        body: {
          bookingId: booking.id,
          bookingType,
          isResend
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: isResend ? "Invoice Resent" : "Invoice Sent",
          description: `Invoice ${isResend ? 'resent' : 'created and sent'} to ${booking.email}`,
        });
        onSuccess?.();
        onClose();
      } else {
        throw new Error(data.error || 'Failed to create invoice');
      }
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Invoice Failed",
        description: error.message || 'Failed to create and send invoice',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncStatus = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('invoiless-sync-status');

      if (error) throw error;

      toast({
        title: "Status Synced",
        description: "Invoice status updated successfully",
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Error syncing status:', error);
      toast({
        title: "Sync Failed",
        description: error.message || 'Failed to sync invoice status',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentStatusBadge = (status?: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'Invoice Sent':
        return <Badge className="bg-blue-500">Invoice Sent</Badge>;
      case 'Overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unpaid'}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invoiless Payment - {customerName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Info */}
          <div className="rounded-lg border p-4 space-y-2 bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{customerName}</div>
                <div className="text-sm text-gray-600">{booking.email}</div>
                <div className="text-sm text-gray-600">{booking.address}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-lg">£{Number(booking.total_cost).toFixed(2)}</div>
                {getPaymentStatusBadge(booking.payment_status)}
              </div>
            </div>
          </div>

          {/* Invoice Status */}
          {hasInvoice && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Invoice ID:</span>
                <span className="text-sm text-gray-600">{booking.invoice_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                {getPaymentStatusBadge(booking.payment_status)}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {!hasInvoice ? (
              <Button
                onClick={() => handleCreateSendInvoice(false)}
                disabled={isLoading || !booking.email}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Invoice...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Create & Send Invoice
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => window.open(booking.invoice_link!, '_blank')}
                  variant="outline"
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Invoice
                </Button>

                {booking.payment_status !== 'Paid' && (
                  <>
                <Button
                  onClick={() => handleCreateSendInvoice(true)}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Resend Invoice
                    </>
                  )}
                </Button>

                    <Button
                      onClick={handleSyncStatus}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync Status
                        </>
                      )}
                    </Button>
                  </>
                )}
              </>
            )}

            <Button onClick={onClose} variant="ghost" className="w-full">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
