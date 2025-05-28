
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import UpcomingBookingsStats from './UpcomingBookingsStats';
import TableControls from './TableControls';
import BookingsTable from './BookingsTable';
import BookingsPagination from './BookingsPagination';
import BookingFilters from './BookingFilters';
import { Booking, Stats } from './types';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';

const CleanerUpcomingBookings = () => {
  const { cleanerId, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter states
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [customerSearch, setCustomerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = async () => {
    if (!cleanerId) {
      console.log('No cleaner ID found, cannot fetch bookings');
      setError('No cleaner ID found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching upcoming bookings for cleaner ID:', cleanerId);
      
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          cleaners!bookings_cleaner_fkey (
            id,
            first_name,
            last_name,
            full_name
          )
        `)
        .eq('cleaner', cleanerId)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: sortOrder === 'asc' });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setError('Failed to fetch bookings: ' + bookingsError.message);
        return;
      }

      console.log('Fetched bookings for cleaner:', bookingsData?.length || 0, 'bookings');
      setBookings(bookingsData || []);

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

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => 
        booking.booking_status?.toLowerCase() === statusFilter.toLowerCase()
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
    setStatusFilter('all');
  };

  const handleDropOff = async (bookingId: number) => {
    if (!cleanerId) {
      console.error('No cleaner ID available');
      return;
    }

    if (window.confirm('Are you sure you want to drop off this booking?')) {
      try {
        const { error } = await supabase
          .from('bookings')
          .update({ cleaner: null, cleaner_pay: null })
          .eq('id', bookingId)
          .eq('cleaner', cleanerId);

        if (error) {
          console.error('Error dropping off booking:', error);
          return;
        }

        fetchData();
      } catch (error) {
        console.error('Error dropping off booking:', error);
      }
    }
  };

  const handleMarkAsCompleted = async (bookingId: number) => {
    if (!cleanerId) {
      console.error('No cleaner ID available');
      return;
    }

    if (window.confirm('Are you sure you want to mark this booking as completed?')) {
      try {
        const { error } = await supabase
          .from('bookings')
          .update({ booking_status: 'Completed' })
          .eq('id', bookingId)
          .eq('cleaner', cleanerId);

        if (error) {
          console.error('Error marking booking as completed:', error);
          return;
        }

        fetchData();
      } catch (error) {
        console.error('Error marking booking as completed:', error);
      }
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
    if (!authLoading && cleanerId) {
      fetchData();
    }
  }, [cleanerId, authLoading, sortOrder]);

  useEffect(() => {
    applyFilters();
  }, [bookings, dateFrom, dateTo, customerSearch, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg">Loading upcoming bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchData}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UpcomingBookingsStats stats={stats} />

      <BookingFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        customerSearch={customerSearch}
        statusFilter={statusFilter}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onCustomerSearchChange={setCustomerSearch}
        onStatusFilterChange={setStatusFilter}
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
        onMarkAsCompleted={handleMarkAsCompleted}
        onDropOff={handleDropOff}
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
