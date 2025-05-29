import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isToday, differenceInHours } from 'date-fns';
import { CalendarDays, Clock, MapPin, User, Banknote, UserX, CheckCircle2 } from 'lucide-react';
import { Booking } from './types';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BookingsTableProps {
  bookings: Booking[];
  onMarkAsCompleted: (bookingId: number) => void;
  onDropOff: (bookingId: number) => void;
}

const BookingsTable: React.FC<BookingsTableProps> = ({
  bookings,
  onMarkAsCompleted,
  onDropOff,
}) => {
  const [dropOffBookingId, setDropOffBookingId] = useState<number | null>(null);
  const isMobile = useIsMobile();

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const shouldShowCompleteButton = (booking: Booking) => {
    if (!booking.date_time) return false;
    const bookingDate = new Date(booking.date_time);
    return isToday(bookingDate);
  };

  const shouldShowDropOffButton = (booking: Booking) => {
    if (!booking.date_time) return false;
    const bookingDate = new Date(booking.date_time);
    const now = new Date();
    const hoursUntilBooking = differenceInHours(bookingDate, now);
    return hoursUntilBooking >= 24;
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '44' + cleaned.substring(1);
    }
    if (!cleaned.startsWith('44')) {
      return '44' + cleaned;
    }
    return cleaned;
  };

  const handlePhoneClick = (phone: string) => {
    const whatsappNumber = formatPhoneForWhatsApp(phone);
    const whatsappUrl = `https://wa.me/${whatsappNumber}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDropOffClick = (bookingId: number) => {
    setDropOffBookingId(bookingId);
  };

  const handleConfirmDropOff = () => {
    if (dropOffBookingId) {
      onDropOff(dropOffBookingId);
      setDropOffBookingId(null);
    }
  };

  const MobileBookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-4 w-4 text-gray-400" />
            <div className="text-sm font-medium">
              {booking.date_time ? format(new Date(booking.date_time), 'dd/MM/yyyy HH:mm') : 'No date/time'}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Banknote className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-green-600 text-sm">
              £{booking.cleaner_pay?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Customer */}
          <div className="flex items-start space-x-2">
            <User className="h-4 w-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-sm">{booking.first_name} {booking.last_name}</div>
              {booking.phone_number && (
                <button 
                  onClick={() => handlePhoneClick(booking.phone_number)}
                  className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
                >
                  {booking.phone_number}
                </button>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
            <div className="flex-1 text-sm text-gray-700">
              <div>{booking.address}</div>
              {booking.postcode && (
                <div className="text-gray-500 font-medium">{booking.postcode}</div>
              )}
            </div>
          </div>

          {/* Service */}
          <div className="flex flex-col space-y-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
              {booking.form_name || 'Standard Cleaning'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2">
            {shouldShowCompleteButton(booking) && (
              <Button
                onClick={() => onMarkAsCompleted(booking.id)}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white w-full"
              >
                <CheckCircle2 className="h-3 w-3 mr-2" />
                Complete
              </Button>
            )}
            {shouldShowDropOffButton(booking) && (
              <Button
                onClick={() => handleDropOffClick(booking.id)}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50 w-full"
              >
                <UserX className="h-3 w-3 mr-2" />
                Drop Off
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isMobile ? (
            <div className="p-4 space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-base">
                  No upcoming bookings found
                </div>
              ) : (
                bookings.map((booking) => (
                  <MobileBookingCard key={booking.id} booking={booking} />
                ))
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-base">Date & Time</TableHead>
                    <TableHead className="font-semibold text-base">Customer</TableHead>
                    <TableHead className="font-semibold text-base">Address</TableHead>
                    <TableHead className="font-semibold text-base">Service</TableHead>
                    <TableHead className="font-semibold text-base">Earnings</TableHead>
                    <TableHead className="font-semibold text-center text-base">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500 text-base">
                        No upcoming bookings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings.map((booking) => (
                      <TableRow key={booking.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell>
                          <div className="flex items-start space-x-3">
                            <div className="flex flex-col items-center space-y-1">
                              <CalendarDays className="h-4 w-4 text-gray-400" />
                              <Clock className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium text-base">
                                {booking.date_time ? format(new Date(booking.date_time), 'dd/MM/yyyy') : 'No date'}
                              </div>
                              <div className="text-gray-500 text-sm">
                                {booking.date_time ? format(new Date(booking.date_time), 'HH:mm') : 'No time'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-base flex items-center">
                              <User className="h-3 w-3 mr-2 text-gray-400" />
                              {booking.first_name} {booking.last_name}
                            </div>
                            {booking.phone_number && (
                              <button 
                                onClick={() => handlePhoneClick(booking.phone_number)}
                                className="text-sm text-blue-600 hover:text-blue-800 underline"
                              >
                                {booking.phone_number}
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start space-x-2 max-w-48">
                            <MapPin className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
                            <div className="text-sm text-gray-700 leading-tight">
                              <div>{booking.address}</div>
                              {booking.postcode && (
                                <div className="text-gray-500 font-medium">{booking.postcode}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {booking.form_name || 'Standard Cleaning'}
                            </span>
                            {booking.booking_status && (
                              <div>{getStatusBadge(booking.booking_status)}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Banknote className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600 text-base">
                              £{booking.cleaner_pay?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center space-x-2">
                            {shouldShowCompleteButton(booking) && (
                              <Button
                                onClick={() => onMarkAsCompleted(booking.id)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Complete
                              </Button>
                            )}
                            {shouldShowDropOffButton(booking) && (
                              <Button
                                onClick={() => handleDropOffClick(booking.id)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <UserX className="h-3 w-3 mr-1" />
                                Drop Off
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={dropOffBookingId !== null} onOpenChange={() => setDropOffBookingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Drop Off Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to drop off this booking? It will no longer be assigned to you and will become available for other cleaners to pick up.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDropOff}
              className="bg-red-600 hover:bg-red-700"
            >
              <UserX className="h-4 w-4 mr-2" />
              Drop Off Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BookingsTable;
