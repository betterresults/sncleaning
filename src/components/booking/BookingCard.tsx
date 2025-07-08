
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Clock, MapPin, User, Edit, Star } from 'lucide-react';

interface BaseBooking {
  id: number;
  date_time: string;
  address: string;
  postcode: string;
  service_type: string;
  total_hours: number;
  total_cost: number | string;
  booking_status: string;
  payment_status?: string;
  same_day?: boolean;
  cleaner?: {
    first_name: string;
    last_name: string;
  };
}

interface BookingCardProps<T extends BaseBooking> {
  booking: T;
  type: 'upcoming' | 'completed';
  onEdit?: (booking: T) => void;
  onCancel?: (booking: T) => void;
  onDuplicate?: (booking: T) => void;
  onReview?: (booking: T) => void;
  onSeePhotos?: (booking: T) => void;
  hasReview?: boolean;
}

const BookingCard = <T extends BaseBooking>({
  booking,
  type,
  onEdit,
  onCancel,
  onDuplicate,
  onReview,
  onSeePhotos,
  hasReview
}: BookingCardProps<T>) => {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 ${
      booking.same_day 
        ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:shadow-orange-100 dark:from-orange-950/20 dark:to-red-950/20 dark:border-orange-800/30' 
        : 'border-border/60 bg-white hover:shadow-primary/5'
    }`}>
      
      {/* Header with Service Type and Cost */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-[#185166] tracking-tight">{booking.service_type}</h3>
          {booking.same_day && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              Same Day
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-600">£{booking.total_cost}</div>
        </div>
      </div>
      
      {/* Date, Time, Hours and Cleaner in a compact row */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[#185166]">
            <Calendar className="h-4 w-4 text-gray-600" />
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
          <div className="flex items-center gap-2 text-[#185166]">
            <Clock className="h-4 w-4 text-gray-600" />
            <span className="font-medium">{booking.total_hours}h</span>
          </div>
        </div>
        {booking.cleaner && (
          <div className="flex items-center gap-2 text-sm text-[#185166]">
            <User className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-[#185166]">{booking.cleaner.first_name} {booking.cleaner.last_name}</span>
          </div>
        )}
      </div>
      
      {/* Status and Actions with Address/Photos */}
      <div className="pt-3 border-t border-border/40">
        {/* Address row - aligned with other content */}
        {type === 'upcoming' && (
          <div className="flex items-center gap-2 text-sm text-[#185166] mb-3">
            <MapPin className="h-4 w-4 text-gray-600 flex-shrink-0" />
            <span className="font-bold truncate">{booking.address}</span>
          </div>
        )}
        
        {/* Status and Actions row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {type === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSeePhotos?.(booking)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/30"
              >
                📷 See Photos
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {type === 'upcoming' && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 dark:border-red-800/30"
                    >
                      <span className="mr-1">✕</span>
                      <span className="hidden sm:inline">Cancel</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this booking? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No, Keep Booking</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onCancel?.(booking)} className="bg-red-600 hover:bg-red-700">
                        Yes, Cancel Booking
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDuplicate?.(booking)}
                  className="bg-white hover:bg-[#185166] text-[#185166] hover:text-white border-[#185166]"
                >
                  <span className="mr-1">📋</span>
                  <span className="hidden sm:inline">Duplicate</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit?.(booking)}
                  className="bg-[#185166] hover:bg-[#18A5A5] text-white border-[#185166] hover:border-[#18A5A5]"
                >
                  <Edit className="h-4 w-4" />
                  <span className="ml-1 hidden sm:inline">Edit</span>
                </Button>
              </>
            )}
            
            {type === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReview?.(booking)}
                className={`${
                  hasReview 
                    ? 'bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 dark:bg-green-950/20 dark:hover:bg-green-950/40 dark:text-green-400 dark:border-green-800/30'
                    : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-600 hover:text-yellow-700 border-yellow-200 hover:border-yellow-300 dark:bg-yellow-950/20 dark:hover:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800/30'
                }`}
              >
                <Star className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">
                  {hasReview ? 'View Review' : 'Leave Review'}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
