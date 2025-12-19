import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Search, Calendar, MapPin, Loader2 } from 'lucide-react';

interface Booking {
  id: number;
  date_only: string | null;
  address: string | null;
  postcode: string | null;
  service_type: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface BookingSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (bookingId: number | null) => void;
  customerId?: number | null;
}

export const BookingSelectorDialog: React.FC<BookingSelectorDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
  customerId,
}) => {
  const [search, setSearch] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchBookings();
    }
  }, [open, customerId]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('bookings')
        .select('id, date_only, address, postcode, service_type, first_name, last_name')
        .order('date_only', { ascending: false })
        .limit(50);

      if (customerId) {
        query = query.eq('customer', customerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      booking.id.toString().includes(searchLower) ||
      booking.address?.toLowerCase().includes(searchLower) ||
      booking.postcode?.toLowerCase().includes(searchLower) ||
      booking.first_name?.toLowerCase().includes(searchLower) ||
      booking.last_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select Booking</DialogTitle>
          <DialogDescription>
            Search and select a booking to attach to this task
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, address, postcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[300px] border rounded-md">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No bookings found
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredBookings.map((booking) => (
                <button
                  key={booking.id}
                  className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors"
                  onClick={() => {
                    onSelect(booking.id);
                    onOpenChange(false);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">
                        Booking #{booking.id}
                        {booking.first_name && (
                          <span className="ml-2 text-muted-foreground font-normal">
                            {booking.first_name} {booking.last_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {booking.date_only && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(booking.date_only), 'dd MMM yyyy')}
                          </span>
                        )}
                        {booking.service_type && (
                          <span>{booking.service_type}</span>
                        )}
                      </div>
                      {booking.address && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[300px]">
                            {booking.address}{booking.postcode && `, ${booking.postcode}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};