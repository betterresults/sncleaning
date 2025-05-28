import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, Copy, Filter, Search, MoreHorizontal, CalendarDays, MapPin, Clock, User, Phone, Mail, Banknote, AlertTriangle, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import DuplicateBookingDialog from './DuplicateBookingDialog';
import AssignCleanerDialog from './AssignCleanerDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  total_cost: number;
  booking_status: string;
  cleaner: number | null;
  cleaning_type: string;
  payment_status: string;
  customer: number;
  additional_details?: string;
  property_details?: string;
  frequently?: string;
  first_cleaning?: string;
  occupied?: string;
  hours_required?: number;
  total_hours?: number;
  ironing_hours?: number;
  cleaning_time?: number;
  carpet_items?: string;
  exclude_areas?: string;
  upholstery_items?: string;
  mattress_items?: string;
  extras?: string;
  linens?: string;
  ironing?: string;
  parking_details?: string;
  key_collection?: string;
  access?: string;
  agency?: string;
  record_message?: string;
  video_message?: string;
  cost_deduction?: string;
  cleaning_cost_per_visit?: string;
  cleaning_cost_per_hour?: number;
  steam_cleaning_cost?: string;
  deposit?: number;
  oven_size?: string;
  payment_method?: string;
  payment_term?: string;
  cleaner_pay?: number;
  cleaner_rate?: number;
  cleaner_percentage?: number;
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
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [selectedBookingForDuplicate, setSelectedBookingForDuplicate] = useState<Booking | null>(null);
  const [assignCleanerDialogOpen, setAssignCleanerDialogOpen] = useState(false);
  const [selectedBookingForAssignment, setSelectedBookingForAssignment] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBookingForDelete, setSelectedBookingForDelete] = useState<number | null>(null);

  // Debounced search
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Update filters when debounced search term changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, customerSearch: debouncedSearchTerm }));
  }, [debouncedSearchTerm]);

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
    // Calculate total revenue - now handling number type correctly
    const total = filteredBookings.reduce(
      (sum, booking) => sum + Number(booking.total_cost),
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
    setSearchTerm('');
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

  const handleEdit = (booking: Booking) => {
    console.log('Edit booking', booking.id);
  };

  const handleCopy = (bookingId: number) => {
    console.log('Copy booking ID', bookingId);
  };

  const handleDelete = (bookingId: number) => {
    setSelectedBookingForDelete(bookingId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBookingForDelete) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', selectedBookingForDelete);

      if (error) {
        console.error('Error deleting booking:', error);
        return;
      }

      console.log('Booking deleted successfully');
      fetchData(); // Refresh the data
      setDeleteDialogOpen(false);
      setSelectedBookingForDelete(null);
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  const handleDuplicate = (booking: Booking) => {
    console.log('Duplicate booking', booking.id);
    setSelectedBookingForDuplicate(booking);
    setDuplicateDialogOpen(true);
  };

  const handleDuplicateSuccess = () => {
    fetchData();
    setSelectedBookingForDuplicate(null);
  };

  const handleAssignCleaner = (bookingId: number) => {
    setSelectedBookingForAssignment(bookingId);
    setAssignCleanerDialogOpen(true);
  };

  const handleAssignCleanerSuccess = () => {
    fetchData();
    setSelectedBookingForAssignment(null);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4 sm:p-8">
        <div className="text-sm sm:text-lg">Loading upcoming bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 sm:p-8">
        <div className="text-red-600 mb-4 text-sm sm:text-base">{error}</div>
        <Button onClick={fetchData} size="sm">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-blue-600" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold">{filteredBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center space-x-2">
              <Banknote className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-green-600" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold">£{totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center space-x-2">
              <User className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-green-600" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold">{assignedBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-red-600" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Unassigned</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-red-600">{unassignedBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3 lg:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
            <Filter className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
            <div>
              <Label htmlFor="dateFrom" className="text-xs sm:text-sm">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="text-xs sm:text-sm h-8 sm:h-9"
              />
            </div>
            <div>
              <Label htmlFor="dateTo" className="text-xs sm:text-sm">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="text-xs sm:text-sm h-8 sm:h-9"
              />
            </div>
            <div>
              <Label htmlFor="customerSearch" className="text-xs sm:text-sm">Customer Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2 sm:top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="customerSearch"
                  placeholder="Name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-6 sm:pl-8 text-xs sm:text-sm h-8 sm:h-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cleaner" className="text-xs sm:text-sm">Cleaner</Label>
              <Select
                value={filters.cleaner}
                onValueChange={(value) => setFilters({ ...filters, cleaner: value })}
              >
                <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-9">
                  <SelectValue placeholder="All Cleaners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cleaners</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {uniqueCleaners.map((cleaner) => (
                    <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                      {cleaner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline" className="w-full text-xs sm:text-sm h-8 sm:h-9">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-gray-50 p-3 sm:p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Label htmlFor="itemsPerPage" className="text-xs sm:text-sm whitespace-nowrap">Show:</Label>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => handleItemsPerPageChange(Number(value))}
            >
              <SelectTrigger className="w-16 sm:w-20 text-xs sm:text-sm h-7 sm:h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="sortOrder" className="text-xs sm:text-sm whitespace-nowrap">Sort:</Label>
            <Select
              value={sortOrder}
              onValueChange={(value: 'asc' | 'desc') => handleSortOrderChange(value)}
            >
              <SelectTrigger className="w-28 sm:w-32 text-xs sm:text-sm h-7 sm:h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Date: Earliest First</SelectItem>
                <SelectItem value="desc">Date: Latest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-xs sm:text-sm text-gray-600 w-full sm:w-auto text-left sm:text-right">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
        </div>
      </div>

      {/* Mobile Card View for small screens, Table for larger screens */}
      <Card>
        <CardContent className="p-0">
          {/* Mobile Card View */}
          <div className="block lg:hidden">
            {paginatedBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No upcoming bookings found
              </div>
            ) : (
              <div className="space-y-3 p-3">
                {paginatedBookings.map((booking) => {
                  const cleanerInfo = getCleanerInfo(booking);
                  const isUnassigned = cleanerInfo.name === 'Unassigned';
                  
                  return (
                    <Card key={booking.id} className={`border ${isUnassigned ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
                      <CardContent className="p-3">
                        <div className="space-y-3">
                          {/* Date and Time */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <CalendarDays className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="font-medium text-sm">
                                  {format(new Date(booking.date_time), 'dd/MM/yyyy')}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {format(new Date(booking.date_time), 'HH:mm')}
                                </div>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => handleEdit(booking)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(booking)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(booking.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Customer Info */}
                          <div className="space-y-1">
                            <div className="font-medium text-sm flex items-center">
                              <User className="h-3 w-3 mr-2 text-gray-400" />
                              {booking.first_name} {booking.last_name}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <Mail className="h-3 w-3 mr-2" />
                              {booking.email}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <Phone className="h-3 w-3 mr-2" />
                              {booking.phone_number}
                            </div>
                          </div>

                          {/* Address */}
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
                            <div className="text-xs text-gray-700 leading-tight">
                              <div>{booking.address}</div>
                              {booking.postcode && (
                                <div className="text-gray-500 font-medium">{booking.postcode}</div>
                              )}
                            </div>
                          </div>

                          {/* Service and Cleaner */}
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {booking.form_name || 'Standard Cleaning'}
                            </span>
                          </div>

                          {/* Cleaner and Cost */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex-1">
                              {isUnassigned ? (
                                <button
                                  onClick={() => handleAssignCleaner(booking.id)}
                                  className="flex items-center space-x-2 bg-red-100 hover:bg-red-200 px-3 py-2 rounded-lg border border-red-200 transition-colors cursor-pointer w-full text-left"
                                >
                                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                  <span className="text-sm font-semibold text-red-700">Click to Assign Cleaner</span>
                                  <UserPlus className="h-3 w-3 text-red-600 ml-auto" />
                                </button>
                              ) : (
                                <div className="text-xs">
                                  <span className="text-gray-500">Cleaner: </span>
                                  <span className="font-medium">{cleanerInfo.name}</span>
                                </div>
                              )}
                              <div className="text-xs text-green-600 font-medium flex items-center mt-1">
                                <Banknote className="h-3 w-3 mr-1" />
                                Pay: £{cleanerInfo.pay.toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-green-600 text-sm">
                                £{Number(booking.total_cost).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Date & Time</TableHead>
                  <TableHead className="text-xs sm:text-sm">Customer</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Address</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Service</TableHead>
                  <TableHead className="text-xs sm:text-sm">Cleaner</TableHead>
                  <TableHead className="text-xs sm:text-sm">Cost</TableHead>
                  <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 sm:py-8 text-xs sm:text-sm text-gray-500">
                      No upcoming bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBookings.map((booking) => {
                    const cleanerInfo = getCleanerInfo(booking);
                    const isUnassigned = cleanerInfo.name === 'Unassigned';
                    
                    return (
                      <TableRow 
                        key={booking.id} 
                        className={isUnassigned 
                          ? "hover:bg-red-50 transition-colors bg-red-50/50 border-l-2 sm:border-l-4 border-red-500" 
                          : "hover:bg-gray-50 transition-colors"
                        }
                      >
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <CalendarDays className="h-2 w-2 sm:h-3 sm:w-3 text-gray-400" />
                              <span className="font-medium">
                                {format(new Date(booking.date_time), 'dd/MM/yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <Clock className="h-2 w-2 sm:h-3 sm:w-3 text-gray-400" />
                              <span className="text-gray-600">
                                {format(new Date(booking.date_time), 'HH:mm')}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <User className="h-2 w-2 sm:h-3 sm:w-3 text-gray-400" />
                              <span className="font-medium">
                                {booking.first_name} {booking.last_name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2 sm:hidden lg:flex">
                              <Mail className="h-2 w-2 sm:h-3 sm:w-3 text-gray-400" />
                              <span className="text-gray-600 truncate">{booking.email}</span>
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2 sm:hidden lg:flex">
                              <Phone className="h-2 w-2 sm:h-3 sm:w-3 text-gray-400" />
                              <span className="text-gray-600">{booking.phone_number}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <MapPin className="h-2 w-2 sm:h-3 sm:w-3 text-gray-400" />
                            <div>
                              <div className="font-medium">{booking.address}</div>
                              <div className="text-gray-600">{booking.postcode}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                          <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                            {booking.form_name}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {isUnassigned ? (
                            <div className="space-y-1">
                              <button
                                onClick={() => handleAssignCleaner(booking.id)}
                                className="flex items-center space-x-2 bg-red-100 hover:bg-red-200 px-3 py-2 rounded-lg border border-red-200 transition-colors cursor-pointer w-full text-left group"
                              >
                                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="text-sm font-semibold text-red-700 block">Unassigned</span>
                                  <span className="text-xs text-red-600 group-hover:text-red-700">Click to assign</span>
                                </div>
                                <UserPlus className="h-3 w-3 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                              <div className="text-xs text-red-600 font-medium flex items-center pl-1 sm:pl-2">
                                <Banknote className="h-2 w-2 sm:h-3 sm:w-3 mr-1 sm:mr-2" />
                                Pay: £{cleanerInfo.pay.toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <User className="h-2 w-2 sm:h-3 sm:w-3 text-gray-400" />
                                <span className="font-medium">{cleanerInfo.name}</span>
                              </div>
                              <div className="text-xs text-green-600 font-medium flex items-center">
                                <Banknote className="h-2 w-2 sm:h-3 sm:w-3 mr-1 sm:mr-2" />
                                Pay: £{cleanerInfo.pay.toFixed(2)}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <span className="font-semibold text-green-600">
                            £{Number(booking.total_cost).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                                <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(booking)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(booking)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(booking.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            Previous
          </Button>
          
          <div className="flex space-x-1 sm:space-x-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-8 h-8 sm:w-auto sm:h-auto text-xs sm:text-sm"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            Next
          </Button>
        </div>
      )}
      
      {/* Duplicate Booking Dialog */}
      <DuplicateBookingDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        booking={selectedBookingForDuplicate}
        onSuccess={handleDuplicateSuccess}
      />

      {/* Assign Cleaner Dialog */}
      <AssignCleanerDialog
        open={assignCleanerDialogOpen}
        onOpenChange={setAssignCleanerDialogOpen}
        bookingId={selectedBookingForAssignment}
        onSuccess={handleAssignCleanerSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UpcomingBookings;
