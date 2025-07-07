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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Bookings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming bookings found.</p>
            <p className="text-sm">Book a new cleaning service to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-r from-card via-card to-card/95 p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{booking.service_type}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{new Date(booking.date_time).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{new Date(booking.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="truncate">{booking.address}, {booking.postcode}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-xl font-bold text-foreground">£{booking.total_cost}</div>
                      <div className="text-sm text-muted-foreground">{booking.total_hours} hours</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditBooking(booking)}
                      className="opacity-70 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="ml-1 hidden sm:inline">Edit</span>
                    </Button>
                  </div>
                </div>
                
                {booking.cleaner && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-3 bg-muted/30 rounded-lg">
                    <User className="h-4 w-4 text-primary" />
                    <span>Assigned Cleaner: <span className="font-medium text-foreground">{booking.cleaner.first_name} {booking.cleaner.last_name}</span></span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-border/30">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    booking.booking_status === 'Confirmed' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {booking.booking_status}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateBooking(booking)}
                      className="text-primary hover:text-primary"
                    >
                      <span className="mr-1">📋</span>
                      <span className="hidden sm:inline">Duplicate</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelBooking(booking)}
                      className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <span className="mr-1">✕</span>
                      <span className="hidden sm:inline">Cancel</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <EditBookingDialog
        booking={editingBooking}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onBookingUpdated={handleBookingUpdated}
      />
    </Card>
  );
};

export default CustomerUpcomingBookings;