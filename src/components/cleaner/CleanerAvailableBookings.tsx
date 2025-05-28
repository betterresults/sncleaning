
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Booking } from './types';

const CleanerAvailableBookings = () => {
  const { cleanerId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: availableBookings, isLoading, error } = useQuery({
    queryKey: ['available-bookings'],
    queryFn: async () => {
      console.log('Fetching available bookings...');
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          cleaners (
            id,
            first_name,
            last_name,
            full_name
          )
        `)
        .is('cleaner', null)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true });

      if (error) {
        console.error('Error fetching available bookings:', error);
        throw error;
      }

      console.log('Available bookings fetched:', data);
      return data as Booking[];
    },
  });

  const assignBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      console.log('Assigning booking', bookingId, 'to cleaner', cleanerId);
      
      const { data, error } = await supabase
        .from('bookings')
        .update({ cleaner: cleanerId })
        .eq('id', bookingId)
        .select();

      if (error) {
        console.error('Error assigning booking:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Booking assigned successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['available-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['cleaner-bookings'] });
    },
    onError: (error) => {
      console.error('Error assigning booking:', error);
      toast({
        title: "Error",
        description: "Failed to assign booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAssignBooking = (bookingId: number) => {
    assignBookingMutation.mutate(bookingId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Available Bookings</h1>
        </div>
        <div className="text-center py-8">
          <div className="text-lg">Loading available bookings...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Available Bookings</h1>
        </div>
        <div className="text-center py-8">
          <div className="text-lg text-red-600">Error loading available bookings</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Briefcase className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Available Bookings</h1>
      </div>

      {!availableBookings || availableBookings.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Available Bookings</h3>
              <p className="text-gray-600">
                There are currently no unassigned bookings available.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {availableBookings.map((booking) => (
            <Card key={booking.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {booking.first_name} {booking.last_name}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(booking.date_time), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(booking.date_time), 'HH:mm')}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {booking.postcode}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">Available</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{booking.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Cost</p>
                    <p className="font-medium">£{booking.total_cost}</p>
                  </div>
                  {booking.total_hours && (
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-medium">{booking.total_hours} hours</p>
                    </div>
                  )}
                  {booking.cleaning_type && (
                    <div>
                      <p className="text-sm text-gray-600">Cleaning Type</p>
                      <p className="font-medium">{booking.cleaning_type}</p>
                    </div>
                  )}
                </div>
                
                {booking.additional_details && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Additional Details</p>
                    <p className="text-sm">{booking.additional_details}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleAssignBooking(booking.id)}
                    disabled={assignBookingMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {assignBookingMutation.isPending ? 'Assigning...' : 'Assign to Me'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CleanerAvailableBookings;
