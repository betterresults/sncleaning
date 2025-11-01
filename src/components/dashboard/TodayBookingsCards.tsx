import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, Copy, X, UserPlus, DollarSign, Repeat, MoreHorizontal, Clock, MapPin, User, Mail, Phone, Send, Calendar } from 'lucide-react';
import PaymentStatusIndicator from '@/components/payments/PaymentStatusIndicator';
import ManualPaymentDialog from '@/components/payments/ManualPaymentDialog';
import { InvoilessPaymentDialog } from '@/components/payments/InvoilessPaymentDialog';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AuthorizeRemainingAmountDialog } from '@/components/payments/AuthorizeRemainingAmountDialog';

import EditBookingDialog from './EditBookingDialog';
import AssignCleanerDialog from './AssignCleanerDialog';
import DuplicateBookingDialog from './DuplicateBookingDialog';
import ConvertToRecurringDialog from './ConvertToRecurringDialog';
import ManualEmailDialog from './ManualEmailDialog';
import { useServiceTypes, getServiceTypeBadgeColor as getBadgeColor } from '@/hooks/useCompanySettings';

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
  payment_method?: string;
  invoice_id?: string | null;
  invoice_link?: string | null;
  cleaner: number | null;
  customer: number;
  cleaner_pay: number | null;
  total_hours: number | null;
  linen_management?: boolean;
  additional_details?: string;
  frequently?: string;
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

interface TodayBookingsCardsProps {
  dashboardDateFilter?: {
    dateFrom: string;
    dateTo: string;
  };
}

