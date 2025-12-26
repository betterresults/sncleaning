import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import { supabase } from '@/integrations/supabase/client';
import UpcomingBookingsStats from './UpcomingBookingsStats';
import TableControls from './TableControls';
import BookingsTable from './BookingsTable';
import BookingsPagination from './BookingsPagination';
import BookingFilters from './BookingFilters';
import { Booking, Stats } from './types';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';

const CleanerUpcomingBookings = () => {
  const { cleanerId, userRole, loading: authLoading } = useAuth();
  const { selectedCleanerId } = useAdminCleaner();
  
  // Use selected cleaner ID if admin is viewing, otherwise use authenticated cleaner's ID
  const effectiveCleanerId = userRole === 'admin' ? selectedCleanerId : cleanerId;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);  // Increased from 10 to 25
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter states
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [customerSearch, setCustomerSearch] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);

  const fetchData = async () => {
    if (!effectiveCleanerId) {
      console.log('No cleaner ID found, cannot fetch bookings');
      setError(userRole === 'admin' ? 'Please select a cleaner to view' : 'No cleaner ID found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('CleanerUpcomingBookings - Fetching data for cleaner ID:', effectiveCleanerId);
      
      // SINGLE SOURCE OF TRUTH: Get all bookings where this cleaner is assigned via cleaner_payments
      const { data: cleanerAssignments, error: assignmentsError } = await supabase
        .from('cleaner_payments')
        .select('booking_id, hours_assigned, calculated_pay, is_primary')
        .eq('cleaner_id', effectiveCleanerId);

      if (assignmentsError) {
        console.error('Error fetching cleaner_payments:', assignmentsError);
        setError('Failed to fetch bookings: ' + assignmentsError.message);
        return;
      }

      if (!cleanerAssignments || cleanerAssignments.length === 0) {
        console.log('No bookings found for cleaner in cleaner_payments');
        setBookings([]);
        setServiceTypes([]);
        setLoading(false);
        return;
      }

      // Get all booking IDs where this cleaner is assigned
      const bookingIds = cleanerAssignments.map(a => a.booking_id);

      // Fetch full booking details for all assigned bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .in('id', bookingIds)
        .or('booking_status.is.null,booking_status.neq.cancelled')
        .gte('date_time', startOfDay(new Date()).toISOString())
        .order('date_time', { ascending: sortOrder === 'asc' });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setError('Failed to fetch bookings: ' + bookingsError.message);
        return;
      }

      // Fetch all cleaner assignments for these bookings (for co-cleaners info)
      const { data: allCleanerPayments } = await supabase
        .from('cleaner_payments')
        .select(`
          booking_id,
          cleaner_id,
          is_primary,
          hours_assigned,
          calculated_pay,
          cleaners (
            id,
            full_name
          )
        `)
        .in('booking_id', bookingIds);

      // Enrich bookings with cleaner assignment data and co-cleaners
      let allBookings = (bookingsData || []).map(booking => {
        // Find this cleaner's assignment for the booking
        const myAssignment = cleanerAssignments.find(a => a.booking_id === booking.id);
        const isPrimary = myAssignment?.is_primary || false;
        
        // Get co-cleaners (other cleaners assigned to this booking)
        const coCleaners = (allCleanerPayments || [])
          .filter(cp => cp.booking_id === booking.id && cp.cleaner_id !== effectiveCleanerId)
          .map(cp => ({
            id: cp.cleaner_id,
            full_name: cp.cleaners?.full_name || 'Unknown',
            is_primary: cp.is_primary
          }));

        // Use cleaner_payments data for pay and hours
        return {
          ...booking,
          cleaner_pay: myAssignment?.calculated_pay || booking.cleaner_pay,
          total_hours: myAssignment?.hours_assigned || booking.total_hours,
          is_sub_cleaner: !isPrimary,
          co_cleaners: coCleaners
        };
      });

      // Sort all bookings by date
      allBookings.sort((a, b) => {
        const dateA = new Date(a.date_time || 0).getTime();
        const dateB = new Date(b.date_time || 0).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });

      console.log('Fetched bookings for cleaner from cleaner_payments:', allBookings.length, 'bookings');
      
      setBookings(allBookings);

      // Extract unique service types for filter dropdown
      const uniqueServiceTypes = [...new Set(
        allBookings
          .map(booking => booking.service_type)
          .filter(serviceType => serviceType && serviceType.trim() !== '')
      )].sort();
      
      setServiceTypes(uniqueServiceTypes);

    } catch (error) {
      console.error('Error in fetchData:', error);
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Date range filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter(booking => {
        if (!booking.date_time) return false;
        const bookingDate = new Date(booking.date_time);
        
        if (dateFrom && dateTo) {
          return isWithinInterval(bookingDate, {
            start: startOfDay(dateFrom),
            end: endOfDay(dateTo)
          });
        } else if (dateFrom) {
          return bookingDate >= startOfDay(dateFrom);
        } else if (dateTo) {
          return bookingDate <= endOfDay(dateTo);
        }
        return true;
      });
    }

    // Customer search filter
    if (customerSearch.trim()) {
      const searchTerm = customerSearch.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.first_name?.toLowerCase().includes(searchTerm) ||
        booking.last_name?.toLowerCase().includes(searchTerm) ||
        booking.email?.toLowerCase().includes(searchTerm)
      );
    }

    // Service type filter (use service_type, not cleaning_type)
    if (serviceTypeFilter !== 'all') {
      filtered = filtered.filter(booking => 
        booking.service_type === serviceTypeFilter
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);

    const totalEarnings = filtered.reduce((sum, booking) => sum + (booking.cleaner_pay || 0), 0);
    
    setStats({
      totalBookings: filtered.length,
      totalEarnings
    });
  };

  const handleClearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setCustomerSearch('');
    setServiceTypeFilter('all');
  };

  const handleDropOff = async (bookingId: number) => {
    if (!effectiveCleanerId) {
      console.error('No cleaner ID available');
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ cleaner: null, cleaner_pay: null })
        .eq('id', bookingId)
        .eq('cleaner', effectiveCleanerId);

      if (error) {
        console.error('Error dropping off booking:', error);
        return;
      }

      fetchData();
    } catch (error) {
      console.error('Error dropping off booking:', error);
    }
  };


  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handleSortOrderChange = (value: 'asc' | 'desc') => {
    setSortOrder(value);
  };

  useEffect(() => {
    if (!authLoading && effectiveCleanerId) {
      fetchData();
    }
  }, [effectiveCleanerId, authLoading, sortOrder]);

  // Real-time subscription for bookings changes
  useEffect(() => {
    if (!effectiveCleanerId) return;

    const channel = supabase
      .channel('cleaner-upcoming-bookings-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('Cleaner upcoming bookings realtime update:', payload);
          // Force immediate refetch for real-time updates
          fetchData();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveCleanerId]);

  useEffect(() => {
    applyFilters();
  }, [bookings, dateFrom, dateTo, customerSearch, serviceTypeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  if (authLoading || loading) {
    console.log('CleanerUpcomingBookings - Loading state:', { authLoading, loading, effectiveCleanerId });
    return (
      <div className="flex justify-center py-8">
        <div className="text-base">Loading upcoming bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4 text-sm px-4">{error}</div>
        <button 
          onClick={fetchData}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 w-full">
      <UpcomingBookingsStats stats={stats} />

          <BookingFilters
            dateFrom={dateFrom}
            dateTo={dateTo}
            customerSearch={customerSearch}
            serviceTypeFilter={serviceTypeFilter}
            serviceTypes={serviceTypes}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onCustomerSearchChange={setCustomerSearch}
            onServiceTypeFilterChange={setServiceTypeFilter}
            onClearFilters={handleClearFilters}
          />

      <TableControls
        itemsPerPage={itemsPerPage}
        sortOrder={sortOrder}
        startIndex={startIndex}
        totalBookings={filteredBookings.length}
        onItemsPerPageChange={handleItemsPerPageChange}
        onSortOrderChange={handleSortOrderChange}
      />

      <BookingsTable
        bookings={paginatedBookings}
        title="Upcoming Bookings"
        type="upcoming"
        onDropService={handleDropOff}
      />

      <BookingsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default CleanerUpcomingBookings;
