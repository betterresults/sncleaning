
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, Copy, Search, MoreHorizontal, CalendarDays, MapPin, Clock, User, Phone, Mail, Banknote, AlertTriangle, UserPlus, Settings, Users, X } from 'lucide-react';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import DuplicateBookingDialog from './DuplicateBookingDialog';
import AssignCleanerDialog from './AssignCleanerDialog';
import EditBookingDialog from './EditBookingDialog';
import BulkEditBookingsDialog from './BulkEditBookingsDialog';
import { useToast } from '@/hooks/use-toast';
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

interface UpcomingBookingsProps {
  selectedTimeRange: 'today' | '3days' | '7days' | '30days';
}

const UpcomingBookings = ({ selectedTimeRange }: UpcomingBookingsProps) => {
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
    customerSearch: '',
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<Booking | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<number | null>(null);

  // Debounced search
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const { toast } = useToast();

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

  const getDateRangeFilter = () => {
    const today = startOfDay(new Date());
    let endDate;
    
    switch (selectedTimeRange) {
      case 'today':
        endDate = endOfDay(new Date());
        break;
      case '3days':
        endDate = endOfDay(addDays(new Date(), 3));
        break;
      case '7days':
        endDate = endOfDay(addDays(new Date(), 7));
        break;
      case '30days':
        endDate = endOfDay(addDays(new Date(), 30));
        break;
      default:
        endDate = endOfDay(addDays(new Date(), 30));
    }
    
    return { startDate: today, endDate };
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getDateRangeFilter();

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .gte('date_time', startDate.toISOString())
        .lte('date_time', endDate.toISOString())
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

    if (filters.customerSearch) {
      filtered = filtered.filter(
        (booking) =>
          `${booking.first_name} ${booking.last_name}`
            .toLowerCase()
            .includes(filters.customerSearch.toLowerCase()) ||
          booking.email.toLowerCase().includes(filters.customerSearch.toLowerCase())
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
    fetchData();
  }, [filters, sortOrder, selectedTimeRange]);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

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
      customerSearch: '',
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
      // Return the actual cleaner_pay from booking instead of hourly rate
      return { name: cleaner.name, pay: booking.cleaner_pay || 0 };
    }

    return { name: 'Unknown', pay: booking.cleaner_pay || 0 };
  };

  const handleEdit = (booking: Booking) => {
    setSelectedBookingForEdit(booking);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    toast({
      title: "Success",
      description: "Booking updated successfully",
    });
    fetchData();
    setSelectedBookingForEdit(null);
  };

  const handleCopy = (bookingId: number) => {
    console.log('Copy booking ID', bookingId);
  };

  const handleDelete = (bookingId: number) => {
    setSelectedBookingForDelete(bookingId);
    setDeleteDialogOpen(true);
  };

  const handleCancel = (bookingId: number) => {
    setSelectedBookingForCancel(bookingId);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBookingForCancel) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: 'Cancelled' })
        .eq('id', selectedBookingForCancel);

      if (error) {
        console.error('Error cancelling booking:', error);
        setError('Failed to cancel booking: ' + error.message);
        return;
      }

      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      });

      setCancelDialogOpen(false);
      setSelectedBookingForCancel(null);
      await fetchData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setError('An unexpected error occurred while cancelling');
    }
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
        setError('Failed to delete booking: ' + error.message);
        return;
      }

      setDeleteDialogOpen(false);
      setSelectedBookingForDelete(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting booking:', error);
      setError('An unexpected error occurred while deleting');
    }
  };

  const handleDuplicate = (booking: Booking) => {
    setSelectedBookingForDuplicate(booking);
    setDuplicateDialogOpen(true);
  };

  const handleDuplicateSuccess = () => {
    fetchData();
    setSelectedBookingForDuplicate(null);
  };

  const handleCleanerAssignment = async (bookingId: number, cleanerId: number | null) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ cleaner: cleanerId })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating cleaner assignment:', error);
        return;
      }

      toast({
        title: "Success",
        description: cleanerId ? "Cleaner assigned successfully" : "Booking unassigned successfully",
      });

      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating cleaner assignment:', error);
    }
  };

  const handleAssignCleaner = (bookingId: number) => {
    setSelectedBookingForAssignment(bookingId);
    setAssignCleanerDialogOpen(true);
  };

  const handleAssignCleanerSuccess = () => {
    toast({
      title: "Success", 
      description: "Cleaner assigned successfully",
    });
    fetchData();
    setSelectedBookingForAssignment(null);
  };

  const handleCleanerClick = (bookingId: number) => {
    setSelectedBookingForAssignment(bookingId);
    setAssignCleanerDialogOpen(true);
  };

  const handlePhoneClick = (phoneNumber: string) => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleEmailClick = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  // Pagination
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
      {/* Unassigned Bookings Alert */}
      {unassignedBookings > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-semibold text-red-800">
                  You have {unassignedBookings} unassigned booking{unassignedBookings > 1 ? 's' : ''}
                </div>
                <div className="text-sm text-red-600">
                  Click on "Unassigned" in the bookings below to assign cleaners
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Stats Cards - Dynamic grid based on unassigned bookings */}
      <div className={`grid gap-4 lg:gap-6 ${unassignedBookings > 0 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-lg">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 p-3 rounded-full">
                <CalendarDays className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Total Bookings</p>
                <p className="text-3xl font-bold text-blue-900">{filteredBookings.length}</p>
                <p className="text-xs text-blue-600">Upcoming bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-lg">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500 p-3 rounded-full">
                <Banknote className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Total Revenue</p>
                <p className="text-3xl font-bold text-green-900">£{totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-green-600">Expected revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {unassignedBookings > 0 && (
          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 shadow-lg">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-red-500 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-700">Unassigned</p>
                  <p className="text-3xl font-bold text-red-900">{unassignedBookings}</p>
                  <p className="text-xs text-red-600">Need cleaner assignment</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Simplified Filters */}
      <Card>
        <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 py-3 sm:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            <div>
              <Label htmlFor="customerSearch" className="text-xs sm:text-sm flex items-center gap-2">
                <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                Customer Search
              </Label>
              <Input
                id="customerSearch"
                placeholder="Name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs sm:text-sm h-8 sm:h-9"
              />
            </div>
            <div>
              <Label htmlFor="cleaner" className="text-xs sm:text-sm flex items-center gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                Cleaner
              </Label>
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

          {/* Bulk Edit Button */}
          <Button 
            onClick={() => setBulkEditOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm h-7 sm:h-8"
          >
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            Bulk Edit
          </Button>
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
                                <DropdownMenuItem onClick={() => handleCancel(booking.id)}>
                                  <X className="mr-2 h-4 w-4" />
                                  Cancel
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

                          {/* Customer Info with clickable phone and email */}
                          <div className="space-y-1">
                            <div className="font-medium text-sm flex items-center">
                              <User className="h-3 w-3 mr-2 text-gray-400" />
                              {booking.first_name} {booking.last_name}
                            </div>
                            <button 
                              onClick={() => handleEmailClick(booking.email)}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center cursor-pointer"
                            >
                              <Mail className="h-3 w-3 mr-2" />
                              {booking.email}
                            </button>
                            <button 
                              onClick={() => handlePhoneClick(booking.phone_number)}
                              className="text-xs text-green-600 hover:text-green-800 flex items-center cursor-pointer"
                            >
                              <Phone className="h-3 w-3 mr-2" />
                              {booking.phone_number}
                            </button>
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

                          {/* Service */}
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
                              {booking.form_name || 'Standard Cleaning'}
                            </span>
                          </div>

                          {/* Cleaner Dropdown and Cost */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-xs">
                                    <Users className="h-3 w-3 mr-1" />
                                    {isUnassigned ? "Unassigned" : cleanerInfo.name}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleCleanerAssignment(booking.id, null)}>
                                    Unassigned
                                  </DropdownMenuItem>
                                  {cleaners.map((cleaner) => (
                                    <DropdownMenuItem 
                                      key={cleaner.id}
                                      onClick={() => handleCleanerAssignment(booking.id, cleaner.id)}
                                    >
                                      {cleaner.name}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <div className="text-xs text-gray-600 font-medium flex items-center mt-1">
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
                        {/* Date & Time */}
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

                        {/* Customer with clickable phone and email */}
                        <TableCell className="text-xs sm:text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <User className="h-2 w-2 sm:h-3 sm:w-3 text-gray-400" />
                              <span className="font-medium">
                                {booking.first_name} {booking.last_name}
                              </span>
                            </div>
                            <button 
                              onClick={() => handleEmailClick(booking.email)}
                              className="flex items-center space-x-1 sm:space-x-2 sm:hidden lg:flex text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                              <Mail className="h-2 w-2 sm:h-3 sm:w-3" />
                              <span className="text-gray-600 truncate">{booking.email}</span>
                            </button>
                            <button 
                              onClick={() => handlePhoneClick(booking.phone_number)}
                              className="flex items-center space-x-1 sm:space-x-2 sm:hidden lg:flex text-green-600 hover:text-green-800 cursor-pointer"
                            >
                              <Phone className="h-2 w-2 sm:h-3 sm:w-3" />
                              <span className="text-gray-600">{booking.phone_number}</span>
                            </button>
                          </div>
                        </TableCell>

                        {/* Address */}
                        <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <MapPin className="h-2 w-2 sm:h-3 sm:w-3 text-gray-400" />
                            <div>
                              <div className="font-medium">{booking.address}</div>
                              <div className="text-gray-600">{booking.postcode}</div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Service with improved styling */}
                        <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                          <span className="inline-block bg-slate-100 text-slate-700 px-3 py-1 rounded font-medium">
                            {booking.form_name}
                          </span>
                        </TableCell>

                        {/* Cleaner Dropdown */}
                        <TableCell className="text-xs sm:text-sm">
                          <div className="space-y-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className={`text-xs ${isUnassigned ? 'text-red-600 border-red-200' : 'text-blue-600'}`}
                                >
                                  <Users className="h-3 w-3 mr-1" />
                                  {isUnassigned ? "" : cleanerInfo.name}
                                  {isUnassigned && <span className="text-red-600">Unassigned</span>}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleCleanerAssignment(booking.id, null)}>
                                  Unassigned
                                </DropdownMenuItem>
                                {cleaners.map((cleaner) => (
                                  <DropdownMenuItem 
                                    key={cleaner.id}
                                    onClick={() => handleCleanerAssignment(booking.id, cleaner.id)}
                                  >
                                    {cleaner.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="text-xs text-gray-600 font-medium flex items-center">
                              <Banknote className="h-2 w-2 sm:h-3 sm:w-3 mr-1 sm:mr-2" />
                              Pay: £{cleanerInfo.pay.toFixed(2)}
                            </div>
                          </div>
                        </TableCell>

                        {/* Cost */}
                        <TableCell className="text-xs sm:text-sm">
                          <span className="font-semibold text-green-600">
                            £{Number(booking.total_cost).toFixed(2)}
                          </span>
                        </TableCell>

                        {/* Actions */}
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
                              <DropdownMenuItem onClick={() => handleCancel(booking.id)}>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
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

      {/* Edit Booking Dialog */}
      <EditBookingDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        booking={selectedBookingForEdit}
        onSuccess={handleEditSuccess}
      />

      {/* Bulk Edit Bookings Dialog */}
      <BulkEditBookingsDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        onSuccess={fetchData}
      />

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This will set the booking status to cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
