import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Edit, Grid, CheckCircle, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EditBookingDialog from './EditBookingDialog';
import DuplicateBookingDialog from './DuplicateBookingDialog';
import BookingCard from '@/components/booking/BookingCard';
import ManualPaymentDialog from '@/components/payments/ManualPaymentDialog';

interface Booking {
  id: number;
  date_time: string;
  address: string;
  postcode: string;
  cleaning_type: string;
  service_type: string; // Required for BookingCard compatibility
  total_hours: number;
  total_cost: number;
  cleaning_cost_per_hour: number | null;
  booking_status: string;
  payment_status: string;
  additional_details: string | null;
  property_details: string | null;
  parking_details: string | null;
  key_collection: string | null;
  access: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  email: string | null;
  same_day: boolean;
  linen_management: boolean;
  linen_used: any;
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
  const [unpaidCompletedBookingsCount, setUnpaidCompletedBookingsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicatingBooking, setDuplicatingBooking] = useState<Booking | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 10;

  // Use selected customer ID if admin is viewing, otherwise use the logged-in user's customer ID
  const activeCustomerId = userRole === 'admin' ? selectedCustomerId : customerId;

  console.log('CustomerUpcomingBookings - Debug info:', {
    userRole,
    customerId,
    selectedCustomerId,
    activeCustomerId
  });

