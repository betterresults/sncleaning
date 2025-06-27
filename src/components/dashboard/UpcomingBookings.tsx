
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CalendarIcon, 
  Search, 
  Filter, 
  X, 
  Edit, 
  Trash2, 
  Copy, 
  UserPlus, 
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Home,
  CreditCard,
  Calendar as CalendarLarge
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import EditBookingDialog from './EditBookingDialog';
import AssignCleanerDialog from './AssignCleanerDialog';
import DuplicateBookingDialog from './DuplicateBookingDialog';
import BulkEditBookingsDialog from './BulkEditBookingsDialog';

interface UpcomingBookingsProps {
  selectedTimeRange?: 'today' | '3days' | '7days' | '30days';
  onTimeRangeChange?: (range: 'today' | '3days' | '7days' | '30days') => void;
  hideTimeRangeButtons?: boolean;
  hideStatistics?: boolean;
}

interface Booking {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  postcode: string;
  date_time: string;
  total_hours: number;
  total_cost: number;
  cleaner_pay: number;
  cleaner: number | null;
  payment_method: string;
  payment_status: string;
  booking_status: string;
  cleaning_type: string;
  form_name: string;
  additional_details: string;
  property_details: string;
  deposit: number;
  cleaners?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
  };
}

interface Stats {
  totalBookings: number;
  totalRevenue: number;
  paidBookings: number;
  unpaidBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}

