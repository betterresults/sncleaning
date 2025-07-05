import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, Filter, Search, Settings, Copy, X, UserPlus, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import DashboardStats from '../admin/DashboardStats';
import BulkEditBookingsDialog from './BulkEditBookingsDialog';
import EditBookingDialog from './EditBookingDialog';
import AssignCleanerDialog from './AssignCleanerDialog';
import DuplicateBookingDialog from './DuplicateBookingDialog';

interface Booking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  cleaning_type: string;
  total_cost: number;
  payment_status: string;
  cleaner: number | null;
  customer: number;
  cleaners?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  customers?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
}

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  cleanerId: string;
  customerId: string;
  customerSearch: string;
}

interface UpcomingBookingsProps {
  dashboardDateFilter?: {
    dateFrom: string;
    dateTo: string;
  };
}

const UpcomingBookings = ({ dashboardDateFilter }: UpcomingBookingsProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Filters>({
    dateFrom: '',
    dateTo: '',
    cleanerId: 'all',
    customerId: 'all',
    customerSearch: '',
  });
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<Booking | null>(null);
  const [assignCleanerOpen, setAssignCleanerOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [selectedBookingForDuplicate, setSelectedBookingForDuplicate] = useState<Booking | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build the query with date filtering
      let bookingsQuery = supabase
        .from('bookings')
        .select(`
          *,
          cleaners!bookings_cleaner_fkey (
            id,
            first_name,
            last_name
          ),
          customers!bookings_customer_fkey (
            id,
            first_name,
            last_name
          )
        `);

      // Only apply dashboard date filter if no local filters are active
      const hasLocalDateFilters = filters.dateFrom || filters.dateTo;
      
      if (dashboardDateFilter && !hasLocalDateFilters) {
        // Apply dashboard time range filter
        bookingsQuery = bookingsQuery
          .gte('date_time', dashboardDateFilter.dateFrom)
          .lte('date_time', dashboardDateFilter.dateTo);
      } else if (!hasLocalDateFilters) {
        // Default: only show future bookings
        bookingsQuery = bookingsQuery.gte('date_time', new Date().toISOString());
      }
      // If hasLocalDateFilters is true, fetch ALL bookings (no date restrictions)

      const { data: bookingsData, error: bookingsError } = await bookingsQuery
        .order('date_time', { ascending: sortOrder === 'asc' });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setError('Failed to load bookings: ' + bookingsError.message);
        return;
      }

      // Fetch cleaners and customers
      const { data: cleanersData, error: cleanersError } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name')
        .order('first_name');

      if (cleanersError) {
        console.error('Error fetching cleaners:', cleanersError);
      }

      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, first_name, last_name')
        .order('first_name');

      if (customersError) {
        console.error('Error fetching customers:', customersError);
      }

      console.log('Fetched data:', {
        bookings: bookingsData?.length || 0,
        cleaners: cleanersData?.length || 0,
        customers: customersData?.length || 0
      });

      setBookings(bookingsData || []);
      setCleaners(cleanersData || []);
      setCustomers(customersData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    if (filters.dateFrom) {
      filtered = filtered.filter(booking => 
        new Date(booking.date_time) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(booking => 
        new Date(booking.date_time) <= new Date(filters.dateTo)
      );
    }

    if (filters.cleanerId && filters.cleanerId !== 'all') {
      filtered = filtered.filter(booking => 
        booking.cleaner === parseInt(filters.cleanerId)
      );
    }

    if (filters.customerId && filters.customerId !== 'all') {
      filtered = filtered.filter(booking => 
        booking.customer === parseInt(filters.customerId)
      );
    }

    if (filters.customerSearch) {
      filtered = filtered.filter(booking => 
        `${booking.first_name} ${booking.last_name}`.toLowerCase()
          .includes(filters.customerSearch.toLowerCase()) ||
        booking.email.toLowerCase().includes(filters.customerSearch.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      cleanerId: 'all',
      customerId: 'all',
      customerSearch: '',
    });
  };

  const getCleanerName = (booking: Booking) => {
    if (!booking.cleaner) {
      return 'Unsigned';
    }

    if (booking.cleaners) {
      return `${booking.cleaners.first_name} ${booking.cleaners.last_name}`;
    }

    const cleaner = cleaners.find(c => c.id === booking.cleaner);
    if (cleaner) {
      return `${cleaner.first_name} ${cleaner.last_name}`;
    }

    return 'Unsigned';
  };

  const handleEdit = (bookingId: number) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBookingForEdit(booking);
      setEditDialogOpen(true);
    }
  };

  const handleDelete = async (bookingId: number) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const { error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', bookingId);

        if (error) {
          console.error('Error deleting booking:', error);
          return;
        }

        fetchData();
      } catch (error) {
        console.error('Error deleting booking:', error);
      }
    }
  };

  const handleDuplicate = (booking: Booking) => {
    setSelectedBookingForDuplicate(booking);
    setDuplicateDialogOpen(true);
  };

  const handleCancel = async (bookingId: number) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: 'Cancelled' })
        .eq('id', bookingId);

      if (error) {
        console.error('Error cancelling booking:', error);
        return;
      }

      fetchData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const handleAssignCleaner = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setAssignCleanerOpen(true);
  };

  useEffect(() => {
    fetchData();
  }, [sortOrder, dashboardDateFilter, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
      case 'not paid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const hasActiveFilters = filters.dateFrom || filters.dateTo || 
                          (filters.cleanerId && filters.cleanerId !== 'all') || 
                          (filters.customerId && filters.customerId !== 'all') || 
                          filters.customerSearch;

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
        <Button onClick={fetchData}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasActiveFilters && (
        <DashboardStats 
          filters={{
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            cleanerId: filters.cleanerId !== 'all' ? parseInt(filters.cleanerId) : undefined,
            customerId: filters.customerId !== 'all' ? parseInt(filters.customerId) : undefined,
          }}
        />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cleaner">Cleaner</Label>
              <Select value={filters.cleanerId} onValueChange={(value) => setFilters({...filters, cleanerId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cleaner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cleaners</SelectItem>
                  {cleaners.map((cleaner) => (
                    <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                      {cleaner.first_name} {cleaner.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <Select value={filters.customerId} onValueChange={(value) => setFilters({...filters, customerId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.first_name} {customer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerSearch">Search Customer</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="customerSearch"
                  placeholder="Search by name or email"
                  value={filters.customerSearch}
                  onChange={(e) => setFilters({...filters, customerSearch: e.target.value})}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="itemsPerPage">Show:</Label>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => {
              setItemsPerPage(parseInt(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="sortOrder">Sort:</Label>
            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Earliest first</SelectItem>
                <SelectItem value="desc">Latest first</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={() => setBulkEditOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Settings className="h-4 w-4" />
            Bulk Edit
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Cleaning Type</TableHead>
                  <TableHead>Cleaner</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBookings.map((booking) => {
                    const isUnsigned = !booking.cleaner;
                    const cleanerName = getCleanerName(booking);
                    
                    return (
                      <TableRow 
                        key={booking.id} 
                        className={isUnsigned ? "bg-red-50 hover:bg-red-100 border-l-4 border-red-500" : "hover:bg-gray-50"}
                      >
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {format(new Date(booking.date_time), 'dd/MM/yyyy')}
                            </div>
                            <div className="text-gray-500">
                              {format(new Date(booking.date_time), 'HH:mm')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {booking.first_name} {booking.last_name}
                            </div>
                            <div className="text-gray-500">
                              ID: {booking.customer}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{booking.email}</div>
                            <div className="text-gray-500">{booking.phone_number}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-32 truncate">
                          {booking.address}
                        </TableCell>
                        <TableCell>{booking.cleaning_type || 'N/A'}</TableCell>
                        <TableCell>
                          {isUnsigned ? (
                            <Badge variant="destructive" className="bg-red-600 text-white">
                              Unsigned
                            </Badge>
                          ) : (
                            <span className="text-green-700 font-medium">{cleanerName}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          £{booking.total_cost?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell>
                          <div 
                            className="flex justify-center" 
                            title={booking.payment_status || 'Unpaid'}
                          >
                            <DollarSign 
                              className={`h-5 w-5 ${
                                booking.payment_status?.toLowerCase() === 'paid' 
                                  ? 'text-green-600' 
                                  : booking.payment_status?.toLowerCase() === 'collecting'
                                  ? 'text-orange-500'
                                  : 'text-red-600'
                              }`}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                ⋮
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(booking.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(booking)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAssignCleaner(booking.id)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Assign Cleaner
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

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <BulkEditBookingsDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        onSuccess={fetchData}
      />

      <EditBookingDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        booking={selectedBookingForEdit}
        onBookingUpdated={fetchData}
      />

      <AssignCleanerDialog
        bookingId={selectedBookingId}
        open={assignCleanerOpen}
        onOpenChange={setAssignCleanerOpen}
        onSuccess={fetchData}
      />

      <DuplicateBookingDialog
        booking={selectedBookingForDuplicate}
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default UpcomingBookings;
