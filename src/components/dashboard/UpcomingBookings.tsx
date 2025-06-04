import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, isSameDay, parseISO, addDays, isWithinInterval } from 'date-fns';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Search, 
  Filter, 
  Edit, 
  Users, 
  Copy,
  UserPlus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Trash,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EditBookingDialog from './EditBookingDialog';
import AssignCleanerDialog from './AssignCleanerDialog';
import DuplicateBookingDialog from './DuplicateBookingDialog';
import BulkEditBookingsDialog from './BulkEditBookingsDialog';
import AddSubCleanerDialog from '@/components/booking/AddSubCleanerDialog';
import SubCleanersList from '@/components/booking/SubCleanersList';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Booking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  address: string;
  postcode: string;
  total_cost: number;
  cleaner_pay: number;
  hours_required: number;
  form_name: string;
  cleaning_type: string;
  booking_status: string;
  payment_status: string;
  cleaner: number | null;
  customer: number | null;
  additional_details: string;
  property_details: string;
  payment_method: string;
  frequently: string;
  occupied: string;
  first_cleaning: string;
  days: string;
  exclude_areas: string;
  extras: string;
  parking_details: string;
  key_collection: string;
  access: string;
}

interface CleanerInfo {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
}

interface UpcomingBookingsProps {
  selectedTimeRange?: 'today' | '3days' | '7days' | '30days';
  onTimeRangeChange?: (timeRange: 'today' | '3days' | '7days' | '30days') => void;
  hideTimeRangeButtons?: boolean;
  hideStatistics?: boolean;
}

