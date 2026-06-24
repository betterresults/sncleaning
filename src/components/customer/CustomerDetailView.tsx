import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCustomerDetailData,
} from '@/hooks/queries/useCustomerPortal';
import { queryKeys } from '@/lib/queryKeys';
import type {
  CustomerDetailBooking,
  CustomerDetailPaymentMethod,
  CustomerDetailProfile,
  CustomerDetailUnpaidItem,
} from '@/api/customers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  X, 
  CreditCard, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  Building,
  User,
  Clock,
  Banknote,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Edit2,
  Save,
  X as Cancel,
  Plus,
  Keyboard
} from 'lucide-react';
import CustomerDirectPaymentDialog from '@/components/payments/CustomerDirectPaymentDialog';
import ManualCardEntryDialog from '@/components/customer/ManualCardEntryDialog';
import { formatPhoneToInternational } from '@/utils/phoneFormatter';

interface CustomerDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number | null;
  customerName?: string;
  customerEmail?: string;
}

interface UnpaidBooking extends CustomerDetailUnpaidItem {}

interface PaymentMethod extends CustomerDetailPaymentMethod {}

interface Booking extends CustomerDetailBooking {}

interface Customer extends CustomerDetailProfile {}

const CustomerDetailView = ({ 
  open, 
  onOpenChange, 
  customerId, 
  customerName, 
  customerEmail 
}: CustomerDetailViewProps) => {
  const queryClient = useQueryClient();
  const { data, isLoading: loading, error: detailError } = useCustomerDetailData(
    customerId,
    open,
  );
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState<Partial<Customer>>({});
  const [updatingCustomer, setUpdatingCustomer] = useState(false);
  const [showDirectPayment, setShowDirectPayment] = useState(false);
  const [showManualCardDialog, setShowManualCardDialog] = useState(false);
  const { toast } = useToast();

  const customer = data?.customer ?? null;
  const unpaidBookings = data?.unpaidBookings ?? [];
  const upcomingBookings = data?.upcomingBookings ?? [];
  const pastBookings = data?.pastBookings ?? [];
  const paymentMethods = data?.paymentMethods ?? [];
  const addresses = data?.addresses ?? [];

  const invalidateDetail = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(customerId) });
  };

  useEffect(() => {
    if (detailError) {
      toast({
        title: 'Error',
        description: 'Failed to load customer data',
        variant: 'destructive',
      });
    }
  }, [detailError, toast]);

  const startEditingCustomer = () => {
    if (customer) {
      setEditCustomerData({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        client_status: customer.client_status || 'New'
      });
      setEditingCustomer(true);
    }
  };

  const cancelEditingCustomer = () => {
    setEditingCustomer(false);
    setEditCustomerData({});
  };

  const saveCustomerData = async () => {
    if (!customerId || !editCustomerData) return;

    setUpdatingCustomer(true);
    try {
      const dataToUpdate = {
        ...editCustomerData,
        phone: editCustomerData.phone ? formatPhoneToInternational(editCustomerData.phone) : editCustomerData.phone
      };
      const { error } = await supabase
        .from('customers')
        .update(dataToUpdate)
        .eq('id', customerId);

      if (error) throw error;

      setEditingCustomer(false);
      setEditCustomerData({});
      invalidateDetail();

      toast({
        title: 'Success',
        description: 'Customer information updated successfully',
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to update customer information',
        variant: 'destructive',
      });
    } finally {
      setUpdatingCustomer(false);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    try {
      const { error } = await supabase
        .from('customer_payment_methods')
        .delete()
        .eq('id', paymentMethodId);

      if (error) throw error;

      invalidateDetail();
      
      toast({
        title: 'Success',
        description: 'Payment method removed successfully',
      });
    } catch (error: any) {
      console.error('Error deleting payment method:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove payment method',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    if (!customerId) return;
    
    try {
      // First, unset all other defaults
      await supabase
        .from('customer_payment_methods')
        .update({ is_default: false })
        .eq('customer_id', customerId);

      // Then set the selected one as default
      const { error } = await supabase
        .from('customer_payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId);

      if (error) throw error;

      invalidateDetail();
      
      toast({
        title: 'Success',
        description: 'Default payment method updated',
      });
    } catch (error: any) {
      console.error('Error setting default payment method:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update default payment method',
        variant: 'destructive',
      });
    }
  };

  const totalUnpaid = unpaidBookings.reduce((sum, booking) => sum + booking.total_cost, 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <User className="h-6 w-6 text-primary" />
              Customer Details: {customer?.first_name} {customer?.last_name}
            </DialogTitle>
            <DialogDescription>
              Complete customer information and booking history
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2 text-muted-foreground">Loading customer data...</p>
            </div>
          ) : customer ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="payments">
                  Payments {unpaidBookings.length > 0 && (
                    <Badge variant="destructive" className="ml-2">{unpaidBookings.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="addresses">Addresses</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Customer Information
                        </div>
                        {!editingCustomer ? (
                          <Button
                            size="sm" 
                            variant="outline"
                            onClick={startEditingCustomer}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={saveCustomerData}
                              disabled={updatingCustomer}
                            >
                              {updatingCustomer ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditingCustomer}
                            >
                              <Cancel className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {editingCustomer ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="first_name">First Name</Label>
                            <Input
                              id="first_name"
                              value={editCustomerData.first_name || ''}
                              onChange={(e) => setEditCustomerData(prev => ({
                                ...prev,
                                first_name: e.target.value
                              }))}
                              placeholder="Enter first name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input
                              id="last_name"
                              value={editCustomerData.last_name || ''}
                              onChange={(e) => setEditCustomerData(prev => ({
                                ...prev,
                                last_name: e.target.value
                              }))}
                              placeholder="Enter last name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={editCustomerData.email || ''}
                              onChange={(e) => setEditCustomerData(prev => ({
                                ...prev,
                                email: e.target.value
                              }))}
                              placeholder="Enter email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              value={editCustomerData.phone || ''}
                              onChange={(e) => setEditCustomerData(prev => ({
                                ...prev,
                                phone: e.target.value
                              }))}
                              placeholder="Enter phone number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input
                              id="company"
                              value={editCustomerData.company || ''}
                              onChange={(e) => setEditCustomerData(prev => ({
                                ...prev,
                                company: e.target.value
                              }))}
                              placeholder="Enter company name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="client_status">Status</Label>
                            <Input
                              id="client_status"
                              value={editCustomerData.client_status || ''}
                              onChange={(e) => setEditCustomerData(prev => ({
                                ...prev,
                                client_status: e.target.value
                              }))}
                              placeholder="Client status"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(customer.first_name || customer.last_name) && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{customer.first_name} {customer.last_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-sm">{customer.email}</span>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {customer.company && (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span>{customer.company}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{customer.client_status}</Badge>
                            {customer.clent_type && (
                              <Badge variant="secondary">{customer.clent_type}</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Customer since: {new Date(customer.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Payment Methods:</span>
                        <Badge variant={paymentMethods.length > 0 ? "default" : "secondary"}>
                          {paymentMethods.length}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Upcoming Bookings:</span>
                        <Badge>{upcomingBookings.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Past Bookings:</span>
                        <Badge>{pastBookings.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Outstanding Balance:</span>
                        <Badge variant={totalUnpaid > 0 ? "destructive" : "default"}>
                          £{totalUnpaid.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Addresses:</span>
                        <Badge>{addresses.length}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                {/* Payment Methods */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Methods ({paymentMethods.length})
                      </CardTitle>
                      <Button
                        onClick={() => setShowManualCardDialog(true)}
                        size="sm"
                        className="bg-[#18A5A5] hover:bg-[#185166]"
                      >
                        <Keyboard className="h-4 w-4 mr-2" />
                        Add Card
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {paymentMethods.length > 0 ? (
                      <div className="space-y-2">
                        {paymentMethods.map((pm) => {
                          const currentYear = new Date().getFullYear();
                          const currentMonth = new Date().getMonth() + 1;
                          const isExpired = pm.card_exp_year < currentYear || 
                            (pm.card_exp_year === currentYear && pm.card_exp_month < currentMonth);
                          
                          return (
                            <div key={pm.id} className={`flex items-center justify-between p-3 border rounded-lg ${isExpired ? 'bg-red-50 border-red-200' : ''}`}>
                              <div className="flex items-center gap-3">
                                <CreditCard className={`h-5 w-5 ${isExpired ? 'text-red-500' : 'text-muted-foreground'}`} />
                                <div>
                                  <span className={`font-medium ${isExpired ? 'text-red-700' : ''}`}>
                                    {pm.card_brand.toUpperCase()} •••• {pm.card_last4}
                                  </span>
                                  <div className={`text-sm ${isExpired ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                                    {isExpired ? 'EXPIRED' : 'Expires'} {pm.card_exp_month}/{pm.card_exp_year}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {pm.is_default ? (
                                  <Badge variant="default" className="bg-green-600">Default</Badge>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSetDefault(pm.id)}
                                    disabled={isExpired}
                                  >
                                    Set Default
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeletePaymentMethod(pm.id)}
                                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="mb-4">No payment methods on file</p>
                        <Button
                          onClick={() => setShowManualCardDialog(true)}
                          className="bg-[#18A5A5] hover:bg-[#185166]"
                        >
                          <Keyboard className="h-4 w-4 mr-2" />
                          Add Card Manually
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Outstanding Payments */}
                {unpaidBookings.length > 0 && (
                  <Card className="border-red-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-red-800">
                          <AlertTriangle className="h-5 w-5" />
                          Outstanding Payments ({unpaidBookings.length})
                        </CardTitle>
                        {paymentMethods.length > 0 && (
                          <Button 
                            onClick={() => setShowDirectPayment(true)}
                            className="bg-[#18A5A5] hover:bg-[#185166]"
                          >
                            <Banknote className="h-4 w-4 mr-2" />
                            Charge £{totalUnpaid.toFixed(2)} Now
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {unpaidBookings.map((booking) => (
                          <div key={`${booking.source}-${booking.id}`} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {new Date(booking.date_time).toLocaleDateString()}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {booking.source === 'past_booking' ? 'Cleaning' : 'Linen'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {booking.cleaning_type} - {booking.address}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Status: {booking.payment_status}
                                </p>
                              </div>
                              <div className="font-semibold text-red-800">
                                £{booking.total_cost.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Upcoming Bookings ({upcomingBookings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upcomingBookings.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingBookings.map((booking) => (
                          <div key={booking.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {new Date(booking.date_time).toLocaleDateString('en-GB')} at {new Date(booking.date_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <Badge variant="outline">{booking.booking_status}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {booking.cleaning_type} - {booking.address}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Cleaner: {booking.cleaner_name}
                                </p>
                              </div>
                              <div className="font-semibold">
                                £{parseFloat(booking.total_cost?.toString() || '0').toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No upcoming bookings
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Booking History ({pastBookings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pastBookings.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {pastBookings.map((booking) => (
                          <div key={booking.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {new Date(booking.date_time).toLocaleDateString()}
                                  </span>
                                  <Badge 
                                    variant={booking.payment_status === 'paid' ? 'default' : 'destructive'}
                                  >
                                    {booking.payment_status || 'unpaid'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {booking.cleaning_type} - {booking.address}
                                </p>
                              </div>
                              <div className="font-semibold">
                                £{parseFloat(booking.total_cost?.toString() || '0').toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No booking history
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="addresses" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Saved Addresses ({addresses.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {addresses.length > 0 ? (
                      <div className="space-y-3">
                        {addresses.map((address) => (
                          <div key={address.id} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{address.address}</span>
                                  {address.is_default && (
                                    <Badge variant="default">Default</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {address.postcode}
                                </p>
                                {address.access && (
                                  <p className="text-xs text-muted-foreground">
                                    Access: {address.access}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No saved addresses
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Customer not found
            </div>
          )}
        </DialogContent>
      </Dialog>

      {customerId && customerName && customerEmail && (
        <CustomerDirectPaymentDialog
          open={showDirectPayment}
          onOpenChange={setShowDirectPayment}
          customerId={customerId}
          customerName={customerName}
          customerEmail={customerEmail}
          onPaymentSuccess={() => {
            setShowDirectPayment(false);
            invalidateDetail(); // Refresh data after payment
          }}
        />
      )}

      {customerId && (
        <ManualCardEntryDialog
          open={showManualCardDialog}
          onOpenChange={setShowManualCardDialog}
          customerId={customerId}
          onSuccess={invalidateDetail}
        />
      )}
    </>
  );
};

export default CustomerDetailView;