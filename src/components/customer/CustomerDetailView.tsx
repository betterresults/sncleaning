import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useCustomerDetailData } from '@/hooks/queries/useCustomerPortal';
import { queryKeys } from '@/lib/queryKeys';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import CustomerDirectPaymentDialog from '@/components/payments/CustomerDirectPaymentDialog';
import ManualCardEntryDialog from '@/components/customer/ManualCardEntryDialog';
import { formatPhoneToInternational } from '@/utils/phoneFormatter';
import {
  CustomerDetailAddressesTab,
  CustomerDetailHistoryTab,
  CustomerDetailLoading,
  CustomerDetailNotFound,
  CustomerDetailOverviewTab,
  CustomerDetailPaymentsTab,
  CustomerDetailUpcomingTab,
  type CustomerDetailCustomer,
  type CustomerDetailViewProps,
} from './detail';

const CustomerDetailView = ({
  open,
  onOpenChange,
  customerId,
  customerName,
  customerEmail,
}: CustomerDetailViewProps) => {
  const queryClient = useQueryClient();
  const { data, isLoading: loading, error: detailError } = useCustomerDetailData(
    customerId,
    open,
  );
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

  const saveCustomerData = async (editCustomerData: Partial<CustomerDetailCustomer>) => {
    if (!customerId) return;

    try {
      const dataToUpdate = {
        ...editCustomerData,
        phone: editCustomerData.phone
          ? formatPhoneToInternational(editCustomerData.phone)
          : editCustomerData.phone,
      };
      const { error } = await supabase
        .from('customers')
        .update(dataToUpdate)
        .eq('id', customerId);

      if (error) throw error;

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
      throw error;
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
    } catch (error: unknown) {
      console.error('Error deleting payment method:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to remove payment method',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    if (!customerId) return;

    try {
      await supabase
        .from('customer_payment_methods')
        .update({ is_default: false })
        .eq('customer_id', customerId);

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
    } catch (error: unknown) {
      console.error('Error setting default payment method:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update default payment method',
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
            <CustomerDetailLoading />
          ) : customer ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="payments">
                  Payments{' '}
                  {unpaidBookings.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unpaidBookings.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="addresses">Addresses</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <CustomerDetailOverviewTab
                  customer={customer}
                  paymentMethodsCount={paymentMethods.length}
                  upcomingBookingsCount={upcomingBookings.length}
                  pastBookingsCount={pastBookings.length}
                  addressesCount={addresses.length}
                  totalUnpaid={totalUnpaid}
                  onSave={saveCustomerData}
                />
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                <CustomerDetailPaymentsTab
                  paymentMethods={paymentMethods}
                  unpaidBookings={unpaidBookings}
                  totalUnpaid={totalUnpaid}
                  onAddCard={() => setShowManualCardDialog(true)}
                  onChargeNow={() => setShowDirectPayment(true)}
                  onDeletePaymentMethod={handleDeletePaymentMethod}
                  onSetDefaultPaymentMethod={handleSetDefault}
                />
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-4">
                <CustomerDetailUpcomingTab bookings={upcomingBookings} />
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <CustomerDetailHistoryTab bookings={pastBookings} />
              </TabsContent>

              <TabsContent value="addresses" className="space-y-4">
                <CustomerDetailAddressesTab addresses={addresses} />
              </TabsContent>
            </Tabs>
          ) : (
            <CustomerDetailNotFound />
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
            invalidateDetail();
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
