import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Clock, MapPin, User, Upload, Eye, CheckCircle, X } from 'lucide-react';
import { Booking } from './types';

interface CleanerBookingCardProps {
  booking: Booking;
  type: 'upcoming' | 'past' | 'available';
  onViewDetails: (booking: Booking) => void;
  onUploadPhotos?: (booking: Booking) => void;
  onMarkCompleted?: (booking: Booking) => void;
  onDropService?: (booking: Booking) => void;
  onAcceptBooking?: (booking: Booking) => void;
}

const CleanerBookingCard = ({
  booking,
  type,
  onViewDetails,
  onUploadPhotos,
  onMarkCompleted,
  onDropService,
  onAcceptBooking
}: CleanerBookingCardProps) => {
  // Check if booking is for today
  const isToday = () => {
    const bookingDate = new Date(booking.date_time).toDateString();
    const today = new Date().toDateString();
    return bookingDate === today;
  };

  // Check if booking is same day
  const isSameDay = booking.same_day;

  return (
    <div className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 ${
      isSameDay 
        ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:shadow-orange-100 dark:from-orange-950/20 dark:to-red-950/20 dark:border-orange-800/30' 
        : 'border-border/60 bg-gradient-to-br from-card to-card/80 hover:shadow-primary/5'
    }`}>
      
      {/* Header with Service Type and Earnings */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-foreground tracking-tight">{booking.service_type || booking.cleaning_type}</h3>
          {isSameDay && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              Same Day
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">£{booking.cleaner_pay || 0}</div>
          <div className="text-xs text-muted-foreground">Your earnings</div>
        </div>
      </div>
      
      {/* Date, Time, Hours and Customer in a compact row */}
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
          {(booking.total_hours || booking.hours_required) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{booking.total_hours || booking.hours_required}h</span>
            </div>
          )}
        </div>
        {booking.first_name && booking.last_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-600 dark:text-blue-400">{booking.first_name} {booking.last_name}</span>
          </div>
        )}
      </div>
      
      {/* Address and Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border/40">
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
        
        <div className="flex items-center gap-2 ml-4">
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
                // Today's booking - Show Upload Photos and Mark Complete
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUploadPhotos?.(booking)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/30"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">Photos</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => onMarkCompleted?.(booking)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">Complete</span>
                  </Button>
                </>
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