const UpcomingBookings = ({ selectedTimeRange = '3days', onTimeRangeChange, hideTimeRangeButtons = false, hideStatistics = false }: UpcomingBookingsProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cleaners, setCleaners] = useState<CleanerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cleanerFilter, setCleanerFilter] = useState('all');
  const [selectedBookings, setSelectedBookings] = useState<number[]>([]);
  const [expandedSubCleaners, setExpandedSubCleaners] = useState<Set<number>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<Booking | null>(null);
  const { toast } = useToast();

  // Calculate date range based on selected time range
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (selectedTimeRange) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case '3days':
        return {
          start: now, // Start from current time for future ranges
          end: addDays(today, 3)
        };
      case '7days':
        return {
          start: now, // Start from current time for future ranges
          end: addDays(today, 7)
        };
      case '30days':
        return {
          start: now, // Start from current time for future ranges
          end: addDays(today, 30)
        };
      default:
        return {
          start: now,
          end: addDays(today, 3)
        };
    }
  };

  // Enhanced fetchBookings with auto-refresh
  const fetchBookings = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      console.log('Fetching upcoming bookings...', forceRefresh ? '(forced refresh)' : '');
      
      // For 'today' view, get all bookings from today regardless of time
      // For other views, get future bookings from current time
      const startTime = selectedTimeRange === 'today' 
        ? new Date().toISOString().split('T')[0] // Start of today (YYYY-MM-DD format)
        : new Date().toISOString(); // Current time for future bookings

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .gte('date_time', startTime)
        .order('date_time', { ascending: true });

      if (error) {
        console.error('Error fetching bookings:', error);
        toast({
          title: "Error",
          description: "Failed to fetch bookings",
          variant: "destructive",
        });
        return;
      }

      console.log('Fetched bookings:', data);
      setBookings(data || []);
    } catch (error) {
      console.error('Error in fetchBookings:', error);
    } finally {
      setLoading(false);
    }
  }, [toast, selectedTimeRange]);

  const fetchCleaners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name, full_name, email, phone')
        .order('first_name');

      if (error) {
        console.error('Error fetching cleaners:', error);
        return;
      }

      // Convert phone from number to string
      const typedCleaners = (data || []).map(cleaner => ({
        ...cleaner,
        phone: cleaner.phone?.toString() || ''
      }));

      setCleaners(typedCleaners);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchCleaners();

    // Set up periodic refresh to catch new bookings
    const interval = setInterval(() => {
      fetchBookings(true);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchBookings, fetchCleaners]);

  const getCleanerName = (cleanerId: number | null) => {
    if (!cleanerId) return 'Unassigned';
    const cleaner = cleaners.find(c => c.id === cleanerId);
    return cleaner ? (cleaner.full_name || `${cleaner.first_name} ${cleaner.last_name}`) : 'Unknown';
  };

  // Filter bookings by date range and other filters
  const filteredBookings = bookings.filter(booking => {
    // Date range filter - for 'today' show all bookings for today, for others show future bookings
    if (booking.date_time) {
      const bookingDate = parseISO(booking.date_time);
      const { start, end } = getDateRange();
      
      if (selectedTimeRange === 'today') {
        // For today view, check if booking is on the same day
        const today = new Date();
        if (!isSameDay(bookingDate, today)) {
          return false;
        }
      } else {
        // For other views, check if booking is within the time range
        if (!isWithinInterval(bookingDate, { start, end })) {
          return false;
        }
      }
    }

    // Search filter
    const matchesSearch = !searchTerm || 
      booking.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.postcode?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'all' || booking.booking_status === statusFilter;
    
    // Cleaner filter
    const matchesCleaner = cleanerFilter === 'all' || 
      (cleanerFilter === 'unassigned' && !booking.cleaner) ||
      (cleanerFilter !== 'unassigned' && booking.cleaner === parseInt(cleanerFilter));

    return matchesSearch && matchesStatus && matchesCleaner;
  });

  const handleSelectBooking = (bookingId: number) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map(booking => booking.id));
    }
  };

  const toggleSubCleaners = (bookingId: number) => {
    setExpandedSubCleaners(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBookingForEdit(booking);
    setEditDialogOpen(true);
  };

  const handleAssignCleaner = async (bookingId: number, cleanerId: number | null) => {
    try {
      // Calculate cleaner pay as 75% of total cost when assigning a cleaner
      const booking = bookings.find(b => b.id === bookingId);
      const cleanerPay = cleanerId && booking ? (booking.total_cost * 0.75) : null;

      console.log('Assigning cleaner:', { bookingId, cleanerId, totalCost: booking?.total_cost, calculatedPay: cleanerPay });

      const { error } = await supabase
        .from('bookings')
        .update({ 
          cleaner: cleanerId,
          cleaner_pay: cleanerPay
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error assigning cleaner:', error);
        toast({
          title: "Error",
          description: "Failed to assign cleaner",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Cleaner assigned successfully",
      });

      fetchBookings();
    } catch (error) {
      console.error('Error assigning cleaner:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateBooking = (booking: Booking) => {
    setSelectedBookingForEdit(booking);
    setDuplicateDialogOpen(true);
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: 'Cancelled' })
        .eq('id', bookingId);

      if (error) {
        console.error('Error cancelling booking:', error);
        toast({
          title: "Error",
          description: "Failed to cancel booking",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      });

      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const handleDeleteBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) {
        console.error('Error deleting booking:', error);
        toast({
          title: "Error",
          description: "Failed to delete booking",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Booking deleted successfully",
      });

      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  const handleBulkEdit = () => {
    setBulkEditDialogOpen(true);
  };

  // Statistics
  const totalBookings = filteredBookings.length;
  const unassignedBookings = filteredBookings.filter(b => !b.cleaner).length;
  const totalRevenue = filteredBookings.reduce((sum, booking) => sum + (booking.total_cost || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Buttons - Only show if not hidden */}
      {!hideTimeRangeButtons && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: 'today' as const, label: 'Today', icon: '📅' },
            { key: '3days' as const, label: 'Next 3 Days', icon: '📊' },
            { key: '7days' as const, label: 'Next 7 Days', icon: '📈' },
            { key: '30days' as const, label: 'Next 30 Days', icon: '📋' }
          ].map((range) => (
            <Button
              key={range.key}
              variant={selectedTimeRange === range.key ? "default" : "outline"}
              onClick={() => onTimeRangeChange?.(range.key)}
              className={`
                w-full transition-all duration-200 font-medium py-3
                ${selectedTimeRange === range.key 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105 hover:from-blue-600 hover:to-blue-700' 
                  : 'bg-white hover:bg-blue-50 text-gray-700 border-gray-200 hover:border-blue-300'
                }
              `}
            >
              <span className="mr-2">{range.icon}</span>
              {range.label}
            </Button>
          ))}
        </div>
      )}

      {/* Statistics - Only show if not hidden */}
      {!hideStatistics && (
        <div className={`grid grid-cols-1 gap-6 ${unassignedBookings > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-100 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-blue-700">Total Bookings</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{totalBookings}</div>
            </CardContent>
          </Card>
          
          {unassignedBookings > 0 && (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-rose-100 border-red-200 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-red-700">Unassigned</CardTitle>
                <div className="p-2 bg-red-100 rounded-lg animate-pulse">
                  <Users className="h-4 w-4 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">{unassignedBookings}</div>
              </CardContent>
            </Card>
          )}
          
          <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-green-100 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-emerald-700">Total Revenue</CardTitle>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Clock className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900">£{totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, address, or postcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] border-gray-200">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={cleanerFilter} onValueChange={setCleanerFilter}>
                <SelectTrigger className="w-[140px] border-gray-200">
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Cleaner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cleaners</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {cleaners.map((cleaner) => (
                    <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                      {cleaner.full_name || `${cleaner.first_name} ${cleaner.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedBookings.length > 0 && (
                <Button onClick={handleBulkEdit} className="bg-blue-500 hover:bg-blue-600 text-white">
                  Bulk Edit ({selectedBookings.length})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <TableHead className="w-[50px] font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </TableHead>
                <TableHead className="font-semibold text-gray-800">Date & Time</TableHead>
                <TableHead className="font-semibold text-gray-800">Customer</TableHead>
                <TableHead className="font-semibold text-gray-800">Address</TableHead>
                <TableHead className="font-semibold text-gray-800">Service</TableHead>
                <TableHead className="font-semibold text-gray-800">Cleaner</TableHead>
                <TableHead className="font-semibold text-gray-800 text-right">Cost</TableHead>
                <TableHead className="font-semibold text-gray-800 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {searchTerm || statusFilter !== 'all' || cleanerFilter !== 'all' 
                      ? 'No bookings match your filters' 
                      : 'No upcoming bookings found'
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <React.Fragment key={booking.id}>
                    <TableRow className="hover:bg-blue-50/50 border-b transition-colors">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedBookings.includes(booking.id)}
                          onChange={() => handleSelectBooking(booking.id)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-900">
                            {booking.date_time ? format(parseISO(booking.date_time), 'EEE do MMM') : 'No date'}
                          </div>
                          <div className="text-sm text-gray-500 font-medium">
                            {booking.date_time ? format(parseISO(booking.date_time), 'HH:mm') : 'No time'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-900">
                            {booking.first_name} {booking.last_name}
                          </div>
                          <div className="text-sm text-gray-500 font-medium">{booking.phone_number}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-gray-900 font-semibold">
                            {booking.address}
                          </div>
                          <div className="text-sm text-gray-500 font-medium">{booking.postcode}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-gray-900 font-semibold">
                            {booking.form_name || 'Standard Cleaning'}
                          </div>
                          <div className="text-sm text-gray-500 font-medium">
                            {booking.hours_required}h
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Select 
                              value={booking.cleaner?.toString() || 'unassigned'} 
                              onValueChange={(value) => handleAssignCleaner(booking.id, value === 'unassigned' ? null : parseInt(value))}
                            >
                              <SelectTrigger className="w-full min-w-[120px] border-gray-200">
                                <SelectValue placeholder="Select cleaner" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {cleaners.map((cleaner) => (
                                  <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                                    {cleaner.full_name || `${cleaner.first_name} ${cleaner.last_name}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {booking.cleaner && (
                              <>
                                <AddSubCleanerDialog
                                  bookingId={booking.id}
                                  onSubCleanerAdded={fetchBookings}
                                >
                                  <Button size="sm" variant="outline" className="border-gray-200 hover:bg-blue-50">
                                    <UserPlus className="h-4 w-4" />
                                  </Button>
                                </AddSubCleanerDialog>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleSubCleaners(booking.id)}
                                  className="p-1 hover:bg-blue-50"
                                >
                                  {expandedSubCleaners.has(booking.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                          
                          {booking.cleaner && (
                            <div className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded font-medium">
                              Pay: £{booking.cleaner_pay?.toFixed(2) || '0.00'}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-semibold text-green-600 text-base">
                          £{booking.total_cost?.toFixed(2) || '0.00'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditBooking(booking)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateBooking(booking)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCancelBooking(booking.id)}>
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteBooking(booking.id)}
                              className="text-red-600"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    
                    {/* Sub-cleaners row - only show if expanded and has cleaner */}
                    {expandedSubCleaners.has(booking.id) && booking.cleaner && (
                      <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <TableCell colSpan={8} className="p-6">
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <Users className="h-4 w-4 text-blue-500" />
                              Additional Cleaners
                            </h4>
                            <SubCleanersList 
                              bookingId={booking.id}
                              onSubCleanerRemoved={fetchBookings}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Components */}
      <EditBookingDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        booking={selectedBookingForEdit}
        onSuccess={fetchBookings}
      />

      <AssignCleanerDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        bookingId={selectedBookingForEdit?.id || null}
        onSuccess={fetchBookings}
      />

      <DuplicateBookingDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        booking={selectedBookingForEdit}
        onSuccess={fetchBookings}
      />

      <BulkEditBookingsDialog
        open={bulkEditDialogOpen}
        onOpenChange={setBulkEditDialogOpen}
        onSuccess={() => {
          fetchBookings();
          setSelectedBookings([]);
        }}
      />
    </div>
  );
};

export default UpcomingBookings;