const TodayBookingsCards = ({ dashboardDateFilter }: TodayBookingsCardsProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<Booking | null>(null);
  const [assignCleanerOpen, setAssignCleanerOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [selectedBookingForDuplicate, setSelectedBookingForDuplicate] = useState<Booking | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);
  const [convertToRecurringOpen, setConvertToRecurringOpen] = useState(false);
  const [selectedBookingForRecurring, setSelectedBookingForRecurring] = useState<Booking | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedBookingForEmail, setSelectedBookingForEmail] = useState<Booking | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
  const [invoilessDialogOpen, setInvoilessDialogOpen] = useState(false);
  const [selectedBookingForInvoiless, setSelectedBookingForInvoiless] = useState<Booking | null>(null);
  const { toast } = useToast();
  
  // Fetch service types for badge colors
  const { data: serviceTypes } = useServiceTypes();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let bookingsQuery = supabase
        .from('bookings')
        .select(`
          *,
          cleaners!bookings_cleaner_fkey (
            id,
            first_name,
            last_name
          ),
          customers!bookings_customer_fkey (
            id,
            first_name,
            last_name
          )
        `);

      if (dashboardDateFilter) {
        bookingsQuery = bookingsQuery
          .gte('date_time', dashboardDateFilter.dateFrom)
          .lte('date_time', dashboardDateFilter.dateTo);
      } else {
        bookingsQuery = bookingsQuery.gte('date_time', new Date().toISOString());
      }

      const { data: bookingsData, error: bookingsError } = await bookingsQuery
        .order('date_time', { ascending: true });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setError('Failed to load bookings: ' + bookingsError.message);
        return;
      }

      setBookings(bookingsData || []);
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setCurrentPage(1); // Reset to page 1 when filter changes
  }, [dashboardDateFilter]);

  const handleEdit = (bookingId: number) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBookingForEdit(booking);
      setEditDialogOpen(true);
    }
  };

  const handleDuplicate = (booking: Booking) => {
    setSelectedBookingForDuplicate(booking);
    setDuplicateDialogOpen(true);
  };

  const handleAssignCleaner = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setAssignCleanerOpen(true);
  };

  const handleMakeRecurring = (booking: Booking) => {
    setSelectedBookingForRecurring(booking);
    setConvertToRecurringOpen(true);
  };

  const handleSendEmail = (booking: Booking) => {
    setSelectedBookingForEmail(booking);
    setShowEmailDialog(true);
  };

  const handlePaymentAction = (booking: Booking) => {
    if (booking.payment_method === 'Invoiless') {
      setSelectedBookingForInvoiless(booking);
      setInvoilessDialogOpen(true);
    } else {
      setSelectedBookingForPayment(booking);
      setPaymentDialogOpen(true);
    }
  };

  const handleCancel = (bookingId: number) => {
    setBookingToCancel(bookingId);
    setCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (!bookingToCancel) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: 'cancelled' })
        .eq('id', bookingToCancel);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      });
      
      fetchData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
    } finally {
      setCancelDialogOpen(false);
      setBookingToCancel(null);
    }
  };

  const handleDelete = (bookingId: number) => {
    setBookingToDelete(bookingId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bookingToDelete) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking deleted successfully",
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({
        title: "Error",
        description: "Failed to delete booking",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
    }
  };

  const getCleanerName = (booking: Booking) => {
    if (booking.cleaners) {
      return `${booking.cleaners.first_name} ${booking.cleaners.last_name}`;
    }
    return 'Unassigned';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="shadow-md">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-4">
        <div className="rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] text-center max-w-sm">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-gray-500" />
          </div>
          <p className="text-base font-semibold text-gray-700 mb-1">No bookings for this period</p>
          <p className="text-xs text-gray-500">Select another period or create a new booking</p>
        </div>
      </div>
    );
  }

  // Pagination: 10 bookings per page
  const itemsPerPage = 10;
  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedBookings = bookings.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {/* Cards View - Current page bookings */}
      {displayedBookings.map((booking) => {
        const isUnsigned = !booking.cleaner;
        const cleanerName = getCleanerName(booking);
        const bookingTime = booking.date_time ? format(new Date(booking.date_time), 'HH:mm') : 'N/A';
        const bookingDate = booking.date_time ? format(new Date(booking.date_time), 'dd MMM') : 'N/A';
        const serviceBadgeColor = serviceTypes ? getBadgeColor(booking.service_type, serviceTypes) : 'bg-gray-500 text-white';

        return (
          <div
            key={booking.id} 
            className="bg-card rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] hover:-translate-y-1 transition-all duration-200 border-0 overflow-hidden"
          >
            <div className="grid grid-cols-[100px_1fr_2fr_15%_15%_12%_8%_40px] items-center gap-4 p-0">
              {/* Time Box */}
              <div className="bg-primary/10 h-full flex items-center justify-center">
                <div className="text-center py-4">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{bookingDate}</div>
                  <div className="text-2xl font-bold text-primary mt-1">{bookingTime}</div>
                </div>
              </div>

              {/* Customer Name */}
              <div className="py-4">
                <h3 className="text-lg font-bold text-foreground leading-tight">
                  {booking.first_name} {booking.last_name}
                </h3>
              </div>

              {/* Address */}
              <div className="py-4 min-w-0">
                <div className="flex items-start gap-1.5 text-base text-foreground">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                  <div className="leading-tight min-w-0">
                    <div className="font-medium truncate">{booking.address}</div>
                    <div className="text-sm text-muted-foreground">{booking.postcode}</div>
                  </div>
                </div>
              </div>

              {/* Service Type Badge */}
              <div className="py-4">
                <Badge className={`${serviceBadgeColor} text-sm font-medium px-3 py-1.5 rounded-full`}>
                  {booking.service_type}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">{booking.cleaning_type}</p>
              </div>

              {/* Cleaner Info */}
              <div className="py-4">
                {!isUnsigned ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-green-500/90 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-base font-bold text-foreground truncate">{cleanerName}</span>
                    </div>
                    {booking.cleaner_pay && (
                      <p className="text-base font-bold text-foreground pl-9">
                        £{booking.cleaner_pay.toFixed(2)}
                      </p>
                    )}
                  </div>
                ) : (
                  <Badge variant="destructive" className="text-sm font-medium px-3 py-1.5">
                    Unassigned
                  </Badge>
                )}
              </div>

              {/* Payment Status */}
              <div className="py-4 flex justify-center">
                <PaymentStatusIndicator 
                  status={booking.payment_status} 
                  isClickable={true}
                  onClick={() => handlePaymentAction(booking)}
                  size="md"
                />
              </div>

              {/* Total Cost */}
              <div className="py-4 text-right pr-2">
                <span className="text-2xl font-bold text-foreground">
                  £{booking.total_cost?.toFixed(2) || '0.00'}
                </span>
              </div>

              {/* Actions */}
              <div className="bg-accent/30 h-full flex items-center justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-accent">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 z-50 bg-popover">
                    <DropdownMenuItem onClick={() => handleEdit(booking.id)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(booking)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAssignCleaner(booking.id)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assign Cleaner
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMakeRecurring(booking)}>
                      <Repeat className="w-4 h-4 mr-2" />
                      Make Recurring
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSendEmail(booking)}>
                      <Send className="w-4 h-4 mr-2" />
                      Send Email
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handlePaymentAction(booking)}>
                      <DollarSign className="w-4 h-4 mr-2" />
                      {booking.payment_method === 'Invoiless' ? 'Manage Invoice' : 'Manage Payment'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleCancel(booking.id)} className="text-orange-600">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(booking.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Hidden but functional */}
              <div className="hidden">
                <AuthorizeRemainingAmountDialog
                  booking={booking}
                  onSuccess={fetchData}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, bookings.length)} of {bookings.length} bookings
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2 px-4">
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* All Dialogs */}
      <EditBookingDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        booking={selectedBookingForEdit}
        onBookingUpdated={fetchData}
      />

      <AssignCleanerDialog
        bookingId={selectedBookingId}
        open={assignCleanerOpen}
        onOpenChange={setAssignCleanerOpen}
        onSuccess={fetchData}
      />

      <DuplicateBookingDialog
        booking={selectedBookingForDuplicate}
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        onSuccess={fetchData}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This will mark the booking as cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelDialogOpen(false)}>
              No, Keep Booking
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-orange-600 hover:bg-orange-700">
              Yes, Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConvertToRecurringDialog
        open={convertToRecurringOpen}
        onOpenChange={setConvertToRecurringOpen}
        booking={selectedBookingForRecurring}
        onSuccess={fetchData}
      />

      <ManualPaymentDialog
        booking={selectedBookingForPayment}
        isOpen={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          setSelectedBookingForPayment(null);
        }}
        onSuccess={() => {
          fetchData();
          setPaymentDialogOpen(false);
          setSelectedBookingForPayment(null);
        }}
      />

      <InvoilessPaymentDialog
        booking={selectedBookingForInvoiless || {} as any}
        isOpen={invoilessDialogOpen}
        bookingType="upcoming"
        onClose={() => {
          setInvoilessDialogOpen(false);
          setSelectedBookingForInvoiless(null);
        }}
        onSuccess={() => {
          fetchData();
          setInvoilessDialogOpen(false);
          setSelectedBookingForInvoiless(null);
        }}
      />

      {selectedBookingForEmail && (
        <ManualEmailDialog
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          booking={selectedBookingForEmail}
        />
      )}
    </div>
  );
};

export default TodayBookingsCards;
