
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Clock, MapPin, User, Edit, Star, CreditCard, Camera, ExternalLink } from 'lucide-react';
import PaymentStatusIndicator from '@/components/payments/PaymentStatusIndicator';

interface BaseBooking {
  id: number;
  date_time: string;
  address: string;
  postcode: string;
  service_type: string;
  cleaning_type?: string;
  total_hours: number;
  total_cost: number | string;
  booking_status: string;
  payment_status?: string;
  same_day?: boolean;
  invoice_id?: string;
  invoice_link?: string;
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
  onPaymentAction?: (booking: T) => void;
  hasReview?: boolean;
  isOverdue?: boolean;
}

const BookingCard = <T extends BaseBooking>({
  booking,
  type,
  onEdit,
  onCancel,
  onDuplicate,
  onReview,
  onSeePhotos,
  onPaymentAction,
  hasReview,
  isOverdue = false
}: BookingCardProps<T>) => {
  // Check if booking is within 24 hours
  const isWithin24Hours = () => {
    const now = new Date();
    const bookingDate = new Date(booking.date_time);
    const diffInHours = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 24 && diffInHours >= 0;
  };
  
  // Format service type (main category) to human-readable text
  const getServiceTypeLabel = (serviceType: string) => {
    const labels: Record<string, string> = {
      'airbnb': 'Airbnb Cleaning',
      'domestic': 'Domestic Cleaning',
      'carpet': 'Carpet Cleaning',
      'commercial': 'Commercial Cleaning',
      'End of Tenancy': 'End of Tenancy Cleaning'
    };
    return labels[serviceType] || serviceType;
  };

  // Format cleaning type (specific type) to human-readable text
  const getCleaningTypeLabel = (cleaningType: string) => {
    const labels: Record<string, string> = {
      'check_in_check_out': 'Check-in / Check-out',
      'checkin-checkout': 'Check-in / Check-out',
      'midstay': 'Mid-stay',
      'light': 'Light Cleaning',
      'deep': 'Deep Cleaning',
      'standard_cleaning': 'Standard Cleaning',
      'deep_cleaning': 'Deep Cleaning',
      'Standard Cleaning': 'Standard Cleaning',
      'Deep Cleaning': 'Deep Cleaning'
    };
    return labels[cleaningType] || cleaningType;
  };
  return (
    <div className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 ${
      isOverdue
        ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 hover:shadow-red-100 dark:from-red-950/30 dark:to-red-950/40 dark:border-red-800/50'
        : booking.same_day 
          ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:shadow-orange-100 dark:from-orange-950/20 dark:to-red-950/20 dark:border-orange-800/30' 
          : 'border-border/60 bg-white hover:shadow-primary/5'
    }`}>
      
      {/* Header with Service Type, Cleaning Type and Cost */}
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-[#185166] tracking-tight">
              {getServiceTypeLabel(booking.service_type)}
            </h3>
          </div>
          {booking.cleaning_type && (
            <p className="text-sm text-gray-600 font-medium">
              {getCleaningTypeLabel(booking.cleaning_type)}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Booking #{booking.id}</span>
            {booking.same_day && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                Same Day
              </span>
            )}
          </div>
          {/* Separator line matching the bottom separator */}
          <div className="w-full h-px bg-border/40 mt-2"></div>
        </div>
        <div className="text-right flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <div className="text-2xl font-bold text-[#18A5A5]">£{Number(booking.total_cost || 0).toFixed(2)}</div>
            {/* Invoice link - show for completed bookings if available */}
            {type === 'completed' && booking.invoice_link && (
              <a
                href={booking.invoice_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-[#18A5A5] hover:text-[#185166] transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                View Invoice
              </a>
            )}
          </div>
          {booking.payment_status && (type === 'upcoming' ? isWithin24Hours() : true) && (
            <PaymentStatusIndicator 
              status={booking.payment_status} 
              isClickable={!booking.payment_status.toLowerCase().includes('paid') && !!onPaymentAction}
              onClick={!booking.payment_status.toLowerCase().includes('paid') && onPaymentAction ? () => onPaymentAction(booking) : undefined}
              size="md"
            />
          )}
        </div>
      </div>
      
      {/* Date, Time and Cleaner with Hours - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 text-sm gap-3 sm:gap-0">
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
        <div className="flex items-center gap-4 text-sm text-[#185166]">
          {booking.cleaner && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-[#185166]">{booking.cleaner.first_name} {booking.cleaner.last_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-600" />
            <span className="font-medium">{booking.total_hours}h</span>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-[#185166]">
          <MapPin className="h-4 w-4 text-gray-600 flex-shrink-0" />
          <span className="font-bold">{booking.address}, {booking.postcode}</span>
        </div>
      </div>
      
      {/* Separator and Actions */}
      <div className="pt-3 border-t border-border/40">
        {type === 'upcoming' && (
          <div className="flex items-center justify-between w-full">
            {/* Cancel button - Left */}
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
            
            {/* Duplicate button - Center */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDuplicate?.(booking)}
              className="bg-white hover:bg-[#185166] text-[#185166] hover:text-white border-[#185166]"
            >
              <span className="mr-1">📋</span>
              <span className="hidden sm:inline">Duplicate</span>
            </Button>
            
            {/* Edit button - Right */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(booking)}
              className="bg-[#185166] hover:bg-[#18A5A5] text-white border-[#185166] hover:border-[#18A5A5]"
            >
              <Edit className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Edit</span>
            </Button>
          </div>
        )}
        
        {type === 'completed' && (
          <div className="flex items-center justify-between">
            {(() => {
              const actions = [];
              
              // Always include Review button
              actions.push(
                <Button
                  key="review"
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
              );
              
              // Add Photos button if available
              if (onSeePhotos) {
                actions.push(
                  <Button
                    key="photos"
                    variant="outline"
                    size="sm"
                    onClick={() => onSeePhotos?.(booking)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/30"
                  >
                    <Camera className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">Photos</span>
                  </Button>
                );
              }
              
              // Render based on number of actions
              if (actions.length === 1) {
                return (
                  <>
                    {actions[0]}
                    <div></div>
                    <div></div>
                  </>
                );
              } else if (actions.length === 2) {
                return (
                  <>
                    {actions[0]}
                    <div></div>
                    {actions[1]}
                  </>
                );
              } else {
                return actions;
              }
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCard;
