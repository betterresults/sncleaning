import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wifi, WifiOff } from 'lucide-react';

interface Booking {
  id: number;
  address?: string;
  postcode?: string;
}

interface LocationTrackerProps {
  effectiveCleanerId: number | null;
  bookings: Booking[];
  onTrackingUpdate: () => void;
}

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

const LocationTracker: React.FC<LocationTrackerProps> = ({
  effectiveCleanerId,
  bookings,
  onTrackingUpdate
}) => {
  const { toast } = useToast();
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<LocationState | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [currentLocation, setCurrentLocation] = useState<LocationState | null>(null);

  // Calculate distance between two coordinates in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Parse address to approximate coordinates (simple geocoding alternative)
  const getApproximateCoordinates = (address: string, postcode: string): { lat: number; lng: number } | null => {
    // This is a simplified approach - in a real app you'd use a geocoding service
    // For now, we'll use London coordinates as default and simulate nearby locations
    const baseLat = 51.5074;
    const baseLng = -0.1278;
    
    // Create a simple hash from address to generate consistent coordinates
    let hash = 0;
    const fullAddress = `${address} ${postcode}`;
    for (let i = 0; i < fullAddress.length; i++) {
      const char = fullAddress.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use hash to create offset within London area (±0.1 degrees)
    const latOffset = ((hash % 2000) - 1000) / 10000; // -0.1 to +0.1
    const lngOffset = (((hash >> 10) % 2000) - 1000) / 10000; // -0.1 to +0.1
    
    return {
      lat: baseLat + latOffset,
      lng: baseLng + lngOffset
    };
  };

  // Check if location is near any booking property
  const checkGeofencing = async (location: LocationState) => {
    if (!effectiveCleanerId) return;

    for (const booking of bookings) {
      if (!booking.address || !booking.postcode) continue;

      const propertyCoords = getApproximateCoordinates(booking.address, booking.postcode);
      if (!propertyCoords) continue;

      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        propertyCoords.lat,
        propertyCoords.lng
      );

      console.log(`Distance to ${booking.address}: ${distance.toFixed(0)}m`);

      // Check for auto check-in (within 100m)
      if (distance <= 100) {
        await handleAutoCheckIn(booking, location);
      }
      // Check for auto check-out (more than 500m)
      else if (distance > 500) {
        await handleAutoCheckOut(booking, location);
      }
    }
  };

  // Auto check-in when near property
  const handleAutoCheckIn = async (booking: Booking, location: LocationState) => {
    if (!effectiveCleanerId) return;

    try {
      // Check if already checked in
      const { data: existingTracking } = await supabase
        .from('cleaner_tracking')
        .select('*')
        .eq('booking_id', booking.id)
        .eq('cleaner_id', effectiveCleanerId)
        .single();

      if (existingTracking?.check_in_time) return; // Already checked in

      const locationString = `${location.latitude},${location.longitude}`;

      const { error } = await supabase
        .from('cleaner_tracking')
        .insert({
          booking_id: booking.id,
          cleaner_id: effectiveCleanerId,
          check_in_time: new Date().toISOString(),
          check_in_location: locationString,
          is_auto_checked_in: true
        });

      if (!error) {
        toast({
          title: "Auto Check-in",
          description: `Automatically checked in at ${booking.address}`,
        });
        onTrackingUpdate();
      }
    } catch (error) {
      console.error('Auto check-in error:', error);
    }
  };

  // Auto check-out when far from property
  const handleAutoCheckOut = async (booking: Booking, location: LocationState) => {
    if (!effectiveCleanerId) return;

    try {
      // Check if checked in but not checked out
      const { data: existingTracking } = await supabase
        .from('cleaner_tracking')
        .select('*')
        .eq('booking_id', booking.id)
        .eq('cleaner_id', effectiveCleanerId)
        .single();

      if (!existingTracking?.check_in_time || existingTracking?.check_out_time) return;

      const locationString = `${location.latitude},${location.longitude}`;

      const { error } = await supabase
        .from('cleaner_tracking')
        .update({
          check_out_time: new Date().toISOString(),
          check_out_location: locationString,
          is_auto_checked_out: true
        })
        .eq('id', existingTracking.id);

      if (!error) {
        toast({
          title: "Auto Check-out",
          description: `Automatically checked out from ${booking.address}`,
        });
        onTrackingUpdate();
      }
    } catch (error) {
      console.error('Auto check-out error:', error);
    }
  };

  // Handle location change (event-driven)
  const handleLocationChange = (position: GeolocationPosition) => {
    const newLocation: LocationState = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: Date.now()
    };

    // Only process if location changed significantly (>50m) or it's been >5 minutes
    const lastLocation = lastLocationRef.current;
    if (lastLocation) {
      const distance = calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        newLocation.latitude,
        newLocation.longitude
      );
      const timeDiff = newLocation.timestamp - lastLocation.timestamp;

      // Skip if movement is less than 50m and less than 5 minutes passed
      if (distance < 50 && timeDiff < 5 * 60 * 1000) {
        return;
      }
    }

    setCurrentLocation(newLocation);
    lastLocationRef.current = newLocation;
    
    // Check geofencing for auto check-in/out
    checkGeofencing(newLocation);
  };

  // Handle location error
  const handleLocationError = (error: GeolocationPositionError) => {
    console.error('Location error:', error);
    setIsTracking(false);
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setLocationPermission('denied');
        toast({
          title: "Location Access Denied",
          description: "Please enable location access for automatic check-in/out",
          variant: "destructive",
        });
        break;
      case error.POSITION_UNAVAILABLE:
        toast({
          title: "Location Unavailable",
          description: "Location information is unavailable",
          variant: "destructive",
        });
        break;
      case error.TIMEOUT:
        toast({
          title: "Location Timeout",
          description: "Location request timed out",
          variant: "destructive",
        });
        break;
    }
  };

  // Start location tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    // Request permission and start watching
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationPermission('granted');
        setIsTracking(true);
        handleLocationChange(position);

        // Start watching for significant location changes
        watchIdRef.current = navigator.geolocation.watchPosition(
          handleLocationChange,
          handleLocationError,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000 // Cache for 1 minute
          }
        );
      },
      (error) => {
        handleLocationError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes on first request
      }
    );
  };

  // Stop location tracking
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  // Auto-start tracking when component mounts
  useEffect(() => {
    if (effectiveCleanerId && bookings.length > 0) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [effectiveCleanerId, bookings.length]);

  // Request location permission on mount
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
      });
    }
  }, []);

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="font-medium">Location Tracking</span>
          </div>
          
          <div className="flex items-center gap-2">
            {isTracking ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  Inactive
                </Badge>
              </>
            )}
          </div>
        </div>
        
        {currentLocation && (
          <div className="mt-2 text-xs text-gray-600">
            Accuracy: ±{Math.round(currentLocation.accuracy)}m | 
            Last update: {new Date(currentLocation.timestamp).toLocaleTimeString()}
          </div>
        )}

        {locationPermission === 'denied' && (
          <div className="mt-2 text-xs text-red-600">
            Location access denied. Automatic check-in/out will not work.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationTracker;