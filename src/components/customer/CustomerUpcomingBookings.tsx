import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EditBookingDialog from './EditBookingDialog';

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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

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

  const handleDuplicateBooking = async (booking: Booking) => {
    try {
      // Create a copy of the booking with a new date (next week)
      const newDate = new Date(booking.date_time);
      newDate.setDate(newDate.getDate() + 7);

      const { error } = await supabase
        .from('bookings')
        .insert({
          customer: activeCustomerId,
          date_time: newDate.toISOString(),
          address: booking.address,
          postcode: booking.postcode,
          service_type: booking.service_type,
          total_hours: booking.total_hours,
          total_cost: booking.total_cost,
          cleaning_cost_per_hour: booking.cleaning_cost_per_hour,
          additional_details: booking.additional_details,
          property_details: booking.property_details,
          parking_details: booking.parking_details,
          key_collection: booking.key_collection,
          access: booking.access,
          first_name: booking.first_name,
          last_name: booking.last_name,
          phone_number: booking.phone_number,
          email: booking.email,
          booking_status: 'Pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking duplicated successfully for next week",
      });

      fetchUpcomingBookings();
    } catch (error) {
      console.error('Error duplicating booking:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate booking",
        variant: "destructive",
      });
    }
  };

  const handleBookingUpdated = () => {
    fetchUpcomingBookings();
  };

  const fetchUpcomingBookings = async () => {
    if (!activeCustomerId) return;

    try {
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
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
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
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 dark:from-orange-950/20 dark:to-orange-900/20 dark:border-orange-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{pendingBookings}</p>
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

      {/* Bookings List */}
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
                    {booking.cleaner && (
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium text-green-600 dark:text-green-400">{booking.cleaner.first_name} {booking.cleaner.last_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Date, Time, and Hours in a compact row */}
                <div className="flex items-center gap-6 mb-4 text-sm">
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
                
                {/* Address */}
                <div className="flex items-center gap-2 text-sm mb-4 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="truncate">{booking.address}, {booking.postcode}</span>
                </div>
                
                {/* Status and Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border/40">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                    booking.booking_status === 'Confirmed' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : booking.booking_status === 'Pending'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                  }`}>
                    {booking.booking_status}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelBooking(booking)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 dark:border-red-800/30"
                    >
                      <span className="mr-1">✕</span>
                      <span className="hidden sm:inline">Cancel</span>
                    </Button>
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
      
      <EditBookingDialog
        booking={editingBooking}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onBookingUpdated={handleBookingUpdated}
      />
    </div>
  );
};

export default CustomerUpcomingBookings;