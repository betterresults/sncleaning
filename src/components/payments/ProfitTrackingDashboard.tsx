import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, TrendingUp, DollarSign, Users, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ProfitTrackingTable } from './ProfitTrackingTable';
import { DateRange } from 'react-day-picker';

interface SubCleaner {
  cleaner_id: number;
  cleaner_pay: number;
  hours_assigned: number;
  cleaner_name?: string;
}

interface CompletedBooking {
  id: number;
  date_time: string;
  total_cost: string;
  cleaner_pay: number;
  first_name: string;
  last_name: string;
  address: string;
  postcode: string;
  cleaner: number;
  cleaner_name?: string;
  customer: number;
  sub_cleaners?: SubCleaner[];
  total_cleaner_pay?: number; // Combined primary + sub-cleaners
}

export const ProfitTrackingDashboard = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const fetchCompletedBookings = async () => {
    let query = supabase
      .from('past_bookings')
      .select(`
        id,
        date_time,
        total_cost,
        cleaner_pay,
        first_name,
        last_name,
        address,
        postcode,
        cleaner,
        customer,
        booking_status
      `)
      // Exclude cancelled bookings from profit calculation (handle NULL status)
      .or('booking_status.is.null,booking_status.neq.cancelled');

    if (dateRange.from) {
      query = query.gte('date_time', dateRange.from.toISOString());
    }
    
    if (dateRange.to) {
      const endDate = new Date(dateRange.to);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte('date_time', endDate.toISOString());
    }

    const { data: bookings, error } = await query.order('date_time', { ascending: false });

    if (error) throw error;
    
    if (!bookings || bookings.length === 0) return [];

    // Get all booking IDs to fetch additional cleaners
    const bookingIds = bookings.map(b => b.id);

    // Fetch additional cleaners for these bookings using booking_cleaners table
    const { data: bookingCleanersData, error: cleanersError } = await supabase
      .from('booking_cleaners')
      .select('booking_id, cleaner_id, calculated_pay, hours_assigned')
      .in('booking_id', bookingIds)
      .eq('is_primary', false);

    if (cleanersError) {
      console.error('Error fetching booking_cleaners:', cleanersError);
    }

    // Collect all cleaner IDs for name lookup
    const allCleanerIds = new Set<number>();
    bookings.forEach(b => { if (b.cleaner) allCleanerIds.add(b.cleaner); });
    (bookingCleanersData || []).forEach(bc => { if (bc.cleaner_id) allCleanerIds.add(bc.cleaner_id); });

    let cleanerNames: Record<number, string> = {};
    if (allCleanerIds.size > 0) {
      const { data: cleaners } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name')
        .in('id', Array.from(allCleanerIds));

      if (cleaners) {
        cleaners.forEach(c => {
          cleanerNames[c.id] = `${c.first_name || ''} ${c.last_name || ''}`.trim() || `Cleaner ${c.id}`;
        });
      }
    }

    // Group additional cleaners by booking ID
    const additionalCleanersByBooking: Record<number, SubCleaner[]> = {};
    (bookingCleanersData || []).forEach(bc => {
      if (!additionalCleanersByBooking[bc.booking_id]) {
        additionalCleanersByBooking[bc.booking_id] = [];
      }
      additionalCleanersByBooking[bc.booking_id].push({
        cleaner_id: bc.cleaner_id,
        cleaner_pay: bc.calculated_pay || 0,
        hours_assigned: bc.hours_assigned || 0,
        cleaner_name: cleanerNames[bc.cleaner_id] || `Cleaner ${bc.cleaner_id}`
      });
    });

    // Enrich bookings with additional cleaner data and calculate total cleaner pay
    const enrichedBookings = bookings.map(booking => {
      const additionalCleaners = additionalCleanersByBooking[booking.id] || [];
      const primaryPay = booking.cleaner_pay || 0;
      const additionalCleanersPay = additionalCleaners.reduce((sum, ac) => sum + (ac.cleaner_pay || 0), 0);
      
      return {
        ...booking,
        cleaner_name: cleanerNames[booking.cleaner] || (booking.cleaner ? `Cleaner ${booking.cleaner}` : 'Unassigned'),
        sub_cleaners: additionalCleaners,
        total_cleaner_pay: primaryPay + additionalCleanersPay
      };
    });

    return enrichedBookings as CompletedBooking[];
  };

  const { data: completedBookings = [], isLoading } = useQuery({
    queryKey: ['completed-bookings-profit', dateRange.from, dateRange.to],
    queryFn: fetchCompletedBookings,
  });

  const profitMetrics = useMemo(() => {
    const totalRevenue = completedBookings.reduce((sum, booking) => {
      const revenue = parseFloat(booking.total_cost) || 0;
      return sum + revenue;
    }, 0);

    // Use total_cleaner_pay which includes sub-cleaners
    const totalCleanerPay = completedBookings.reduce((sum, booking) => {
      return sum + (booking.total_cleaner_pay || booking.cleaner_pay || 0);
    }, 0);

    const totalProfit = totalRevenue - totalCleanerPay;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const averageBookingValue = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;

    return {
      totalRevenue,
      totalCleanerPay,
      totalProfit,
      profitMargin,
      averageBookingValue,
      totalBookings: completedBookings.length
    };
  }, [completedBookings]);

  const setQuickRange = (range: 'thisMonth' | 'lastMonth' | 'last30Days' | 'last90Days') => {
    const now = new Date();
    
    switch (range) {
      case 'thisMonth':
        setDateRange({
          from: startOfMonth(now),
          to: endOfMonth(now)
        });
        break;
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        setDateRange({
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth)
        });
        break;
      case 'last30Days':
        setDateRange({
          from: subDays(now, 30),
          to: now
        });
        break;
      case 'last90Days':
        setDateRange({
          from: subDays(now, 90),
          to: now
        });
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange('thisMonth')}
            >
              This Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange('lastMonth')}
            >
              Last Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange('last30Days')}
            >
              Last 30 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange('last90Days')}
            >
              Last 90 Days
            </Button>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => range && setDateRange(range)}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{profitMetrics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {profitMetrics.totalBookings} past bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              £{profitMetrics.totalProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue - Cleaner Costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profitMetrics.profitMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Profit as % of revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Booking Value</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{profitMetrics.averageBookingValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue per booking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cleaner Costs Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Total Cleaner Payments</p>
              <p className="text-2xl font-bold text-red-600">
                £{profitMetrics.totalCleanerPay.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Cost as % of Revenue</p>
              <p className="text-2xl font-bold">
                {profitMetrics.totalRevenue > 0 
                  ? ((profitMetrics.totalCleanerPay / profitMetrics.totalRevenue) * 100).toFixed(1)
                  : '0.0'}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Past Bookings Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfitTrackingTable 
            bookings={completedBookings} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>
    </div>
  );
};