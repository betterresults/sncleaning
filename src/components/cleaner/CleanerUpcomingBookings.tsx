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
      
      // Fetch bookings where cleaner is primary
      const { data: primaryBookings, error: primaryError } = await supabase
        .from('bookings')
        .select(`
          *,
          time_only,
          cleaners!bookings_cleaner_fkey (
            id,
            first_name,
            last_name,
            full_name
          )
        `)
        .eq('cleaner', effectiveCleanerId)
        .neq('booking_status', 'cancelled')
        .gte('date_time', startOfDay(new Date()).toISOString())
        .order('date_time', { ascending: sortOrder === 'asc' });

      if (primaryError) {
        console.error('Error fetching primary bookings:', primaryError);
        setError('Failed to fetch bookings: ' + primaryError.message);
        return;
      }

      // Fetch bookings where cleaner is assigned (primary or additional) via cleaner_payments
      const { data: cleanerAssignments, error: assignmentsError } = await supabase
        .from('cleaner_payments')
        .select('booking_id, hours_assigned, calculated_pay, is_primary')
        .eq('cleaner_id', effectiveCleanerId);

      if (assignmentsError) {
        console.error('Error fetching cleaner_payments:', assignmentsError);
        // Continue with just primary bookings from bookings table
      }

      // For primary bookings, fetch all cleaners to adjust primary cleaner's pay
      const primaryBookingIds = (primaryBookings || []).map(b => b.id);
      let additionalCleanersForPrimary: { booking_id: number; hours_assigned: number | null; calculated_pay: number }[] = [];
      
      if (primaryBookingIds.length > 0) {
        const { data: additionalCleanersData, error: additionalError } = await supabase
          .from('cleaner_payments')
          .select('booking_id, hours_assigned, calculated_pay')
          .in('booking_id', primaryBookingIds)
          .eq('is_primary', false);
        
        if (!additionalError && additionalCleanersData) {
          additionalCleanersForPrimary = additionalCleanersData;
        }
      }

      // Adjust primary cleaner's pay based on additional cleaners
      let allBookings = (primaryBookings || []).map(booking => {
        const additionalCleaners = additionalCleanersForPrimary.filter(sc => sc.booking_id === booking.id);
        if (additionalCleaners.length > 0) {
          // Calculate total hours assigned to additional cleaners
          const additionalCleanerHours = additionalCleaners.reduce((sum, sc) => sum + (sc.hours_assigned || 0), 0);
          const totalHours = booking.total_hours || 0;
          const remainingHours = Math.max(0, totalHours - additionalCleanerHours);
          
          // Recalculate primary cleaner's pay based on remaining hours
          const cleanerRate = booking.cleaner_rate || 20; // Default to £20/hour
          const adjustedPay = remainingHours * cleanerRate;
          
          return {
            ...booking,
            cleaner_pay: adjustedPay,
            total_hours: remainingHours
          };
        }
        return booking;
      });

      // If cleaner is assigned as additional cleaner to other bookings, fetch those
      const additionalAssignments = (cleanerAssignments || []).filter(a => !a.is_primary);
      if (additionalAssignments.length > 0) {
        const additionalBookingIds = additionalAssignments.map(a => a.booking_id);
        
        const { data: additionalBookingDetails, error: additionalDetailsError } = await supabase
          .from('bookings')
          .select(`
            *,
            time_only,
            cleaners!bookings_cleaner_fkey (
              id,
              first_name,
              last_name,
              full_name
            )
          `)
          .in('id', additionalBookingIds)
          .gte('date_time', startOfDay(new Date()).toISOString());

        if (!additionalDetailsError && additionalBookingDetails) {
          // Merge additional cleaner pay info and mark as additional cleaner booking
          const enrichedAdditionalBookings = additionalBookingDetails.map(booking => {
            const assignment = additionalAssignments.find(a => a.booking_id === booking.id);
            return {
              ...booking,
              cleaner_pay: assignment?.calculated_pay || booking.cleaner_pay,
              total_hours: assignment?.hours_assigned || booking.total_hours,
              is_sub_cleaner: true
            };
          });
          
          // Add additional bookings that aren't already in primary bookings
          const primaryIds = new Set(allBookings.map(b => b.id));
          const newAdditionalBookings = enrichedAdditionalBookings.filter(b => !primaryIds.has(b.id));
          allBookings = [...allBookings, ...newAdditionalBookings];
        }
      }

      // Fetch all co-cleaners for all bookings
      const allBookingIds = allBookings.map(b => b.id);
      if (allBookingIds.length > 0) {
        const { data: allCleanerPayments } = await supabase
          .from('cleaner_payments')
          .select(`
            booking_id,
            cleaner_id,
            is_primary,
            cleaners (
              id,
              full_name
            )
          `)
          .in('booking_id', allBookingIds);

        if (allCleanerPayments) {
          // Add co-cleaners to each booking
          allBookings = allBookings.map(booking => {
            const bookingCleaners = allCleanerPayments
              .filter(cp => cp.booking_id === booking.id && cp.cleaner_id !== effectiveCleanerId)
              .map(cp => ({
                id: cp.cleaner_id,
                full_name: cp.cleaners?.full_name || 'Unknown',
                is_primary: cp.is_primary
              }));
            
            return {
              ...booking,
              co_cleaners: bookingCleaners
            };
          });
        }
      }

      // Sort all bookings by date
      allBookings.sort((a, b) => {
        const dateA = new Date(a.date_time || 0).getTime();
        const dateB = new Date(b.date_time || 0).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });

      console.log('Fetched bookings for cleaner:', allBookings.length, 'bookings (primary + sub)');
      
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