const UpcomingBookings = ({ 
  selectedTimeRange = '3days', 
  onTimeRangeChange,
  hideTimeRangeButtons = false,
  hideStatistics = false
}: UpcomingBookingsProps) => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    totalRevenue: 0,
    paidBookings: 0,
    unpaidBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [customerFilter, setCustomerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [cleanerFilter, setCleanerFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');

  // Dialog states
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [assigningCleaner, setAssigningCleaner] = useState<Booking | null>(null);
  const [duplicatingBooking, setDuplicatingBooking] = useState<Booking | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<number[]>([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Get date range based on selected time range
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
          start: today,
          end: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
        };
      case '7days':
        return {
          start: today,
          end: new Date(today.getTime() + 7 * 24 * 60 * 1000)
        };
      case '30days':
        return {
          start: today,
          end: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        };
      default:
        return {
          start: today,
          end: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
        };
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { start, end } = getDateRange();

      console.log('Fetching bookings for date range:', { start, end });

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
        .gte('date_time', start.toISOString())
        .lte('date_time', end.toISOString())
        .order('date_time', { ascending: true });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setError('Failed to fetch bookings');
        return;
      }

      console.log('Fetched bookings:', bookingsData?.length || 0);
      setBookings(bookingsData || []);

    } catch (error) {
      console.error('Error in fetchBookings:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings based on all filter criteria
  const applyFilters = () => {
    let filtered = [...bookings];

    // Date range filter (additional to time range)
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

    // Customer filter
    if (customerFilter.trim()) {
      const searchTerm = customerFilter.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.first_name?.toLowerCase().includes(searchTerm) ||
        booking.last_name?.toLowerCase().includes(searchTerm) ||
        booking.email?.toLowerCase().includes(searchTerm) ||
        booking.phone_number?.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => 
        booking.booking_status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Payment status filter
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(booking => 
        booking.payment_status?.toLowerCase() === paymentStatusFilter.toLowerCase()
      );
    }

    // Cleaner filter
    if (cleanerFilter !== 'all') {
      if (cleanerFilter === 'unassigned') {
        filtered = filtered.filter(booking => !booking.cleaner);
      } else {
        filtered = filtered.filter(booking => 
          booking.cleaner?.toString() === cleanerFilter
        );
      }
    }

    // Service type filter
    if (serviceTypeFilter !== 'all') {
      filtered = filtered.filter(booking => 
        booking.form_name === serviceTypeFilter
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);

    // Calculate stats
    const newStats: Stats = {
      totalBookings: filtered.length,
      totalRevenue: filtered.reduce((sum, booking) => sum + (booking.total_cost || 0), 0),
      paidBookings: filtered.filter(b => b.payment_status?.toLowerCase() === 'paid').length,
      unpaidBookings: filtered.filter(b => b.payment_status?.toLowerCase() === 'unpaid').length,
      confirmedBookings: filtered.filter(b => b.booking_status?.toLowerCase() === 'confirmed').length,
      pendingBookings: filtered.filter(b => b.booking_status?.toLowerCase() === 'pending').length,
      completedBookings: filtered.filter(b => b.booking_status?.toLowerCase() === 'completed').length,
      cancelledBookings: filtered.filter(b => b.booking_status?.toLowerCase() === 'cancelled').length,
    };

    setStats(newStats);
  };

  const handleClearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setCustomerFilter('');
    setStatusFilter('all');
    setPaymentStatusFilter('all');
    setCleanerFilter('all');
    setServiceTypeFilter('all');
  };

  const handleDeleteBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

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
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleBookingUpdated = () => {
    fetchBookings();
  };

  const handleSelectBooking = (bookingId: number) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const handleSelectAll = () => {
    const currentPageBookings = paginatedBookings.map(b => b.id);
    const allSelected = currentPageBookings.every(id => selectedBookings.includes(id));
    
    if (allSelected) {
      setSelectedBookings(prev => prev.filter(id => !currentPageBookings.includes(id)));
    } else {
      setSelectedBookings(prev => [...new Set([...prev, ...currentPageBookings])]);
    }
  };

  // Effects
  useEffect(() => {
    fetchBookings();
  }, [selectedTimeRange]);

  useEffect(() => {
    applyFilters();
  }, [bookings, dateFrom, dateTo, customerFilter, statusFilter, paymentStatusFilter, cleanerFilter, serviceTypeFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'partially paid': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg">Loading bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchBookings}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selection - Only show if not hidden */}
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
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105' 
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

      {/* Statistics Cards - Only show if not hidden */}
      {!hideStatistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalBookings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">£{stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.confirmedBookings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{stats.completedBookings}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Customer Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers..."
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Booking Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Status</label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partially paid">Partially Paid</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cleaner Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cleaner</label>
              <Select value={cleanerFilter} onValueChange={setCleanerFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cleaners</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Service Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Service Type</label>
              <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="Standard Cleaning">Standard Cleaning</SelectItem>
                  <SelectItem value="Deep Cleaning">Deep Cleaning</SelectItem>
                  <SelectItem value="End of Tenancy">End of Tenancy</SelectItem>
                  <SelectItem value="Office Cleaning">Office Cleaning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                className="w-full"
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedBookings.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedBookings.length} booking(s) selected
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowBulkEdit(true)}
              >
                Bulk Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedBookings([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Upcoming Bookings ({filteredBookings.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {paginatedBookings.every(b => selectedBookings.includes(b.id)) 
                  ? 'Deselect All' 
                  : 'Select All'
                }
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No bookings found for the selected criteria
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedBookings.map((booking) => (
                <div key={booking.id}>
                  <Card className={`transition-all duration-200 ${
                    selectedBookings.includes(booking.id) 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedBookings.includes(booking.id)}
                            onChange={() => handleSelectBooking(booking.id)}
                            className="mt-1"
                          />
                          
                          <div className="flex-1 space-y-3">
                            {/* Header Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {booking.first_name} {booking.last_name}
                                </h3>
                                <Badge className={getStatusColor(booking.booking_status)}>
                                  {booking.booking_status}
                                </Badge>
                                <Badge className={getPaymentStatusColor(booking.payment_status)}>
                                  {booking.payment_status}
                                </Badge>
                              </div>
                              <div className="text-xl font-bold text-green-600">
                                £{booking.total_cost}
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <CalendarLarge className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">
                                  {format(new Date(booking.date_time), "PPP 'at' p")}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-purple-500" />
                                <span>{booking.total_hours} hours</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Home className="h-4 w-4 text-orange-500" />
                                <span>{booking.form_name}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-red-500" />
                                <span>{booking.address}, {booking.postcode}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-green-500" />
                                <span>{booking.phone_number}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-blue-500" />
                                <span>{booking.email}</span>
                              </div>

                              {booking.cleaners && (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-indigo-500" />
                                  <span>
                                    {booking.cleaners.first_name} {booking.cleaners.last_name}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-yellow-500" />
                                <span>{booking.payment_method}</span>
                              </div>
                            </div>

                            {/* Additional Details */}
                            {(booking.additional_details || booking.property_details) && (
                              <div className="pt-2 border-t space-y-2">
                                {booking.property_details && (
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-600">Property: </span>
                                    <span className="text-gray-800">{booking.property_details}</span>
                                  </div>
                                )}
                                {booking.additional_details && (
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-600">Notes: </span>
                                    <span className="text-gray-800">{booking.additional_details}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingBooking(booking)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAssigningCleaner(booking)}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDuplicatingBooking(booking)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBooking(booking.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm font-medium">
                  {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditBookingDialog
        booking={editingBooking}
        open={!!editingBooking}
        onOpenChange={(open) => !open && setEditingBooking(null)}
        onBookingUpdated={handleBookingUpdated}
      />

      <AssignCleanerDialog
        booking={assigningCleaner}
        open={!!assigningCleaner}
        onOpenChange={(open) => !open && setAssigningCleaner(null)}
        onBookingUpdated={handleBookingUpdated}
      />

      <DuplicateBookingDialog
        booking={duplicatingBooking}
        open={!!duplicatingBooking}
        onOpenChange={(open) => !open && setDuplicatingBooking(null)}
        onBookingUpdated={handleBookingUpdated}
      />

      <BulkEditBookingsDialog
        bookingIds={selectedBookings}
        open={showBulkEdit}
        onOpenChange={setShowBulkEdit}
        onBookingsUpdated={() => {
          handleBookingUpdated();
          setSelectedBookings([]);
        }}
      />
    </div>
  );
};

export default UpcomingBookings;
