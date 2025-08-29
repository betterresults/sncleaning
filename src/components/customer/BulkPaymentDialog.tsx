import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Calendar, MapPin, AlertCircle, Sparkles, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';

interface UnpaidBooking {
  id: string;
  date_time: string;
  address: string;
  postcode: string;
  total_cost: number;
  cleaning_type: string;
  payment_status: string;
  source?: string;
}

interface BulkPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unpaidBookings: UnpaidBooking[];
  onPaymentSuccess: () => void;
}

export const BulkPaymentDialog: React.FC<BulkPaymentDialogProps> = ({
  open,
  onOpenChange,
  unpaidBookings,
  onPaymentSuccess,
}) => {
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleBookingSelect = (bookingId: string, checked: boolean) => {
    if (checked) {
      setSelectedBookings([...selectedBookings, bookingId]);
    } else {
      setSelectedBookings(selectedBookings.filter(id => id !== bookingId));
    }
  };

  const selectAll = () => {
    setSelectedBookings(unpaidBookings.map(booking => booking.id));
  };

  const deselectAll = () => {
    setSelectedBookings([]);
  };

  const selectedBookingData = unpaidBookings.filter(booking => 
    selectedBookings.includes(booking.id)
  );

  const totalAmount = selectedBookingData.reduce((sum, booking) => 
    sum + booking.total_cost, 0
  );

  const handlePayment = async () => {
    if (selectedBookings.length === 0) {
      toast({
        title: "No bookings selected",
        description: "Please select at least one booking to pay for.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create Stripe checkout session for multiple bookings
      const { data, error } = await supabase.functions.invoke('create-bulk-payment', {
        body: {
          bookings: selectedBookingData.map(booking => ({
            id: booking.id,
            amount: Math.round(booking.total_cost * 100), // Convert to cents
            description: `${booking.cleaning_type} - ${format(new Date(booking.date_time), 'dd MMM yyyy')} at ${booking.address}`
          })),
          totalAmount: Math.round(totalAmount * 100)
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Payment processing",
          description: "You've been redirected to Stripe to complete your payment.",
        });

        onPaymentSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pay Multiple Bookings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {unpaidBookings.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No unpaid bookings found. All your bookings are up to date!
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {unpaidBookings.length} unpaid booking{unpaidBookings.length !== 1 ? 's' : ''} found
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="space-y-6 max-h-96 overflow-y-auto">
                {(() => {
                  const cleaningBookings = unpaidBookings.filter(b => b.source === 'past_booking');
                  const linenOrders = unpaidBookings.filter(b => b.source === 'linen_order');
                  
                  return (
                    <>
                      {/* Completed Cleaning Services */}
                      {cleaningBookings.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                            <Sparkles className="h-4 w-4" />
                            <span>Completed Cleaning Services ({cleaningBookings.length})</span>
                          </div>
                          {cleaningBookings.map((booking) => (
                            <Card key={booking.id} className={`p-4 transition-colors ${
                              selectedBookings.includes(booking.id) ? 'bg-blue-50 border-blue-200' : ''
                            }`}>
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={selectedBookings.includes(booking.id)}
                                  onCheckedChange={(checked) => 
                                    handleBookingSelect(booking.id, checked as boolean)
                                  }
                                  className="mt-1"
                                />
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">
                                        {format(new Date(booking.date_time), 'dd MMM yyyy, HH:mm')}
                                      </span>
                                      <Badge variant="destructive">{booking.payment_status}</Badge>
                                    </div>
                                    <div className="text-lg font-semibold">
                                      £{booking.total_cost.toFixed(2)}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span>{booking.address}, {booking.postcode}</span>
                                  </div>
                                  
                                  <div className="text-sm">
                                    <span className="font-medium">Service:</span> {booking.cleaning_type}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Linen Orders */}
                      {linenOrders.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                            <Package className="h-4 w-4" />
                            <span>Linen Orders ({linenOrders.length})</span>
                          </div>
                          {linenOrders.map((booking) => (
                            <Card key={booking.id} className={`p-4 transition-colors ${
                              selectedBookings.includes(booking.id) ? 'bg-blue-50 border-blue-200' : ''
                            }`}>
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={selectedBookings.includes(booking.id)}
                                  onCheckedChange={(checked) => 
                                    handleBookingSelect(booking.id, checked as boolean)
                                  }
                                  className="mt-1"
                                />
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">
                                        {format(new Date(booking.date_time), 'dd MMM yyyy')}
                                      </span>
                                      <Badge variant="destructive">{booking.payment_status}</Badge>
                                    </div>
                                    <div className="text-lg font-semibold">
                                      £{booking.total_cost.toFixed(2)}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span>{booking.address}, {booking.postcode}</span>
                                  </div>
                                  
                                  <div className="text-sm">
                                    <span className="font-medium">Service:</span> {booking.cleaning_type}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {selectedBookings.length > 0 && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {selectedBookings.length} booking{selectedBookings.length !== 1 ? 's' : ''} selected
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Pay all selected bookings in one transaction
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        £{totalAmount.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total amount
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={selectedBookings.length === 0 || loading}
                  className="min-w-32"
                >
                  {loading ? (
                    'Processing...'
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay £{totalAmount.toFixed(2)}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};