import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Edit, Grid, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EditBookingDialog from './EditBookingDialog';
import DuplicateBookingDialog from './DuplicateBookingDialog';

interface Booking {
  id: number;
  date_time: string;
  address: string;
  postcode: string;
  service_type: string;
  total_hours: number;
  total_cost: number;
  cleaning_cost_per_hour: number | null;
  booking_status: string;
  additional_details: string | null;
  property_details: string | null;
  parking_details: string | null;
  key_collection: string | null;
  access: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  email: string | null;
  cleaner?: {
    first_name: string;
    last_name: string;
  };
}

const CustomerUpcomingBookings = () => {
  const { customerId, userRole } = useAuth();
  const { selectedCustomerId } = useAdminCustomer();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [completedBookingsCount, setCompletedBookingsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicatingBooking, setDuplicatingBooking] = useState<Booking | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Use selected customer ID if admin is viewing, otherwise use the logged-in user's customer ID
  const activeCustomerId = userRole === 'admin' ? selectedCustomerId : customerId;

  useEffect(() => {
    if (activeCustomerId) {
      fetchUpcomingBookings();
    } else {
      setBookings([]);
      setLoading(false);
    }
  }, [activeCustomerId]);

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setShowEditDialog(true);
  };

  const handleCancelBooking = async (booking: Booking) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: 'cancelled' })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      });

      fetchUpcomingBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateBooking = (booking: Booking) => {
    setDuplicatingBooking(booking);
    setShowDuplicateDialog(true);
  };

  const handleBookingUpdated = () => {
    fetchUpcomingBookings();
  };

  const fetchUpcomingBookings = async () => {
    if (!activeCustomerId) return;

    try {
      // Fetch upcoming bookings
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          date_time,
          address,
          postcode,
          service_type,
          total_hours,
          total_cost,
          cleaning_cost_per_hour,
          booking_status,
          additional_details,
          property_details,
          parking_details,
          key_collection,
          access,
          first_name,
          last_name,
          phone_number,
          email,
          cleaner:cleaners(first_name, last_name)
        `)
        .eq('customer', activeCustomerId)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true });

      if (error) throw error;
      setBookings(data || []);

      // Fetch completed bookings count
      const { count, error: countError } = await supabase
        .from('past_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('customer', activeCustomerId);

      if (countError) throw countError;
      setCompletedBookingsCount(count || 0);

    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load upcoming bookings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading bookings...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const totalBookings = bookings.length;
  const unpaidBookings = bookings.filter(b => b.booking_status?.toLowerCase() !== 'paid').length;
  const pendingBookings = bookings.filter(b => b.booking_status?.toLowerCase() === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 dark:from-gray-950/20 dark:to-gray-900/20 dark:border-gray-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Bookings</p>
                <p className="text-2xl font-bold text-foreground">{totalBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950/20 dark:to-green-900/20 dark:border-green-800/30 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/customer-completed-bookings')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">{completedBookingsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 dark:from-red-950/20 dark:to-red-900/20 dark:border-red-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <User className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Needs Payment</p>
                <p className="text-2xl font-bold text-foreground">{unpaidBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Bookings</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="flex items-center gap-2"
          >
            <Grid className="h-4 w-4" />
            Cards
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {(() => {
                const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                const startDate = new Date(monthStart);
                startDate.setDate(startDate.getDate() - monthStart.getDay());
                
                const days = [];
                const endDate = new Date(monthEnd);
                endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));
                
                for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
                  const dayBookings = bookings.filter(booking => {
                    const bookingDate = new Date(booking.date_time);
                    return bookingDate.toDateString() === day.toDateString();
                  });
                  
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isToday = day.toDateString() === new Date().toDateString();
                  
                  days.push(
                    <div 
                      key={day.toISOString()} 
                      className={`min-h-[80px] p-1 border rounded-lg ${
                        isCurrentMonth ? 'bg-card' : 'bg-muted/30'
                      } ${isToday ? 'ring-2 ring-primary' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {day.getDate()}
                      </div>
                      {dayBookings.map(booking => (
                        <div
                          key={booking.id}
                          className="text-xs p-1 mb-1 rounded bg-primary/10 text-primary truncate cursor-pointer hover:bg-primary/20"
                          title={`${booking.service_type} - ${booking.address} - ${new Date(booking.date_time).toLocaleTimeString('en-GB', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}`}
                        >
                          <div className="font-medium">{booking.service_type}</div>
                          <div className="text-[10px] opacity-80">{booking.address}</div>
                        </div>
                      ))}
                    </div>
                  );
                }
                
                return days;
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && (
        <Card>
          <CardContent className="p-6">
            {bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming bookings found.</p>
                <p className="text-sm">Book a new cleaning service to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/80 p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30">
                    
                    {/* Header with Service Type and Cost */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-foreground tracking-tight">{booking.service_type}</h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">£{booking.total_cost}</div>
                      </div>
                    </div>
                    
                    {/* Date, Time, Hours and Cleaner in a compact row */}
                    <div className="flex items-center justify-between mb-4 text-sm">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="font-medium">{new Date(booking.date_time).toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}, {new Date(booking.date_time).toLocaleTimeString('en-GB', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">{booking.total_hours}h</span>
                        </div>
                      </div>
                      {booking.cleaner && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-600 dark:text-green-400">{booking.cleaner.first_name} {booking.cleaner.last_name}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Status and Actions with Address */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/40">
                      <div className="flex items-center gap-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                          booking.booking_status === 'Confirmed' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : booking.booking_status === 'Pending'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                          {booking.booking_status}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="truncate">{booking.address}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 dark:border-red-800/30"
                            >
                              <span className="mr-1">✕</span>
                              <span className="hidden sm:inline">Cancel</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this booking? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No, Keep Booking</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleCancelBooking(booking)} className="bg-red-600 hover:bg-red-700">
                                Yes, Cancel Booking
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateBooking(booking)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/30"
                        >
                          <span className="mr-1">📋</span>
                          <span className="hidden sm:inline">Duplicate</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditBooking(booking)}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-gray-950/20 dark:hover:bg-gray-950/40 dark:text-gray-400 dark:border-gray-800/30"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="ml-1 hidden sm:inline">Edit</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      <EditBookingDialog
        booking={editingBooking}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onBookingUpdated={handleBookingUpdated}
      />
      
      <DuplicateBookingDialog
        booking={duplicatingBooking}
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        onBookingCreated={fetchUpcomingBookings}
      />
    </div>
  );
};

export default CustomerUpcomingBookings;