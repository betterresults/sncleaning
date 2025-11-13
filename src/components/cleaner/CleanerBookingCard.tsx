import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Clock, MapPin, User, Upload, Eye, CheckCircle, X, FileText, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Booking } from './types';
import { useServiceTypes, useCleaningTypes, getServiceTypeLabel, getCleaningTypeLabel } from '@/hooks/useCompanySettings';
import { normalizeCleaningTypeKey, normalizeServiceTypeKey, correctBookingTypes } from '@/utils/bookingFormatters';

interface CleanerBookingCardProps {
  booking: Booking;
  type: 'upcoming' | 'past' | 'available';
  onViewDetails: (booking: Booking) => void;
  onUploadPhotos?: (booking: Booking) => void;
  onDropService?: (booking: Booking) => void;
  onAcceptBooking?: (booking: Booking) => void;
}

const CleanerBookingCard = ({
  booking,
  type,
  onViewDetails,
  onUploadPhotos,
  onDropService,
  onAcceptBooking
}: CleanerBookingCardProps) => {
  const navigate = useNavigate();
  const { data: serviceTypes = [] } = useServiceTypes();
  const { data: cleaningTypes = [] } = useCleaningTypes();

  // Check if booking is for today
  const isToday = () => {
    const bookingDate = new Date(booking.date_time).toDateString();
    const today = new Date().toDateString();
    return bookingDate === today;
  };

  // Check if booking is same day
  const isSameDay = booking.same_day;

  // Correct swapped service_type and cleaning_type
  const { serviceType: correctedServiceType, cleaningType: correctedCleaningType } = correctBookingTypes(booking);

  // Check if this is an End of Tenancy booking
  const isEndOfTenancy = correctedServiceType === 'end_of_tenancy' || correctedCleaningType === 'end_of_tenancy';

  // Get formatted labels using corrected values
  const serviceTypeLabel = getServiceTypeLabel(normalizeServiceTypeKey(correctedServiceType), serviceTypes);
  const cleaningTypeLabel = getCleaningTypeLabel(normalizeCleaningTypeKey(correctedCleaningType), cleaningTypes);

  // Check if time is flexible (time_only is NULL)
  const isFlexibleTime = !booking.time_only;

  return (
    <div className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 ${
      isSameDay 
        ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:shadow-orange-100 dark:from-orange-950/20 dark:to-red-950/20 dark:border-orange-800/30' 
        : 'border-border/60 bg-gradient-to-br from-card to-card/80 hover:shadow-primary/5'
    }`}>
      
      {/* Header with Service Type and Earnings */}
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-foreground tracking-tight">
              {serviceTypeLabel}
            </h3>
            <Camera className={`h-4 w-4 ${booking.has_photos ? 'text-green-600' : 'text-gray-400'}`} />
            {isSameDay && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                Same Day
              </span>
            )}
          </div>
          {cleaningTypeLabel && (
            <p className="text-sm text-muted-foreground">
              {cleaningTypeLabel}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">£{booking.cleaner_pay || 0}</div>
          <div className="text-xs text-muted-foreground">Your earnings</div>
        </div>
      </div>
      
      {/* Date, Time, Hours - Keep on same line, customer below */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground min-w-0 flex-1">
            <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="font-medium truncate">
              {new Date(booking.date_time).toLocaleDateString('en-GB', { 
                weekday: 'short',
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}, {isFlexibleTime ? (
                <span className="text-orange-500" title="Customer requested flexible arrival time">⏰ Flexible</span>
              ) : (
                new Date(booking.date_time).toLocaleTimeString('en-GB', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })
              )}
            </span>
          </div>
          {booking.total_hours && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <span className="font-medium">{booking.total_hours}h</span>
            </div>
          )}
        </div>
        {booking.first_name && booking.last_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="font-medium text-blue-600 dark:text-blue-400">{booking.first_name} {booking.last_name}</span>
          </div>
        )}
      </div>
      
      {/* Address and Actions - Mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-border/40">
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-1 min-w-0">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.postcode)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
          >
            {booking.address}, {booking.postcode}
          </a>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Checklist button for End of Tenancy bookings */}
          {isEndOfTenancy && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/cleaner-checklist/${booking.id}`)}
              className="bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 dark:bg-green-950/20 dark:hover:bg-green-950/40 dark:text-green-400 dark:border-green-800/30"
            >
              <FileText className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Checklist</span>
            </Button>
          )}
          
          {/* View Details - Always available */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(booking)}
            className="bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-gray-950/20 dark:hover:bg-gray-950/40 dark:text-gray-400 dark:border-gray-800/30"
          >
            <Eye className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">View</span>
          </Button>
          
          {/* Buttons for upcoming bookings */}
          {type === 'upcoming' && (
            <>
              {isToday() ? (
                // Today's booking - Show Upload Photos only
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUploadPhotos?.(booking)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/30"
                >
                  <Upload className="h-4 w-4" />
                  <span className="ml-1 hidden sm:inline">Photos</span>
                </Button>
              ) : (
                // Future booking - Show Drop Service
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 dark:border-red-800/30"
                    >
                      <X className="h-4 w-4" />
                      <span className="ml-1 hidden sm:inline">Drop Service</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Drop Service</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to drop this service? This will unassign you from the booking and make it available for other cleaners to accept.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onDropService?.(booking)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Yes, Drop Service
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
          
          {/* Accept booking button for available bookings */}
          {type === 'available' && onAcceptBooking && (
            <Button
              size="sm"
              onClick={() => onAcceptBooking(booking)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Accept Booking
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CleanerBookingCard;