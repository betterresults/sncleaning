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
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{booking.service_type}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(booking.date_time).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(booking.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {booking.address}, {booking.postcode}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <div className="font-medium">£{booking.total_cost}</div>
                      <div className="text-sm text-muted-foreground">{booking.total_hours}h</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditBooking(booking)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {booking.cleaner && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>Cleaner: {booking.cleaner.first_name} {booking.cleaner.last_name}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    booking.booking_status === 'Confirmed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.booking_status}
                  </span>
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