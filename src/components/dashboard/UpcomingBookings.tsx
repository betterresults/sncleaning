import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, Copy, Filter, Search, MoreHorizontal, CalendarDays, MapPin, Clock, User, Phone, Mail, Banknote, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Booking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  postcode: string;
  form_name: string;
  total_cost: string;
  cleaner: number | null;
  cleaners?: {
    id: number;
    full_name: string;
    first_name: string;
    last_name: string;
  };
}

const UpcomingBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [cleaners, setCleaners] = useState<
    { id: number; name: string; pay: number }[]
  >([]);
  const [uniqueCleaners, setUniqueCleaners] = useState<
    { id: number; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    customerSearch: '',
    status: 'all',
    cleaner: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [assignedBookings, setAssignedBookings] = useState(0);
  const [unassignedBookings, setUnassignedBookings] = useState(0);

  useEffect(() => {
    fetchData();
  }, [filters, sortOrder]);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: sortOrder === 'asc' });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setError('Failed to fetch bookings');
        return;
      }

      setBookings(bookingsData || []);

      // Fetch cleaners
      const { data: cleanersData, error: cleanersError } = await supabase
        .from('cleaners')
        .select('id, full_name, hourly_rate');

      if (cleanersError) {
        console.error('Error fetching cleaners:', cleanersError);
        setError('Failed to fetch cleaners');
        return;
      }

      const formattedCleaners = cleanersData
        ? cleanersData.map((cleaner) => ({
            id: cleaner.id,
            name: cleaner.full_name,
            pay: cleaner.hourly_rate,
          }))
        : [];
      setCleaners(formattedCleaners);

      // Extract unique cleaners for filter dropdown
      const unique = [
        ...new Map(
          formattedCleaners.map((item) => [item.id, item])
        ).values(),
      ];
      setUniqueCleaners(unique);
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    if (filters.dateFrom) {
      filtered = filtered.filter(
        (booking) => new Date(booking.date_time) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(
        (booking) => new Date(booking.date_time) <= new Date(filters.dateTo)
      );
    }
    if (filters.customerSearch) {
      filtered = filtered.filter(
        (booking) =>
          `${booking.first_name} ${booking.last_name}`
            .toLowerCase()
            .includes(filters.customerSearch.toLowerCase()) ||
          booking.email.toLowerCase().includes(filters.customerSearch.toLowerCase())
      );
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(
        (booking) => booking.booking_status === filters.status
      );
    }
    if (filters.cleaner !== 'all') {
      filtered = filtered.filter(
        (booking) =>
          (booking.cleaner ? booking.cleaner.toString() : 'unassigned') ===
          filters.cleaner
      );
    }

    setFilteredBookings(filtered);
  };

  useEffect(() => {
    // Calculate total revenue
    const total = filteredBookings.reduce(
      (sum, booking) => sum + parseFloat(booking.total_cost),
      0
    );
    setTotalRevenue(total);

    // Count assigned and unassigned bookings
    const assigned = filteredBookings.filter((booking) => booking.cleaner).length;
    const unassigned = filteredBookings.length - assigned;
    setAssignedBookings(assigned);
    setUnassignedBookings(unassigned);
  }, [filteredBookings]);

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      customerSearch: '',
      status: 'all',
      cleaner: 'all',
    });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handleSortOrderChange = (value: 'asc' | 'desc') => {
    setSortOrder(value);
  };

  const getCleanerInfo = (booking: Booking) => {
    if (!booking.cleaner) {
      return { name: 'Unassigned', pay: 0 };
    }

    const cleaner = cleaners.find((c) => c.id === booking.cleaner);
    if (cleaner) {
      return { name: cleaner.name, pay: cleaner.pay };
    }

    return { name: 'Unknown', pay: 0 };
  };

  // Placeholder functions
  const handleEdit = (booking: Booking) => {
    console.log('Edit booking', booking.id);
  };

  const handleCopy = (bookingId: number) => {
    console.log('Copy booking ID', bookingId);
  };

  const handleDelete = (bookingId: number) => {
    console.log('Delete booking', bookingId);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

