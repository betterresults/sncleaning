
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format, isValid } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Home, 
  Info, 
  Key, 
  Car,
  Users,
  Briefcase,
  Timer
} from 'lucide-react';
import { Booking } from './types';

interface ViewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
}

const ViewBookingDialog: React.FC<ViewBookingDialogProps> = ({
  open,
  onOpenChange,
  booking,
}) => {
  if (!booking) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
            <Briefcase className="h-5 w-5" />
            Booking Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Info */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-semibold">
                      {booking.date_time && isValid(new Date(booking.date_time)) 
                        ? format(new Date(booking.date_time), 'EEEE, do MMMM yyyy') 
                        : 'Date not available'}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {booking.date_time && isValid(new Date(booking.date_time))
                        ? format(new Date(booking.date_time), 'HH:mm') 
                        : 'Time not available'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(booking.booking_status || 'Unknown')}
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-blue-600" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <User className="h-3 w-3 text-gray-400" />
                    <div className="font-medium">{booking.first_name} {booking.last_name}</div>
                  </div>
                  
                  {booking.phone_number && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <a 
                        href={`tel:${booking.phone_number}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {booking.phone_number}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Property Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Home className="h-3 w-3 text-gray-400 mt-0.5" />
                    <div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.postcode)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {booking.address}
                      </a>
                      {booking.postcode && (
                        <div className="text-sm text-gray-500 font-medium">{booking.postcode}</div>
                      )}
                    </div>
                  </div>
                  
                  {booking.occupied && (
                    <div className="flex items-center gap-3">
                      <Users className="h-3 w-3 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">Occupancy</div>
                        <div className="text-sm text-gray-600">{booking.occupied}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Service Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4 text-blue-600" />
                Service Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-500">Service Type</div>
                  <div className="font-medium">{booking.cleaning_type || 'Standard Cleaning'}</div>
                </div>
                
                {booking.total_hours && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      Duration
                    </div>
                    <div className="font-medium">{booking.total_hours} hours</div>
                  </div>
                )}

                {booking.cleaning_type && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500">Cleaning Type</div>
                    <div className="font-medium">{booking.cleaning_type}</div>
                  </div>
                )}
              </div>

              {booking.frequently && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-500">Frequency</div>
                  <div className="font-medium">{booking.frequently}</div>
                </div>
              )}

              {booking.first_cleaning && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-500">First Cleaning</div>
                  <div className="font-medium">{booking.first_cleaning}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Details */}
          {(booking.additional_details || booking.property_details || booking.exclude_areas || booking.extras) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="h-4 w-4 text-blue-600" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {booking.additional_details && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500">Additional Details</div>
                    <div className="text-sm bg-gray-50 p-2 rounded">{booking.additional_details}</div>
                  </div>
                )}

                {booking.property_details && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500">Property Details</div>
                    <div className="text-sm bg-gray-50 p-2 rounded">{booking.property_details}</div>
                  </div>
                )}

                {booking.exclude_areas && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500">Areas to Exclude</div>
                    <div className="text-sm bg-gray-50 p-2 rounded">{booking.exclude_areas}</div>
                  </div>
                )}

                {booking.extras && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500">Extras</div>
                    <div className="text-sm bg-gray-50 p-2 rounded">{booking.extras}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Access & Parking */}
          {(booking.key_collection || booking.access || booking.parking_details) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Key className="h-4 w-4 text-blue-600" />
                  Access & Parking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {booking.key_collection && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Key className="h-3 w-3" />
                      Key Collection
                    </div>
                    <div className="text-sm bg-gray-50 p-2 rounded">{booking.key_collection}</div>
                  </div>
                )}

                {booking.access && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500">Access Instructions</div>
                    <div className="text-sm bg-gray-50 p-2 rounded">{booking.access}</div>
                  </div>
                )}

                {booking.parking_details && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      Parking Details
                    </div>
                    <div className="text-sm bg-gray-50 p-2 rounded">{booking.parking_details}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewBookingDialog;