  useEffect(() => {
    if (activeCustomerId) {
      fetchUpcomingBookings();
    } else {
      setBookings([]);
      setCompletedBookingsCount(0);
      setUnpaidCompletedBookingsCount(0);
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
        title: "✅ Booking Cancelled",
        description: "Your booking has been cancelled successfully",
        className: "bg-green-50 border-green-200 text-green-800",
        duration: 3000, // 3 seconds
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

  const handlePaymentAction = (booking: Booking) => {
    setSelectedBookingForPayment(booking);
    setPaymentDialogOpen(true);
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
          cleaning_type,
          total_hours,
          total_cost,
          cleaning_cost_per_hour,
          booking_status,
          payment_status,
          additional_details,
          property_details,
          parking_details,
          key_collection,
          access,
          first_name,
          last_name,
          phone_number,
          email,
          same_day,
          linen_management,
          linen_used,
          cleaner:cleaners(first_name, last_name)
        `)
        .eq('customer', activeCustomerId)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true });

      if (error) throw error;
      
      // Map cleaning_type to service_type for BookingCard compatibility
      const processedBookings = (data || []).map(booking => ({
        ...booking,
        service_type: booking.cleaning_type,
        linen_management: booking.linen_management || false,
        linen_used: booking.linen_used || []
      }));
      setBookings(processedBookings);

      // Fetch completed bookings count
      const { count, error: countError } = await supabase
        .from('past_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('customer', activeCustomerId);

      if (countError) throw countError;
      setCompletedBookingsCount(count || 0);

      // Fetch unpaid completed bookings count - must be from past_bookings where payment not paid
      const { count: unpaidCount, error: unpaidCountError } = await supabase
        .from('past_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('customer', activeCustomerId)
        .not('payment_status', 'ilike', '%paid%');

      if (unpaidCountError) throw unpaidCountError;
      setUnpaidCompletedBookingsCount(unpaidCount || 0);

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

  // Show message for admin when no customer is selected
  if (userRole === 'admin' && !selectedCustomerId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Customer Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground space-y-4">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <div>
              <p className="text-lg font-medium">Select a Customer</p>
              <p className="text-sm">Please select a customer from the dropdown above to view their dashboard.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const totalBookings = bookings.length;

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Upcoming Bookings</p>
                <p className="text-lg sm:text-2xl font-bold text-[#185166]">{totalBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
          onClick={() => navigate('/customer-completed-bookings')}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Completed</p>
                <p className="text-lg sm:text-2xl font-bold text-[#185166]">{completedBookingsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
      </div>

      {/* View Toggle */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#185166] text-center">Your Upcoming Bookings</h2>
        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto w-full">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            onClick={() => setViewMode('cards')}
            className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold w-full ${
              viewMode === 'cards' 
                ? 'bg-[#18A5A5] hover:bg-[#185166] text-white' 
                : 'border-[#18A5A5] text-[#18A5A5] hover:bg-[#18A5A5] hover:text-white'
            }`}
          >
            <Grid className="h-4 w-4" />
            <span>Cards View</span>
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
            className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold w-full ${
              viewMode === 'calendar' 
                ? 'bg-[#18A5A5] hover:bg-[#185166] text-white' 
                : 'border-[#18A5A5] text-[#18A5A5] hover:bg-[#18A5A5] hover:text-white'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Calendar View</span>
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
                          className={`text-xs p-1 mb-1 rounded truncate cursor-pointer transition-colors ${
                            booking.same_day 
                              ? 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 hover:from-orange-200 hover:to-red-200 border border-orange-200 dark:from-orange-900/40 dark:to-red-900/40 dark:text-orange-300 dark:border-orange-700'
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                          onClick={() => handleEditBooking(booking)}
                          title={`Click to edit: ${booking.cleaning_type}${booking.same_day ? ' (Same Day)' : ''} - ${booking.address} - ${new Date(booking.date_time).toLocaleTimeString('en-GB', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}`}
                        >
                          <div className="font-medium flex items-center justify-between">
                            <span>{booking.cleaning_type}</span>
                            {booking.same_day && <span className="text-[8px] font-bold">SD</span>}
                          </div>
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
          <CardContent className="p-3 sm:p-6">
            {bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground space-y-4">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <div>
                  <p>No upcoming bookings found.</p>
                  <p className="text-sm">Book a new cleaning service to get started.</p>
                </div>
                <Button
                  onClick={() => navigate('/customer-add-booking')}
                  className="bg-[#18A5A5] hover:bg-[#185166] text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                >
                  Add New Booking
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-[#185166]">Your Bookings</h3>
                  <Button
                    onClick={() => navigate('/customer-add-booking')}
                    className="bg-[#18A5A5] hover:bg-[#185166] text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Add New Booking
                  </Button>
                </div>
                <div className="space-y-4">
                  {bookings.slice((currentPage - 1) * bookingsPerPage, currentPage * bookingsPerPage).map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      type="upcoming"
                      onEdit={handleEditBooking}
                      onCancel={handleCancelBooking}
                      onDuplicate={handleDuplicateBooking}
                      onPaymentAction={handlePaymentAction}
                    />
                  ))}
                </div>
                {bookings.length > bookingsPerPage && (
                  <div className="flex justify-center mt-6">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                        className="border-[#185166] text-[#185166] hover:bg-[#185166] hover:text-white"
                      >
                        Previous
                      </Button>
                      
                      {Array.from({ length: Math.ceil(bookings.length / bookingsPerPage) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={currentPage === pageNum 
                              ? "bg-[#185166] hover:bg-[#18A5A5] text-white" 
                              : "border-[#185166] text-[#185166] hover:bg-[#185166] hover:text-white"
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(bookings.length / bookingsPerPage)))}
                        disabled={currentPage === Math.ceil(bookings.length / bookingsPerPage)}
                        className="border-[#185166] text-[#185166] hover:bg-[#185166] hover:text-white"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
      
      <EditBookingDialog
        booking={editingBooking ? {
          ...editingBooking,
          linen_management: editingBooking.linen_management || false,
          linen_used: editingBooking.linen_used || []
        } : null}
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
      
      <ManualPaymentDialog
        booking={selectedBookingForPayment ? {
          id: selectedBookingForPayment.id,
          customer: activeCustomerId || 0,
          first_name: selectedBookingForPayment.first_name || '',
          last_name: selectedBookingForPayment.last_name || '', 
          email: selectedBookingForPayment.email || '',
          total_cost: selectedBookingForPayment.total_cost,
          payment_status: selectedBookingForPayment.payment_status,
          date_time: selectedBookingForPayment.date_time,
          address: selectedBookingForPayment.address
        } : null}
        isOpen={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          setSelectedBookingForPayment(null);
        }}
        onSuccess={() => {
          fetchUpcomingBookings();
          setPaymentDialogOpen(false);
          setSelectedBookingForPayment(null);
        }}
      />
    </div>
  );
};

export default CustomerUpcomingBookings;