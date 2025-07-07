
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, Upload, Eye } from 'lucide-react';
import ViewBookingDialog from './ViewBookingDialog';
import CleaningPhotosUploadDialog from './CleaningPhotosUploadDialog';

interface Booking {
  id: number;
  date_time: string;
  address: string;
  postcode: string;
  service_type: string;
  total_hours: number;
  total_cost: number;
  booking_status: string;
  customer: number;
  cleaner: number;
  first_name?: string;
  last_name?: string;
}

interface BookingsTableProps {
  bookings: Booking[];
  title: string;
  type: 'upcoming' | 'available' | 'past';
  onMarkCompleted?: (bookingId: number) => void;
  onAcceptBooking?: (bookingId: number) => void;
}

const BookingsTable = ({ bookings, title, type, onMarkCompleted, onAcceptBooking }: BookingsTableProps) => {
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
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      
      <div className="divide-y">
        {bookings.map((booking) => (
          <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <Badge variant={
                    booking.booking_status === 'Confirmed' ? 'default' : 
                    booking.booking_status === 'Pending' ? 'secondary' : 'outline'
                  }>
                    {booking.booking_status}
                  </Badge>
                  <h3 className="font-semibold text-lg">{booking.service_type}</h3>
                  <span className="text-xl font-bold text-green-600">£{booking.total_cost}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span>{new Date(booking.date_time).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span>
                      {new Date(booking.date_time).toLocaleTimeString('en-GB', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })} ({booking.total_hours}h)
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <span className="truncate">{booking.address}, {booking.postcode}</span>
                  </div>
                </div>

                {booking.first_name && booking.last_name && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <User className="h-4 w-4 text-green-500" />
                    <span>{booking.first_name} {booking.last_name}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewBooking(booking)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>

                {type === 'upcoming' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUploadPhotos(booking)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border-blue-200"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Upload Photos
                    </Button>
                    
                    {onMarkCompleted && (
                      <Button
                        size="sm"
                        onClick={() => onMarkCompleted(booking.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Mark Complete
                      </Button>
                    )}
                  </>
                )}

                {type === 'available' && onAcceptBooking && (
                  <Button
                    size="sm"
                    onClick={() => onAcceptBooking(booking.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Accept Booking
                  </Button>
                )}
              </div>
            </div>
          </div>
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
