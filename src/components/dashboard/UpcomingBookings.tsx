
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Phone, Mail, User, Edit, Trash2, UserPlus, Copy } from 'lucide-react';
import { format } from 'date-fns';
import AssignCleanerDialog from './AssignCleanerDialog';
import EditBookingDialog from './EditBookingDialog';
import DuplicateBookingDialog from './DuplicateBookingDialog';

interface Booking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  postcode: string;
  form_name: string;
  total_cost: number;
  booking_status: string;
  cleaner: number | null;
  cleaning_type: string;
  payment_status: string;
  customer: number;
  additional_details?: string;
  property_details?: string;
  frequently?: string;
  first_cleaning?: string;
  occupied?: string;
  hours_required?: number;
  total_hours?: number;
  ironing_hours?: number;
  cleaning_time?: number;
  carpet_items?: string;
  exclude_areas?: string;
  upholstery_items?: string;
  mattress_items?: string;
  extras?: string;
  linens?: string;
  ironing?: string;
  parking_details?: string;
  key_collection?: string;
  access?: string;
  agency?: string;
  record_message?: string;
  video_message?: string;
  cost_deduction?: string;
  cleaning_cost_per_visit?: string;
  cleaning_cost_per_hour?: number;
  steam_cleaning_cost?: string;
  deposit?: number;
  oven_size?: string;
  payment_method?: string;
  payment_term?: string;
  cleaner_pay?: number;
  cleaner_rate?: number;
  cleaner_percentage?: number;
  cleaners?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
  };
}

const UpcomingBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          cleaners (
            id,
            first_name,
            last_name,
            full_name
          )
        `)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAssignCleaner = (booking: Booking) => {
    console.log('Assigning cleaner to booking:', booking);
    setSelectedBooking(booking);
    setAssignDialogOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    console.log('Editing booking:', booking);
    setSelectedBooking(booking);
    setEditDialogOpen(true);
  };

  const handleDuplicateBooking = (booking: Booking) => {
    console.log('Duplicating booking:', booking);
    setSelectedBooking(booking);
    setDuplicateDialogOpen(true);
  };

  const handleDeleteBooking = async (bookingId: number) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const { error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', bookingId);

        if (error) {
          console.error('Error deleting booking:', error);
          return;
        }

        fetchBookings();
      } catch (error) {
        console.error('Error deleting booking:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg">Loading bookings...</div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No upcoming bookings found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg mb-2">
                  {booking.first_name} {booking.last_name}
                </CardTitle>
                <div className="flex gap-2 mb-2">
                  <Badge className={getStatusColor(booking.booking_status)}>
                    {booking.booking_status || 'Pending'}
                  </Badge>
                  <Badge className={getPaymentStatusColor(booking.payment_status)}>
                    {booking.payment_status || 'Unpaid'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAssignCleaner(booking)}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditBooking(booking)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicateBooking(booking)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteBooking(booking.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{format(new Date(booking.date_time), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{format(new Date(booking.date_time), 'HH:mm')}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="truncate">{booking.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{booking.phone_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="truncate">{booking.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>
                  {booking.cleaners?.full_name || 'No cleaner assigned'}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Service:</span> {booking.form_name}
              </div>
              <div className="text-lg font-semibold">
                £{booking.total_cost}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <AssignCleanerDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        booking={selectedBooking}
        onSuccess={() => {
          fetchBookings();
          setAssignDialogOpen(false);
          setSelectedBooking(null);
        }}
      />

      <EditBookingDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        booking={selectedBooking}
        onSuccess={() => {
          fetchBookings();
          setEditDialogOpen(false);
          setSelectedBooking(null);
        }}
      />

      <DuplicateBookingDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        booking={selectedBooking}
        onSuccess={() => {
          fetchBookings();
          setDuplicateDialogOpen(false);
          setSelectedBooking(null);
        }}
      />
    </div>
  );
};

export default UpcomingBookings;
