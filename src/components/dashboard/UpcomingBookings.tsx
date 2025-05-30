
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, isSameDay, parseISO } from 'date-fns';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
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
import CreateNewBookingDialog from '@/components/booking/CreateNewBookingDialog';
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

const UpcomingBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cleaners, setCleaners] = useState<CleanerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cleanerFilter, setCleanerFilter] = useState('all');
  const [selectedBookings, setSelectedBookings] = useState<number[]>([]);
  const [expandedBookings, setExpandedBookings] = useState<Set<number>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<Booking | null>(null);
  const { toast } = useToast();

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

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = !searchTerm || 
      booking.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.postcode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || booking.booking_status === statusFilter;
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

  const toggleExpandBooking = (bookingId: number) => {
    setExpandedBookings(prev => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Upcoming Bookings</h2>
          <p className="text-muted-foreground">
            {filteredBookings.length} of {bookings.length} bookings
          </p>
        </div>
        <div className="flex gap-2">
          {selectedBookings.length > 0 && (
            <Button onClick={handleBulkEdit}>
              Bulk Edit ({selectedBookings.length})
            </Button>
          )}
          <CreateNewBookingDialog>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </CreateNewBookingDialog>
        </div>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Grid */}
      <div className="grid gap-4">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || cleanerFilter !== 'all' 
                  ? 'No bookings match your filters' 
                  : 'No upcoming bookings found'
                }
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Date and Time */}
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {booking.date_time ? format(parseISO(booking.date_time), 'dd/MM/yyyy') : 'No date'}
                      </span>
                      <Clock className="h-4 w-4 text-gray-400 ml-4" />
                      <span className="text-gray-600">
                        {booking.date_time ? format(parseISO(booking.date_time), 'HH:mm') : 'No time'}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div>
                      <div className="font-semibold text-lg">
                        {booking.first_name} {booking.last_name}
                      </div>
                      <div className="text-gray-600">{booking.phone_number}</div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <div>{booking.address}</div>
                        <div className="text-gray-600">{booking.postcode}</div>
                      </div>
                    </div>

                    {/* Service and Cost */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="outline" className="mb-1">
                          {booking.form_name || 'Standard Cleaning'}
                        </Badge>
                        <div className="text-sm text-gray-500">
                          {booking.hours_required}h • {booking.cleaning_type}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">£{booking.total_cost?.toFixed(2) || '0.00'}</div>
                      </div>
                    </div>

                    {/* Cleaner Assignment */}
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
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
                            <div className="text-sm text-gray-500 mt-1">
                              Pay: £{booking.cleaner_pay?.toFixed(2) || '0.00'}
                            </div>
                          )}
                        </div>
                        
                        <AddSubCleanerDialog
                          bookingId={booking.id}
                          onSubCleanerAdded={fetchBookings}
                        >
                          <Button size="sm" variant="outline" className="ml-2">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </AddSubCleanerDialog>
                      </div>
                      
                      {/* Sub Cleaners List */}
                      <div className="mt-2">
                        <SubCleanersList 
                          bookingId={booking.id}
                          onSubCleanerRemoved={fetchBookings}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className="ml-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border shadow-lg">
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

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
        selectedBookings={selectedBookings}
        onSuccess={() => {
          fetchBookings();
          setSelectedBookings([]);
        }}
      />
    </div>
  );
};

export default UpcomingBookings;
