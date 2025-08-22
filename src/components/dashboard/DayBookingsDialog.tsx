import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Clock, MapPin, User, Mail, Phone, Banknote, Edit, Copy, UserPlus, Repeat, DollarSign, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PaymentStatusIndicator from '@/components/payments/PaymentStatusIndicator';

interface Booking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  postcode: string;
  cleaning_type: string;
  service_type: string;
  total_cost: number;
  payment_status: string;
  cleaner: number | null;
  customer: number;
  cleaner_pay: number | null;
  total_hours: number | null;
  cleaners?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  customers?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
}

interface DayBookingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  bookings: Booking[];
  onEdit: (bookingId: number) => void;
  onDuplicate: (booking: Booking) => void;
  onAssignCleaner: (bookingId: number) => void;
  onMakeRecurring: (booking: Booking) => void;
  onPaymentAction: (booking: Booking) => void;
  onCancel: (bookingId: number) => void;
  onDelete: (bookingId: number) => void;
  getCleanerName: (booking: Booking) => string;
}

const DayBookingsDialog: React.FC<DayBookingsDialogProps> = ({
  open,
  onOpenChange,
  selectedDate,
  bookings,
  onEdit,
  onDuplicate,
  onAssignCleaner,
  onMakeRecurring,
  onPaymentAction,
  onCancel,
  onDelete,
  getCleanerName,
}) => {
  if (!selectedDate) return null;

  const getPaymentStatusIcon = (status: string, cost: number) => {
    const normalizedStatus = status?.toLowerCase() || 'unpaid';
    
    if (normalizedStatus === 'paid' || normalizedStatus.includes('paid')) {
      return (
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-green-600 text-sm">
            £{cost?.toFixed(2) || '0.00'}
          </span>
        </div>
      );
    } else if (normalizedStatus === 'collecting' || normalizedStatus.includes('collecting')) {
      return (
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-yellow-600 text-sm">
            £{cost?.toFixed(2) || '0.00'}
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-700 text-sm">
            £{cost?.toFixed(2) || '0.00'}
          </span>
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            Bookings for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            <Badge variant="secondary" className="ml-2">
              {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bookings for this day
            </div>
          ) : (
            bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header with customer name and time */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {booking.first_name} {booking.last_name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {format(new Date(booking.date_time), 'h:mm a')}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getPaymentStatusIcon(booking.payment_status, booking.total_cost)}
                          <PaymentStatusIndicator status={booking.payment_status} />
                        </div>
                      </div>

                      {/* Service details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{booking.address}, {booking.postcode}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{getCleanerName(booking)}</span>
                        </div>
                        
                        {booking.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{booking.email}</span>
                          </div>
                        )}
                        
                        {booking.phone_number && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{booking.phone_number}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {booking.cleaning_type || 'Standard Cleaning'}
                          </Badge>
                        </div>
                        
                        {booking.total_hours && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {booking.total_hours}h
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(booking.id)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate(booking)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAssignCleaner(booking.id)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Assign Cleaner
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onMakeRecurring(booking)}>
                            <Repeat className="w-4 h-4 mr-2" />
                            Make Recurring
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onPaymentAction(booking)}>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Manage Payment
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onCancel(booking.id)}
                            className="text-orange-600"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(booking.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DayBookingsDialog;