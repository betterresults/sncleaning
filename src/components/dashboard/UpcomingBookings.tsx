
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
  total_cost: number; // Changed from string to number to match database
  booking_status: string; // Added missing property
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
        <CardHeader className="pb-2 sm:pb-3 lg:pb-4">
          <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
            <Filter className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
            <div>
              <Label htmlFor="dateFrom" className="text-xs sm:text-sm">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label htmlFor="dateTo" className="text-xs sm:text-sm">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label htmlFor="customerSearch" className="text-xs sm:text-sm">Customer Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="customerSearch"
                  placeholder="Name or email..."
                  value={filters.customerSearch}
                  onChange={(e) => setFilters({ ...filters, customerSearch: e.target.value })}
                  className="pl-6 sm:pl-8 text-xs sm:text-sm"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cleaner" className="text-xs sm:text-sm">Cleaner</Label>
              <Select
                value={filters.cleaner}
                onValueChange={(value) => setFilters({ ...filters, cleaner: value })}
              >
                <SelectTrigger className="text-xs sm:text-sm">
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
              <Button onClick={clearFilters} variant="outline" className="w-full text-xs sm:text-sm">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="itemsPerPage" className="text-xs sm:text-sm">Show:</Label>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => handleItemsPerPageChange(Number(value))}
            >
              <SelectTrigger className="w-16 sm:w-20 text-xs sm:text-sm">
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
            <Label htmlFor="sortOrder" className="text-xs sm:text-sm">Sort:</Label>
            <Select
              value={sortOrder}
              onValueChange={(value: 'asc' | 'desc') => handleSortOrderChange(value)}
            >
              <SelectTrigger className="w-28 sm:w-32 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Date: Earliest First</SelectItem>
                <SelectItem value="desc">Date: Latest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-xs sm:text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
                              <div className="flex items-center space-x-1 sm:space-x-2 bg-red-100 px-2 sm:px-3 py-1 sm:py-2 rounded-lg border border-red-200">
                                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                                <span className="text-xs sm:text-sm font-semibold text-red-700">Unassigned</span>
                              </div>
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
                              <DropdownMenuItem onClick={() => handleCopy(booking.id)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy ID
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
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
          <div className="text-xs sm:text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="text-xs sm:text-sm"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="text-xs sm:text-sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingBookings;
