
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
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EditBookingDialog from './EditBookingDialog';
import AssignCleanerDialog from './AssignCleanerDialog';
import DuplicateBookingDialog from './DuplicateBookingDialog';
import BulkEditBookingsDialog from './BulkEditBookingsDialog';
import CreateNewBookingDialog from '@/components/booking/CreateNewBookingDialog';
import AddSubCleanerDialog from '@/components/booking/AddSubCleanerDialog';
import SubCleanersList from '@/components/booking/SubCleanersList';

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

      setCleaners(data || []);
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
            <BulkEditBookingsDialog 
              selectedBookingIds={selectedBookings}
              onBookingsUpdated={() => {
                fetchBookings();
                setSelectedBookings([]);
              }}
            />
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

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Cleaner</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-gray-500">
                        {searchTerm || statusFilter !== 'all' || cleanerFilter !== 'all' 
                          ? 'No bookings match your filters' 
                          : 'No upcoming bookings found'
                        }
                      </div>
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
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleExpandBooking(booking.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {expandedBookings.has(booking.id) ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                              }
                            </button>
                            <div>
                              <div className="font-medium flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                {booking.date_time ? format(parseISO(booking.date_time), 'dd/MM/yyyy') : 'No date'}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {booking.date_time ? format(parseISO(booking.date_time), 'HH:mm') : 'No time'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{booking.first_name} {booking.last_name}</div>
                            <div className="text-sm text-gray-500">{booking.phone_number}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start space-x-2 max-w-xs">
                            <MapPin className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                            <div className="text-sm">
                              <div className="truncate">{booking.address}</div>
                              <div className="text-gray-500">{booking.postcode}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="outline" className="mb-1">
                              {booking.form_name || 'Standard Cleaning'}
                            </Badge>
                            <div className="text-sm text-gray-500">
                              {booking.hours_required}h • {booking.cleaning_type}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              booking.cleaner ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {getCleanerName(booking.cleaner)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-right">
                            <div className="font-semibold">£{booking.total_cost?.toFixed(2) || '0.00'}</div>
                            <div className="text-sm text-gray-500">Pay: £{booking.cleaner_pay?.toFixed(2) || '0.00'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={getStatusColor(booking.booking_status)} variant="secondary">
                              {booking.booking_status || 'Unknown'}
                            </Badge>
                            <Badge className={getPaymentStatusColor(booking.payment_status)} variant="secondary">
                              {booking.payment_status || 'Unknown'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center space-x-1">
                            <EditBookingDialog 
                              booking={booking} 
                              onBookingUpdated={fetchBookings}
                            >
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </EditBookingDialog>
                            
                            <AssignCleanerDialog 
                              booking={booking} 
                              cleaners={cleaners}
                              onBookingUpdated={fetchBookings}
                            >
                              <Button size="sm" variant="outline">
                                <Users className="h-4 w-4" />
                              </Button>
                            </AssignCleanerDialog>
                            
                            <AddSubCleanerDialog
                              bookingId={booking.id}
                              onSubCleanerAdded={fetchBookings}
                            >
                              <Button size="sm" variant="outline">
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </AddSubCleanerDialog>
                            
                            <DuplicateBookingDialog 
                              booking={booking} 
                              onBookingDuplicated={fetchBookings}
                            >
                              <Button size="sm" variant="outline">
                                <Copy className="h-4 w-4" />
                              </Button>
                            </DuplicateBookingDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedBookings.has(booking.id) && (
                        <TableRow>
                          <TableCell colSpan={9} className="bg-gray-50 p-0">
                            <div className="p-4">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpcomingBookings;
