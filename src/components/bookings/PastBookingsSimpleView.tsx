import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Edit, MoreHorizontal, Clock, MapPin, User } from "lucide-react";
import { format, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import PaymentStatusIndicator from "@/components/payments/PaymentStatusIndicator";
import ManualPaymentDialog from "@/components/payments/ManualPaymentDialog";
import { InvoilessPaymentDialog } from "@/components/payments/InvoilessPaymentDialog";
import EditPastBookingDialog from '../dashboard/EditPastBookingDialog';
import AssignCleanerDialog from '../dashboard/AssignCleanerDialog';
import { useServiceTypes, useCleaningTypes, getServiceTypeBadgeColor as getBadgeColor } from '@/hooks/useCompanySettings';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Booking {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_time: string;
  address: string;
  postcode: string;
  service_type: string;
  cleaning_type: string;
  total_cost: string;
  payment_status: string;
  payment_method?: string;
  invoice_id?: string | null;
  invoice_link?: string | null;
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
  [key: string]: any;
}

interface PastBookingsSimpleViewProps {
  onTimeRangeChange?: (value: string) => void;
  timeRangeFilter?: string;
}

export function PastBookingsSimpleView({
  onTimeRangeChange,
  timeRangeFilter = "last-month"
}: PastBookingsSimpleViewProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookings, setSelectedBookings] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [cleaningTypeFilter, setCleaningTypeFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  
  // Dialog states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignCleanerOpen, setAssignCleanerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoilessDialogOpen, setInvoilessDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Fetch service/cleaning types for labels and badge colors
  const { data: serviceTypes } = useServiceTypes();
  const { data: cleaningTypes } = useCleaningTypes();

  useEffect(() => {
    fetchData();
  }, [timeRangeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on timeRangeFilter
      let startDate: Date;
      const endDate = new Date(); // Today
      
      switch(timeRangeFilter) {
        case 'last-month':
          startDate = subMonths(endDate, 1);
          break;
        case 'last-3-months':
          startDate = subMonths(endDate, 3);
          break;
        case 'last-6-months':
          startDate = subMonths(endDate, 6);
          break;
        case 'all-time':
        default:
          startDate = new Date('2020-01-01'); // Far back date for all-time
          break;
      }
      
      // Start with a base query
      let query = supabase
        .from('past_bookings')
        .select(`
          *,
          cleaners:cleaner(id, first_name, last_name),
          customers:customer(id, first_name, last_name)
        `)
        .gte('date_time', startDate.toISOString())
        .lte('date_time', endDate.toISOString())
        .order('date_time', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching past bookings:', error);
        toast({
          title: "Error",
          description: "Failed to load past bookings",
          variant: "destructive"
        });
        return;
      }

      // Fetch all cleaners and customers to populate the booking data
      const { data: allCleaners } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name');

      const { data: allCustomers } = await supabase
        .from('customers')
        .select('id, first_name, last_name');

      // Map cleaner and customer data to bookings
      const bookingsWithRelations = (data || []).map((booking: any) => ({
        ...booking,
        cleaners: booking.cleaner 
          ? allCleaners?.find((c) => c.id === booking.cleaner) || null
          : null,
        customers: booking.customer
          ? allCustomers?.find((c) => c.id === booking.customer) || null
          : null
      }));

      setBookings(bookingsWithRelations);
    } catch (error) {
      console.error('Error in fetchData:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map(b => b.id));
    }
  };

  const handleSelectBooking = (bookingId: number) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId)
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const handleBulkEdit = () => {
    if (selectedBookings.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one booking to edit",
        variant: "destructive"
      });
      return;
    }
    navigate('/bulk-edit-bookings', { 
      state: { 
        bookingIds: selectedBookings,
        bookingType: 'past'
      } 
    });
  };

  const handleEdit = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditDialogOpen(true);
  };

  const handleAssignCleaner = (booking: Booking) => {
    setSelectedBooking(booking);
    setAssignCleanerOpen(true);
  };

  const handlePaymentAction = (booking: Booking) => {
    setSelectedBooking(booking);
    if (booking.payment_method === 'Invoiless') {
      setInvoilessDialogOpen(true);
    } else {
      setPaymentDialogOpen(true);
    }
  };

  const handleDelete = (booking: Booking) => {
    setSelectedBooking(booking);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedBooking) return;

    try {
      const { error } = await supabase
        .from('past_bookings')
        .delete()
        .eq('id', selectedBooking.id);

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
      setSelectedBooking(null);
    }
  };

  const handleDialogSuccess = () => {
    fetchData();
    setSelectedBooking(null);
    setEditDialogOpen(false);
    setAssignCleanerOpen(false);
    setPaymentDialogOpen(false);
    setInvoilessDialogOpen(false);
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const customerName = `${booking.first_name} ${booking.last_name}`.toLowerCase();
      if (!customerName.includes(search) && 
          !booking.email?.toLowerCase().includes(search) &&
          !booking.address?.toLowerCase().includes(search)) {
        return false;
      }
    }

    // Service type filter
    if (serviceTypeFilter !== "all" && booking.service_type !== serviceTypeFilter) {
      return false;
    }

    // Cleaning type filter
    if (cleaningTypeFilter !== "all" && booking.cleaning_type !== cleaningTypeFilter) {
      return false;
    }

    // Payment status filter
    if (paymentStatusFilter !== "all" && booking.payment_status !== paymentStatusFilter) {
      return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card p-4 rounded-lg border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Time Range */}
          <div className="space-y-2">
            <Label>Time Range</Label>
            <Select value={timeRangeFilter} onValueChange={onTimeRangeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                <SelectItem value="all-time">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name, email..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label>Service Type</Label>
            <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                <SelectItem value="domestic">Domestic</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="airbnb">Airbnb</SelectItem>
                <SelectItem value="end_of_tenancy">End of Tenancy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cleaning Type */}
          <div className="space-y-2">
            <Label>Cleaning Type</Label>
            <Select value={cleaningTypeFilter} onValueChange={setCleaningTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="standard_cleaning">Standard</SelectItem>
                <SelectItem value="deep_cleaning">Deep</SelectItem>
                <SelectItem value="one_off">One-off</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <Label>Payment Status</Label>
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="Collecting">Collecting</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedBookings.length > 0 && (
        <div className="sticky top-0 z-10 bg-accent border rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {selectedBookings.length} booking{selectedBookings.length !== 1 ? 's' : ''} selected
            </span>
            <Button
              onClick={() => setSelectedBookings([])}
              variant="ghost"
              size="sm"
            >
              Clear Selection
            </Button>
          </div>
          <Button
            onClick={handleBulkEdit}
            variant="default"
            size="sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            Bulk Edit
          </Button>
        </div>
      )}

      {/* Select All Checkbox */}
      <div className="flex items-center gap-2 px-2">
        <Checkbox
          checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
          onCheckedChange={handleSelectAll}
        />
        <span className="text-sm text-muted-foreground">
          Select All ({filteredBookings.length})
        </span>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No past bookings found for this period
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking: any) => (
            <div key={booking.id} className="flex items-start gap-3">
              <div className="pt-6">
                <Checkbox
                  checked={selectedBookings.includes(booking.id)}
                  onCheckedChange={() => handleSelectBooking(booking.id)}
                />
              </div>
              <div className="flex-1">
                <BookingCard
                  booking={booking}
                  onViewDetails={() => handleViewDetails(booking)}
                  onEdit={() => handleOpenActions(booking)}
                  onDelete={() => handleOpenDelete(booking)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      {selectedBooking && (
        <>
          <BookingDetailsDialog
            booking={selectedBooking}
            open={detailsDialogOpen}
            onClose={() => {
              setDetailsDialogOpen(false);
              setSelectedBooking(null);
            }}
          />

          <BookingActionsDialog
            booking={selectedBooking}
            open={actionsDialogOpen}
            onClose={() => {
              setActionsDialogOpen(false);
              setSelectedBooking(null);
            }}
            onSuccess={handleActionSuccess}
            bookingType="past"
          />

          <DeleteBookingDialog
            booking={selectedBooking}
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setSelectedBooking(null);
            }}
            onSuccess={handleDeleteSuccess}
            bookingType="past"
          />
        </>
      )}
    </div>
  );
}
