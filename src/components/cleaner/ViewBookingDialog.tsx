
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Briefcase className="h-6 w-6" />
            Booking Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-semibold text-lg">
                      {booking.date_time ? format(new Date(booking.date_time), 'EEEE, do MMMM yyyy') : 'No date'}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {booking.date_time ? format(new Date(booking.date_time), 'HH:mm') : 'No time'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(booking.booking_status || 'Unknown')}
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-blue-600" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium">{booking.first_name} {booking.last_name}</div>
                    </div>
                  </div>
                  
                  {booking.phone_number && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div className="text-sm">{booking.phone_number}</div>
                    </div>
                  )}
                  
                  {booking.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div className="text-sm">{booking.email}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Property Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Home className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium">{booking.address}</div>
                      {booking.postcode && (
                        <div className="text-sm text-gray-500 font-medium">{booking.postcode}</div>
                      )}
                    </div>
                  </div>
                  
                  {booking.occupied && (
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-gray-400" />
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-blue-600" />
                Service Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">Service Type</div>
                  <div className="font-medium">{booking.form_name || 'Standard Cleaning'}</div>
                </div>
                
                {booking.hours_required && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      Duration
                    </div>
                    <div className="font-medium">{booking.hours_required} hours</div>
                  </div>
                )}

                {booking.cleaning_type && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-500">Cleaning Type</div>
                    <div className="font-medium">{booking.cleaning_type}</div>
                  </div>
                )}
              </div>

              {booking.frequently && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">Frequency</div>
                  <div className="font-medium">{booking.frequently}</div>
                </div>
              )}

              {booking.first_cleaning && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">First Cleaning</div>
                  <div className="font-medium">{booking.first_cleaning}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Details */}
          {(booking.additional_details || booking.property_details || booking.exclude_areas || booking.extras) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5 text-blue-600" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.additional_details && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-500">Additional Details</div>
                    <div className="text-sm bg-gray-50 p-3 rounded-lg">{booking.additional_details}</div>
                  </div>
                )}

                {booking.property_details && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-500">Property Details</div>
                    <div className="text-sm bg-gray-50 p-3 rounded-lg">{booking.property_details}</div>
                  </div>
                )}

                {booking.exclude_areas && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-500">Areas to Exclude</div>
                    <div className="text-sm bg-gray-50 p-3 rounded-lg">{booking.exclude_areas}</div>
                  </div>
                )}

                {booking.extras && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-500">Extras</div>
                    <div className="text-sm bg-gray-50 p-3 rounded-lg">{booking.extras}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Access & Parking */}
          {(booking.key_collection || booking.access || booking.parking_details) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Key className="h-5 w-5 text-blue-600" />
                  Access & Parking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.key_collection && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Key className="h-3 w-3" />
                      Key Collection
                    </div>
                    <div className="text-sm bg-gray-50 p-3 rounded-lg">{booking.key_collection}</div>
                  </div>
                )}

                {booking.access && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-500">Access Instructions</div>
                    <div className="text-sm bg-gray-50 p-3 rounded-lg">{booking.access}</div>
                  </div>
                )}

                {booking.parking_details && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      Parking Details
                    </div>
                    <div className="text-sm bg-gray-50 p-3 rounded-lg">{booking.parking_details}</div>
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
