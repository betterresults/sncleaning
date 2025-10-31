import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, XCircle, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface StripePayment {
  stripe_payment_intent_id: string;
  stripe_status: string;
  stripe_amount: number;
  stripe_currency: string;
  stripe_created: string;
  stripe_customer_id?: string;
  stripe_payment_method?: string;
  stripe_description?: string;
  stripe_receipt_email?: string;
  stripe_charge_id?: string;
  stripe_paid?: boolean;
  stripe_refunded?: boolean;
  stripe_amount_refunded?: number;
  booking_id?: number;
  booking_payment_status?: string;
  booking_payment_method?: string;
  booking_total_cost?: number;
  booking_date_time?: string;
  customer_id?: number;
  customer_name?: string;
  customer_email?: string;
  status_match?: boolean | null;
}

export const StripePaymentsDashboard = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<StripePayment[]>([]);
  const [bookingsNotInStripe, setBookingsNotInStripe] = useState<StripePayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-get-payments', {
        body: { limit: 100 }
      });

      if (error) throw error;

      if (data.success) {
        setPayments(data.payments || []);
        setBookingsNotInStripe(data.bookingsNotInStripe || []);
        toast({
          title: "Success",
          description: `Loaded ${data.totalCount} payment records`,
        });
      } else {
        throw new Error(data.error || 'Failed to fetch payments');
      }
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch Stripe payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { variant: any; label: string } } = {
      succeeded: { variant: 'default', label: 'Succeeded' },
      requires_capture: { variant: 'secondary', label: 'Authorized' },
      processing: { variant: 'secondary', label: 'Processing' },
      requires_payment_method: { variant: 'destructive', label: 'Requires Payment' },
      canceled: { variant: 'destructive', label: 'Canceled' },
      not_found_in_stripe: { variant: 'destructive', label: 'Not in Stripe' },
    };

    const config = statusMap[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMatchIcon = (match: boolean | null) => {
    if (match === null) return null;
    return match ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <AlertCircle className="h-5 w-5 text-orange-600" />
    );
  };

  const filteredPayments = payments.filter((payment) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      payment.stripe_payment_intent_id?.toLowerCase().includes(searchLower) ||
      payment.customer_name?.toLowerCase().includes(searchLower) ||
      payment.customer_email?.toLowerCase().includes(searchLower) ||
      payment.booking_id?.toString().includes(searchLower)
    );
  });

  const filteredBookingsNotInStripe = bookingsNotInStripe.filter((booking) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      booking.customer_name?.toLowerCase().includes(searchLower) ||
      booking.customer_email?.toLowerCase().includes(searchLower) ||
      booking.booking_id?.toString().includes(searchLower) ||
      booking.stripe_payment_intent_id?.toLowerCase().includes(searchLower)
    );
  });

  const exportToCSV = () => {
    const allData = [...payments, ...bookingsNotInStripe];
    const headers = [
      'Booking ID',
      'Customer Name',
      'Customer Email',
      'Stripe Payment Intent',
      'Stripe Status',
      'Stripe Amount',
      'Booking Status',
      'Booking Amount',
      'Status Match',
      'Created Date',
    ];

    const csvData = allData.map((payment) => [
      payment.booking_id || '',
      payment.customer_name || '',
      payment.customer_email || '',
      payment.stripe_payment_intent_id || '',
      payment.stripe_status || '',
      payment.stripe_amount || '',
      payment.booking_payment_status || '',
      payment.booking_total_cost || '',
      payment.status_match === null ? 'N/A' : payment.status_match ? 'Match' : 'Mismatch',
      payment.stripe_created ? new Date(payment.stripe_created).toLocaleDateString() : '',
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stripe-payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const mismatchCount = payments.filter((p) => p.status_match === false).length + bookingsNotInStripe.length;

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">Stripe Payments Dashboard</h2>
            <p className="text-muted-foreground">
              Compare Stripe payment data with booking records
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={fetchPayments} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Payments</div>
            <div className="text-2xl font-bold">{payments.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Mismatches</div>
            <div className="text-2xl font-bold text-orange-600">{mismatchCount}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Not in Stripe</div>
            <div className="text-2xl font-bold text-red-600">{bookingsNotInStripe.length}</div>
          </Card>
        </div>

        <div className="mb-4">
          <Input
            placeholder="Search by booking ID, customer name, email, or payment intent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {filteredBookingsNotInStripe.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Bookings Not Found in Stripe ({filteredBookingsNotInStripe.length})
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookingsNotInStripe.map((booking, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{booking.booking_id}</TableCell>
                    <TableCell>{booking.customer_name}</TableCell>
                    <TableCell className="text-sm">{booking.customer_email}</TableCell>
                    <TableCell className="text-sm font-mono">{booking.stripe_payment_intent_id}</TableCell>
                    <TableCell>{booking.booking_payment_status}</TableCell>
                    <TableCell>£{booking.booking_total_cost?.toFixed(2)}</TableCell>
                    <TableCell>
                      {booking.booking_date_time
                        ? new Date(booking.booking_date_time).toLocaleDateString()
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">All Stripe Payments ({filteredPayments.length})</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Match</TableHead>
                <TableHead>Booking ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Stripe Status</TableHead>
                <TableHead>Stripe Amount</TableHead>
                <TableHead>Booking Status</TableHead>
                <TableHead>Booking Amount</TableHead>
                <TableHead>Payment Intent</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment, idx) => (
                <TableRow key={idx} className={payment.status_match === false ? 'bg-orange-50' : ''}>
                  <TableCell>{getMatchIcon(payment.status_match)}</TableCell>
                  <TableCell className="font-medium">{payment.booking_id || '-'}</TableCell>
                  <TableCell>
                    <div>{payment.customer_name || '-'}</div>
                    <div className="text-xs text-muted-foreground">{payment.customer_email}</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.stripe_status)}</TableCell>
                  <TableCell>
                    £{payment.stripe_amount?.toFixed(2)}
                    {payment.stripe_refunded && (
                      <div className="text-xs text-red-600">
                        Refunded: £{payment.stripe_amount_refunded?.toFixed(2)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{payment.booking_payment_status || '-'}</TableCell>
                  <TableCell>£{payment.booking_total_cost?.toFixed(2) || '-'}</TableCell>
                  <TableCell className="text-xs font-mono max-w-[150px] truncate">
                    {payment.stripe_payment_intent_id}
                  </TableCell>
                  <TableCell className="text-sm">
                    {payment.stripe_created
                      ? new Date(payment.stripe_created).toLocaleDateString()
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
