
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Filter, CalendarDays, MapPin, Clock, User, Phone, Mail, Banknote, UserX, CheckCircle, MoreHorizontal } from 'lucide-react';
import { format, differenceInHours, isSameDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
  cleaner: number;
  customer: number;
  cleaner_pay: number;
  booking_status: string;
  cleaners?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
  };
}

interface Filters {
  dateFrom: string;
  dateTo: string;
}

interface Stats {
  totalBookings: number;
  totalEarnings: number;
}

const CleanerUpcomingBookings = () => {
  const { cleanerId } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Filters>({
    dateFrom: '',
    dateTo: '',
  });

  const fetchData = async () => {
    if (!cleanerId) {
      setError('Cleaner ID not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching upcoming bookings for cleaner ID:', cleanerId);
      
      // Get only bookings assigned to this specific cleaner and are in the future
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

      console.log('Fetched bookings for cleaner:', bookingsData?.length || 0);
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

    setFilteredBookings(filtered);
    setCurrentPage(1);

    const totalEarnings = filtered.reduce((sum, booking) => sum + (booking.cleaner_pay || 0), 0);
    
    setStats({
      totalBookings: filtered.length,
      totalEarnings
    });
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
    });
  };

  const handleDropOff = async (bookingId: number) => {
    if (window.confirm('Are you sure you want to drop off this booking? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('bookings')
          .update({ cleaner: null, cleaner_pay: null })
          .eq('id', bookingId)
          .eq('cleaner', cleanerId); // Ensure only this cleaner can drop their own bookings

        if (error) {
          console.error('Error dropping off booking:', error);
          toast({
            title: "Error",
            description: "Failed to drop off booking",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: "Booking dropped off successfully",
        });
        
        fetchData();
      } catch (error) {
        console.error('Error dropping off booking:', error);
        toast({
          title: "Error",
          description: "Failed to drop off booking",
          variant: "destructive",
        });
      }
    }
  };

  const handleMarkCompleted = async (bookingId: number) => {
    if (window.confirm('Are you sure you want to mark this booking as completed?')) {
      try {
        const { error } = await supabase
          .from('bookings')
          .update({ booking_status: 'Completed' })
          .eq('id', bookingId)
          .eq('cleaner', cleanerId); // Ensure only this cleaner can mark their own bookings as completed

        if (error) {
          console.error('Error marking booking as completed:', error);
          toast({
            title: "Error",
            description: "Failed to mark booking as completed",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: "Booking marked as completed",
        });
        
        fetchData();
      } catch (error) {
        console.error('Error marking booking as completed:', error);
        toast({
          title: "Error",
          description: "Failed to mark booking as completed",
          variant: "destructive",
        });
      }
    }
  };

  const canDropOff = (dateTime: string) => {
    const bookingDate = new Date(dateTime);
    const hoursUntilBooking = differenceInHours(bookingDate, new Date());
    return hoursUntilBooking >= 48;
  };

  const canMarkCompleted = (dateTime: string) => {
    const bookingDate = new Date(dateTime);
    const today = new Date();
    return isSameDay(bookingDate, today) || bookingDate < today;
  };

  useEffect(() => {
    if (cleanerId) {
      fetchData();
    }
  }, [cleanerId, sortOrder]);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg">Loading your bookings...</div>
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
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">My Upcoming Bookings</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalBookings}</div>
            <p className="text-xs text-blue-600">Assigned to you</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Potential Earnings</CardTitle>
            <Banknote className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">£{stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-green-600">From upcoming bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom" className="text-sm font-medium">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                className="h-9"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateTo" className="text-sm font-medium">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                className="h-9"
              />
            </div>

            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline" className="h-9">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Controls */}
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="itemsPerPage" className="text-sm font-medium">Show:</Label>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => {
              setItemsPerPage(parseInt(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="sortOrder" className="text-sm font-medium">Sort:</Label>
            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Earliest first</SelectItem>
                <SelectItem value="desc">Latest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
        </div>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-base">Date & Time</TableHead>
                  <TableHead className="font-semibold text-base">Customer</TableHead>
                  <TableHead className="font-semibold text-base">Address</TableHead>
                  <TableHead className="font-semibold text-base">Service</TableHead>
                  <TableHead className="font-semibold text-base">Earnings</TableHead>
                  <TableHead className="font-semibold text-center text-base">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500 text-base">
                      No upcoming bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div className="flex items-start space-x-3">
                          <div className="flex flex-col items-center space-y-1">
                            <CalendarDays className="h-4 w-4 text-gray-400" />
                            <Clock className="h-4 w-4 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium text-base">
                              {booking.date_time ? format(new Date(booking.date_time), 'dd/MM/yyyy') : 'No date'}
                            </div>
                            <div className="text-gray-500 text-sm">
                              {booking.date_time ? format(new Date(booking.date_time), 'HH:mm') : 'No time'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-base flex items-center">
                            <User className="h-3 w-3 mr-2 text-gray-400" />
                            {booking.first_name} {booking.last_name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-2" />
                            {booking.email}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 mr-2" />
                            {booking.phone_number}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start space-x-2 max-w-48">
                          <MapPin className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
                          <div className="text-sm text-gray-700 leading-tight">
                            <div>{booking.address}</div>
                            {booking.postcode && (
                              <div className="text-gray-500 font-medium">{booking.postcode}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {booking.form_name || 'Standard Cleaning'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600 text-base">
                          £{booking.cleaner_pay?.toFixed(2) || '0.00'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              {canDropOff(booking.date_time) && (
                                <DropdownMenuItem 
                                  onClick={() => handleDropOff(booking.id)}
                                  className="text-orange-600 cursor-pointer"
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Drop Off
                                </DropdownMenuItem>
                              )}
                              {canMarkCompleted(booking.date_time) && booking.booking_status !== 'Completed' && (
                                <DropdownMenuItem 
                                  onClick={() => handleMarkCompleted(booking.id)}
                                  className="text-green-600 cursor-pointer"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark Completed
                                </DropdownMenuItem>
                              )}
                              {!canDropOff(booking.date_time) && !canMarkCompleted(booking.date_time) && (
                                <DropdownMenuItem disabled>
                                  No actions available
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
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
                size="sm"
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default CleanerUpcomingBookings;
