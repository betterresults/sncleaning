
import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import ViewBookingDialog from './ViewBookingDialog';
import CleaningPhotosUploadDialog from './CleaningPhotosUploadDialog';
import CleanerBookingCard from './CleanerBookingCard';
import { Booking } from './types';

interface BookingsTableProps {
  bookings: Booking[];
  title: string;
  type: 'upcoming' | 'available' | 'past';
  onAcceptBooking?: (bookingId: number) => void;
  onDropService?: (bookingId: number) => void;
}

const BookingsTable = ({ bookings, title, type, onAcceptBooking, onDropService }: BookingsTableProps) => {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setViewDialogOpen(true);
  };

  const handleUploadPhotos = (booking: Booking) => {
    setSelectedBooking(booking);
    setUploadDialogOpen(true);
  };


  const handleDropService = (booking: Booking) => {
    if (onDropService) {
      onDropService(booking.id);
    }
  };

  const handleAcceptBooking = (booking: Booking) => {
    if (onAcceptBooking) {
      onAcceptBooking(booking.id);
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No {type} bookings found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow w-full overflow-hidden">
      <div className="p-3 sm:p-4 border-b">
        <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
      </div>
      
      <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
        {bookings.map((booking) => (
          <CleanerBookingCard
            key={booking.id}
            booking={booking}
            type={type}
            onViewDetails={handleViewBooking}
            onUploadPhotos={handleUploadPhotos}
            onDropService={handleDropService}
            onAcceptBooking={handleAcceptBooking}
          />
        ))}
      </div>

      {selectedBooking && (
        <>
          <ViewBookingDialog
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            booking={selectedBooking}
          />
          
          <CleaningPhotosUploadDialog
            open={uploadDialogOpen}
            onOpenChange={setUploadDialogOpen}
            booking={selectedBooking}
          />
        </>
      )}
    </div>
  );
};

export default BookingsTable;
