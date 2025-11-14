import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Download, Search, Mail } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmailSentLogsDialog } from './EmailSentLogsDialog';

interface StripePayment {
  stripe_payment_intent_id: string;
  stripe_status: string;
  stripe_amount: number;
  stripe_currency: string;
  stripe_created: string;
  stripe_customer_id?: string;
  stripe_customer_name?: string;
  stripe_customer_email?: string;
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
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'customer' | 'email'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'authorized' | 'unpaid'>('all');
  const [showEmailLogs, setShowEmailLogs] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-get-payments', {
        body: { limit: 100 }
      });

      if (error) throw error;

      if (data.success) {
        setPayments(data.payments || []);
        toast({
          title: "Успешно",
          description: `Заредени ${data.payments?.length || 0} плащания`,
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

  const getStatusBadge = (bookingStatus?: string, stripeStatus?: string) => {
    const status = bookingStatus?.toLowerCase() || '';
    
    if (status === 'paid' || stripeStatus === 'succeeded') {
      return <Badge variant="default">Платено</Badge>;
    } else if (status === 'authorized' || stripeStatus === 'requires_capture') {
      return <Badge variant="secondary">Авторизирано</Badge>;
    } else {
      return <Badge variant="destructive">Неплатено</Badge>;
    }
  };

  const filteredPayments = payments.filter((payment) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      
      if (searchType === 'customer') {
        if (!payment.customer_name?.toLowerCase().includes(searchLower)) {
          return false;
        }
      } else if (searchType === 'email') {
        if (!payment.customer_email?.toLowerCase().includes(searchLower)) {
          return false;
        }
      } else {
        // all - search in everything
        const matches = 
          payment.customer_name?.toLowerCase().includes(searchLower) ||
          payment.customer_email?.toLowerCase().includes(searchLower) ||
          payment.booking_id?.toString().includes(searchLower);
        
        if (!matches) return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      const status = payment.booking_payment_status?.toLowerCase();
      const stripeStatus = payment.stripe_status?.toLowerCase();
      
      if (statusFilter === 'paid') {
        if (status !== 'paid' && stripeStatus !== 'succeeded') return false;
      } else if (statusFilter === 'authorized') {
        if (status !== 'authorized' && stripeStatus !== 'requires_capture') return false;
      } else if (statusFilter === 'unpaid') {
        if (status === 'paid' || status === 'authorized' || stripeStatus === 'succeeded' || stripeStatus === 'requires_capture') return false;
      }
    }

    return true;
  });

  const exportToCSV = () => {
    const headers = [
      'Booking ID',
      'Клиент',
      'Email',
      'Сума',
      'Статус',
      'Дата',
    ];

    const csvData = filteredPayments.map((payment) => [
      payment.booking_id || '',
      payment.customer_name || '',
      payment.customer_email || '',
      payment.stripe_amount || payment.booking_total_cost || '',
      payment.booking_payment_status || '',
      payment.stripe_created ? new Date(payment.stripe_created).toLocaleDateString('bg-BG') : '',
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stripe-payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">Stripe Плащания</h2>
            <p className="text-muted-foreground">Преглед на всички Stripe плащания</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" disabled={loading || filteredPayments.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Изтегли CSV
            </Button>
            <Button onClick={fetchPayments} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Опресни
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Търси по" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всичко</SelectItem>
                <SelectItem value="customer">Клиент</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Търсене..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички</SelectItem>
                <SelectItem value="paid">Платени</SelectItem>
                <SelectItem value="authorized">Авторизирани</SelectItem>
                <SelectItem value="unpaid">Неплатени</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Сума</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Няма намерени плащания
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{payment.booking_id}</TableCell>
                    <TableCell>{payment.customer_name || '-'}</TableCell>
                    <TableCell className="text-sm">{payment.customer_email || '-'}</TableCell>
                    <TableCell className="font-medium">
                      £{(payment.stripe_amount || payment.booking_total_cost || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.booking_payment_status, payment.stripe_status)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {payment.stripe_created
                        ? new Date(payment.stripe_created).toLocaleDateString('bg-BG', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && filteredPayments.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Показани {filteredPayments.length} от {payments.length} плащания
          </div>
        )}
      </Card>
    </div>
  );
};
