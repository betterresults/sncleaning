
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarDays, Clock, MapPin, User, Banknote, UserPlus } from 'lucide-react';
import { Booking } from './types';
import { formatAdditionalDetails } from '@/utils/bookingFormatters';

const CleanerAvailableBookings = () => {
  const { cleanerId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log('CleanerAvailableBookings - cleanerId:', cleanerId);

  const fetchAvailableBookings = async () => {
    console.log('Fetching available bookings (unassigned)...');

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .is('cleaner', null)
      .gte('date_time', new Date().toISOString()) // Only future bookings  
      .order('date_time', { ascending: true });

    if (error) {
      console.error('Error fetching available bookings:', error);
      throw error;
    }

    console.log('Available bookings data:', data);
    return data;
  };

    const { data: bookings = [], isLoading, error } = useQuery({
      queryKey: ['available-bookings'],
      queryFn: fetchAvailableBookings,
      refetchInterval: 30000, // Refetch every 30 seconds to keep data fresh
    });

  const assignBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      console.log('Assigning booking:', bookingId, 'to cleaner:', cleanerId);

      if (!cleanerId) {
        throw new Error('Cleaner ID is required to assign a booking.');
      }

      const { data, error } = await supabase
        .from('bookings')
        .update({ cleaner: cleanerId })
        .eq('id', bookingId)
        .select();

      if (error) {
        console.error('Error assigning booking:', error);
        throw error;
      }

      console.log('Successfully assigned booking:', data);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Booking assigned successfully",
        description: "You have successfully assigned this booking to yourself.",
      });
      queryClient.invalidateQueries({ queryKey: ['available-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['cleaner-bookings'] });
    },
    onError: (error) => {
      console.error('Assign mutation error:', error);
      toast({
        title: "Error assigning booking",
        description: "There was an error assigning the booking. Please try again.",
        variant: "destructive",
      });
    },
  });


  const handleAssignBooking = (bookingId: number) => {
    console.log('Assigning booking:', bookingId, 'to cleaner:', cleanerId);
    assignBookingMutation.mutate(bookingId);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading available bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Available Bookings</h2>
        <Badge variant="secondary" className="text-sm">
          {bookings.length} available
        </Badge>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No available bookings</h3>
              <p className="text-gray-500">All bookings are currently assigned. Check back later for new opportunities!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {booking.first_name} {booking.last_name}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-1" />
                        {booking.date_time ? format(new Date(booking.date_time), 'dd/MM/yyyy') : 'No date'}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {booking.date_time ? format(new Date(booking.date_time), 'HH:mm') : 'No time'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Banknote className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-600 text-lg">
                      £{(() => {
                        // Calculate potential pay using default rates
                        if (booking.total_hours && booking.total_hours > 0) {
                          // Hourly booking - use default £15/hour
                          return (booking.total_hours * 15).toFixed(2);
                        } else if (booking.total_cost) {
                          // Percentage booking - use default 75%
                          return (booking.total_cost * 0.75).toFixed(2);
                        }
                        return '0.00';
                      })()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium">{booking.address}</div>
                        {booking.postcode && (
                          <div className="text-gray-500">{booking.postcode}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div className="text-sm">
                        <div>{booking.email}</div>
                        <div className="text-gray-500">{booking.phone_number}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {booking.cleaning_type || 'Standard Cleaning'}
                      </span>
                    </div>
                    
                    {booking.total_hours && (
                      <div className="text-sm">
                        <span className="font-medium">Duration:</span> {booking.total_hours} hours
                      </div>
                    )}
                    
                    {booking.cleaning_type && (
                      <div className="text-sm">
                        <span className="font-medium">Type:</span> {booking.cleaning_type}
                      </div>
                    )}
                  </div>
                </div>
                
                {booking.additional_details && (
                  <div className="pt-3 border-t">
                    <div className="text-sm">
                      <span className="font-medium">Additional Details:</span>
                      <div className="mt-1 text-gray-600 whitespace-pre-wrap">{formatAdditionalDetails(booking.additional_details)}</div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => handleAssignBooking(booking.id)}
                    disabled={assignBookingMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {assignBookingMutation.isPending ? 'Getting Job...' : 'Get Job'}
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
