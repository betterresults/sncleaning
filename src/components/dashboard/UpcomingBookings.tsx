
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
}

const UpcomingBookings = ({ selectedTimeRange = '3days' }: UpcomingBookingsProps) => {
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
          start: today,
          end: addDays(today, 3)
        };
      case '7days':
        return {
          start: today,
          end: addDays(today, 7)
        };
      case '30days':
        return {
          start: today,
          end: addDays(today, 30)
        };
      default:
        return {
          start: today,
          end: addDays(today, 3)
        };
    }
  };

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching upcoming bookings...');
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .gte('date_time', new Date().toISOString())
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
  }, [toast]);

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
  }, [fetchBookings, fetchCleaners]);

  const getCleanerName = (cleanerId: number | null) => {
    if (!cleanerId) return 'Unassigned';
    const cleaner = cleaners.find(c => c.id === cleanerId);
    return cleaner ? (cleaner.full_name || `${cleaner.first_name} ${cleaner.last_name}`) : 'Unknown';
  };

  // Filter bookings by date range and other filters
  const filteredBookings = bookings.filter(booking => {
    // Date range filter
    if (booking.date_time) {
      const bookingDate = parseISO(booking.date_time);
      const { start, end } = getDateRange();
      if (!isWithinInterval(bookingDate, { start, end })) {
        return false;
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
      const { error } = await supabase
        .from('bookings')
        .update({ cleaner: cleanerId })
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
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unassignedBookings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, address, or postcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
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
                <SelectTrigger className="w-[140px]">
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
                <Button onClick={handleBulkEdit}>
                  Bulk Edit ({selectedBookings.length})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <input
                    type="checkbox"
                    checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                    onChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Cleaner</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Actions</TableHead>
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
                    <TableRow className="hover:bg-gray-50">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedBookings.includes(booking.id)}
                          onChange={() => handleSelectBooking(booking.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {booking.date_time ? format(parseISO(booking.date_time), 'EEEE dd MMM') : 'No date'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.date_time ? format(parseISO(booking.date_time), 'HH:mm') : 'No time'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {booking.first_name} {booking.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{booking.phone_number}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{booking.address}</div>
                          <div className="text-sm text-gray-500">{booking.postcode}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline">
                            {booking.form_name || 'Standard Cleaning'}
                          </Badge>
                          <div className="text-sm text-gray-500">
                            {booking.hours_required}h • {booking.cleaning_type}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Select 
                            value={booking.cleaner?.toString() || 'unassigned'} 
                            onValueChange={(value) => handleAssignCleaner(booking.id, value === 'unassigned' ? null : parseInt(value))}
                          >
                            <SelectTrigger className="w-full">
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
                            <div className="text-sm text-gray-500">
                              Pay: £{booking.cleaner_pay?.toFixed(2) || '0.00'}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <AddSubCleanerDialog
                              bookingId={booking.id}
                              onSubCleanerAdded={fetchBookings}
                            >
                              <Button size="sm" variant="outline">
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </AddSubCleanerDialog>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleSubCleaners(booking.id)}
                            >
                              {expandedSubCleaners.has(booking.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {expandedSubCleaners.has(booking.id) && (
                            <div className="mt-2">
                              <SubCleanersList 
                                bookingId={booking.id}
                                onSubCleanerRemoved={fetchBookings}
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          £{booking.total_cost?.toFixed(2) || '0.00'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
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
