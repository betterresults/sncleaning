import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, CheckCircle2, XCircle, Camera, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import LocationTracker from './LocationTracker';
import CleaningPhotosUploadDialog from './CleaningPhotosUploadDialog';

interface Booking {
  id: number;
  customer?: number;
  cleaner?: number;
  first_name?: string;
  last_name?: string;
  address?: string;
  postcode?: string;
  date_time?: string;
  total_hours?: number;
  cleaning_type?: string;
  service_type?: string;
  total_cost?: number;
  cleaner_pay?: number;
  cleaner_percentage?: number;
  booking_status?: string;
}

interface TrackingRecord {
  id: string;
  booking_id: number;
  check_in_time?: string;
  check_out_time?: string;
  check_in_location?: string;
  check_out_location?: string;
  is_auto_checked_in: boolean;
  is_auto_checked_out: boolean;
  work_duration?: unknown;
}

const CleanerTodayBookingsList = () => {
  const { cleanerId, userRole, loading: authLoading } = useAuth();
  const { selectedCleanerId } = useAdminCleaner();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Use selected cleaner ID if admin is viewing, otherwise use authenticated cleaner's ID
  const effectiveCleanerId = userRole === 'admin' ? selectedCleanerId : cleanerId;
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trackingRecords, setTrackingRecords] = useState<TrackingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<{
    id: number;
    customer: number;
    cleaner: number;
    postcode: string;
    date_time: string;
  } | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const fetchTodaysBookings = async () => {
    if (!effectiveCleanerId) {
      setError(userRole === 'admin' ? 'Please select a cleaner to view' : 'No cleaner ID found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

      // Fetch today's bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('cleaner', effectiveCleanerId)
        .gte('date_time', startOfDay.toISOString())
        .lte('date_time', endOfDay.toISOString())
        .order('date_time', { ascending: true });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setError('Failed to fetch bookings: ' + bookingsError.message);
        return;
      }

      setBookings(bookingsData || []);

      // Fetch tracking records for today's bookings
      if (bookingsData && bookingsData.length > 0) {
        const bookingIds = bookingsData.map(b => b.id);
        const { data: trackingData, error: trackingError } = await supabase
          .from('cleaner_tracking')
          .select('*')
          .in('booking_id', bookingIds);

        if (trackingError) {
          console.error('Error fetching tracking records:', trackingError);
        } else {
          setTrackingRecords(trackingData || []);
        }
      }

    } catch (error) {
      console.error('Error in fetchTodaysBookings:', error);
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckIn = async (booking: Booking) => {
    if (!effectiveCleanerId) return;

    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const location = `${position.coords.latitude},${position.coords.longitude}`;

      const { error } = await supabase
        .from('cleaner_tracking')
        .insert({
          booking_id: booking.id,
          cleaner_id: effectiveCleanerId,
          check_in_time: new Date().toISOString(),
          check_in_location: location,
          is_auto_checked_in: false
        });

      if (error) {
        console.error('Error checking in:', error);
        toast({
          title: "Check-in Failed",
          description: "Could not check in: " + error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Checked In",
        description: "Successfully checked in to the booking",
      });

      fetchTodaysBookings();
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: "Location Error",
        description: "Could not get your location. Please enable location services.",
        variant: "destructive",
      });
    }
  };

  const handleManualCheckOut = async (booking: Booking) => {
    if (!effectiveCleanerId) return;

    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const location = `${position.coords.latitude},${position.coords.longitude}`;

      // Find the tracking record for this booking
      const trackingRecord = trackingRecords.find(tr => tr.booking_id === booking.id);
      
      if (!trackingRecord) {
        toast({
          title: "Check-out Failed",
          description: "No check-in record found for this booking",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('cleaner_tracking')
        .update({
          check_out_time: new Date().toISOString(),
          check_out_location: location,
          is_auto_checked_out: false
        })
        .eq('id', trackingRecord.id);

      if (error) {
        console.error('Error checking out:', error);
        toast({
          title: "Check-out Failed",
          description: "Could not check out: " + error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Checked Out",
        description: "Successfully checked out of the booking",
      });

      fetchTodaysBookings();
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: "Location Error",
        description: "Could not get your location. Please enable location services.",
        variant: "destructive",
      });
    }
  };

  const handleUploadPhotos = (booking: Booking) => {
    const trackingRecord = trackingRecords.find(tr => tr.booking_id === booking.id);
    if (!trackingRecord?.check_in_time) {
      toast({
        title: "Check-in Required",
        description: "You must check in before uploading photos",
        variant: "destructive",
      });
      return;
    }
    
    // Only set booking if it has required fields for the dialog
    if (booking.customer && booking.cleaner && booking.postcode && booking.date_time) {
      setSelectedBooking({
        id: booking.id,
        customer: booking.customer,
        cleaner: booking.cleaner,
        postcode: booking.postcode,
        date_time: booking.date_time
      });
      setUploadDialogOpen(true);
    } else {
      toast({
        title: "Missing Information",
        description: "Some booking details are missing for photo upload",
        variant: "destructive",
      });
    }
  };

  const getTrackingRecord = (bookingId: number): TrackingRecord | undefined => {
    return trackingRecords.find(tr => tr.booking_id === bookingId);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (duration: unknown) => {
    if (typeof duration !== 'string') return 'N/A';
    const match = duration.match(/(\d+):(\d+):(\d+)/);
    if (match) {
      const [, hours, minutes] = match;
      return `${hours}h ${minutes}m`;
    }
    return duration;
  };

  const calculateEarnings = (booking: Booking): number => {
    // If cleaner_pay is set, use it directly
    if (booking.cleaner_pay && booking.cleaner_pay > 0) {
      return booking.cleaner_pay;
    }
    
    // Otherwise calculate based on percentage or fallback
    if (booking.total_cost && booking.cleaner_percentage) {
      return (booking.total_cost * booking.cleaner_percentage) / 100;
    }
    
    // Fallback to 70% if no specific percentage is set
    if (booking.total_cost) {
      return (booking.total_cost * 70) / 100;
    }
    
    return 0;
  };

  useEffect(() => {
    if (!authLoading && effectiveCleanerId) {
      fetchTodaysBookings();
    }
  }, [effectiveCleanerId, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-base">Loading today's bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4 text-sm px-4">{error}</div>
        <Button onClick={fetchTodaysBookings}>
          Retry
        </Button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No bookings for today</h3>
          <p className="text-gray-600">You have no scheduled cleanings for today.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Location Tracker Component */}
      <LocationTracker 
        effectiveCleanerId={effectiveCleanerId}
        bookings={bookings}
        onTrackingUpdate={fetchTodaysBookings}
      />

      <div className="space-y-4">
        {bookings.map((booking) => {
          const tracking = getTrackingRecord(booking.id);
          const isCheckedIn = !!tracking?.check_in_time;
          const isCheckedOut = !!tracking?.check_out_time;
          const isEndOfTenancy = booking.service_type === 'End of Tenancy' || booking.cleaning_type === 'End of Tenancy';

          return (
            <Card key={booking.id} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {booking.first_name} {booking.last_name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <MapPin className="h-4 w-4" />
                      <span>{booking.address}, {booking.postcode}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isCheckedOut ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    ) : isCheckedIn ? (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Working
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Not Started
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Time:</span>
                    <div>{booking.date_time ? formatTime(booking.date_time) : 'N/A'}</div>
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span>
                    <div>{booking.total_hours}h</div>
                  </div>
                  <div>
                    <span className="font-medium">Service:</span>
                    <div>{booking.cleaning_type || 'Regular Cleaning'}</div>
                  </div>
                  <div>
                    <span className="font-medium">My Earnings:</span>
                    <div>£{calculateEarnings(booking).toFixed(2)}</div>
                  </div>
                </div>

                {tracking && (
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="text-sm font-medium">Work Status:</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      {tracking.check_in_time && (
                        <div>
                          <span className="font-medium">Checked in:</span>
                          <div>{formatTime(tracking.check_in_time)}</div>
                          {tracking.is_auto_checked_in && (
                            <Badge variant="outline" className="text-xs">Auto</Badge>
                          )}
                        </div>
                      )}
                      {tracking.check_out_time && (
                        <div>
                          <span className="font-medium">Checked out:</span>
                          <div>{formatTime(tracking.check_out_time)}</div>
                          {tracking.is_auto_checked_out && (
                            <Badge variant="outline" className="text-xs">Auto</Badge>
                          )}
                        </div>
                      )}
                      {tracking.work_duration && (
                        <div>
                          <span className="font-medium">Duration:</span>
                          <div>{formatDuration(tracking.work_duration)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {/* Checklist button for End of Tenancy bookings */}
                  {isEndOfTenancy && (
                    <Button
                      onClick={() => navigate(`/cleaner-checklist/${booking.id}`)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 border-green-200"
                    >
                      <FileText className="h-4 w-4" />
                      Checklist
                    </Button>
                  )}

                  {!isCheckedIn ? (
                    <Button 
                      onClick={() => handleManualCheckIn(booking)}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Check In
                    </Button>
                  ) : !isCheckedOut ? (
                    <Button 
                      onClick={() => handleManualCheckOut(booking)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Check Out
                    </Button>
                  ) : null}

                  <Button
                    onClick={() => handleUploadPhotos(booking)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={!isCheckedIn}
                  >
                    <Camera className="h-4 w-4" />
                    Upload Photos
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedBooking && (
        <CleaningPhotosUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          booking={selectedBooking}
        />
      )}
    </div>
  );
};

export default CleanerTodayBookingsList;