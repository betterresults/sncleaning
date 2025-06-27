
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import { format } from 'date-fns';

interface Booking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  total_cost: number;
  cleaner_pay: number;
  cleaner: number | null;
  total_hours: number;
  cleaner_rate: number;
  cleaner_percentage: number;
  payment_status: string;
  cleaners?: {
    full_name: string;
  } | null;
}

interface BulkEditBookingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const BulkEditBookingsDialog: React.FC<BulkEditBookingsDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedBookings, setSelectedBookings] = useState<number[]>([]);
  const [editType, setEditType] = useState<'cost' | 'cleaner_pay' | 'hourly_rate' | 'percentage' | 'payment_status'>('cost');
  const [newValue, setNewValue] = useState<number | string>(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchBookings();
      setSearchTerm('');
      setSelectedBookings([]);
      setNewValue(editType === 'payment_status' ? 'Paid' : 0);
    }
  }, [open]);

  useEffect(() => {
    // Reset newValue when editType changes
    setNewValue(editType === 'payment_status' ? 'Paid' : 0);
  }, [editType]);

  useEffect(() => {
    // Filter bookings based on search term
    if (!searchTerm.trim()) {
      setFilteredBookings(bookings);
    } else {
      const filtered = bookings.filter(booking => {
        const customerName = `${booking.first_name} ${booking.last_name}`.toLowerCase();
        const cleanerName = booking.cleaners?.full_name?.toLowerCase() || '';
        const dateString = booking.date_time ? format(new Date(booking.date_time), 'dd/MM/yyyy') : '';
        
        return customerName.includes(searchTerm.toLowerCase()) ||
               cleanerName.includes(searchTerm.toLowerCase()) ||
               dateString.includes(searchTerm.toLowerCase());
      });
      setFilteredBookings(filtered);
    }
  }, [bookings, searchTerm]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          date_time,
          first_name,
          last_name,
          total_cost,
          cleaner_pay,
          cleaner,
          total_hours,
          cleaner_rate,
          cleaner_percentage,
          payment_status,
          cleaners!bookings_cleaner_fkey (
            full_name
          )
        `)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true });

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleBookingSelect = (bookingId: number, checked: boolean) => {
    if (checked) {
      setSelectedBookings([...selectedBookings, bookingId]);
    } else {
      setSelectedBookings(selectedBookings.filter(id => id !== bookingId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(filteredBookings.map(b => b.id));
    } else {
      setSelectedBookings([]);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedBookings.length === 0) {
      alert('Please select at least one booking to update.');
      return;
    }

    if (editType !== 'payment_status' && (!newValue || Number(newValue) <= 0)) {
      alert('Please enter a valid value.');
      return;
    }

    if (editType === 'payment_status' && !newValue) {
      alert('Please select a payment status.');
      return;
    }

    setLoading(true);

    try {
      let updateData: any = {};
      
      switch (editType) {
        case 'cost':
          updateData = { total_cost: Number(newValue) };
          break;
        case 'cleaner_pay':
          updateData = { cleaner_pay: Number(newValue) };
          break;
        case 'hourly_rate':
          updateData = { cleaner_rate: Number(newValue) };
          break;
        case 'percentage':
          updateData = { cleaner_percentage: Number(newValue) };
          break;
        case 'payment_status':
          updateData = { payment_status: newValue };
          break;
      }
      
      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .in('id', selectedBookings);

      if (error) {
        console.error('Error updating bookings:', error);
        alert('Error updating bookings: ' + error.message);
        return;
      }

      console.log(`Successfully updated ${selectedBookings.length} bookings`);
      onSuccess();
      onOpenChange(false);
      setSelectedBookings([]);
      setNewValue(editType === 'payment_status' ? 'Paid' : 0);
      setSearchTerm('');
    } catch (error) {
      console.error('Error updating bookings:', error);
      alert('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getFieldLabel = () => {
    switch (editType) {
      case 'cost': return 'Total Cost';
      case 'cleaner_pay': return 'Cleaner Pay';
      case 'hourly_rate': return 'Hourly Rate';
      case 'percentage': return 'Percentage';
      case 'payment_status': return 'Payment Status';
      default: return 'Value';
    }
  };

  const getFieldUnit = () => {
    switch (editType) {
      case 'percentage': return '%';
      case 'payment_status': return '';
      default: return '£';
    }
  };

  const renderValueInput = () => {
    if (editType === 'payment_status') {
      return (
        <Select value={newValue as string} onValueChange={(value) => setNewValue(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
            <SelectItem value="Not Paid">Not Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        id="newValue"
        type="number"
        step={editType === 'percentage' ? '1' : '0.01'}
        value={newValue}
        onChange={(e) => setNewValue(Number(e.target.value))}
        placeholder={`Enter new ${getFieldLabel().toLowerCase()}`}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Edit Bookings</DialogTitle>
          <DialogDescription>
            Search and select bookings to apply changes to their cost, cleaner pay, hourly rate, percentage, or payment status
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by customer name, cleaner, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Bulk Edit Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="editType">What to update</Label>
              <Select value={editType} onValueChange={(value: 'cost' | 'cleaner_pay' | 'hourly_rate' | 'percentage' | 'payment_status') => setEditType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cost">Total Cost</SelectItem>
                  <SelectItem value="cleaner_pay">Cleaner Pay</SelectItem>
                  <SelectItem value="hourly_rate">Hourly Rate</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="payment_status">Payment Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="newValue">New {getFieldLabel()} {getFieldUnit() && `(${getFieldUnit()})`}</Label>
              {renderValueInput()}
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleBulkUpdate} 
                disabled={loading || selectedBookings.length === 0}
                className="w-full"
              >
                {loading ? 'Updating...' : `Update ${selectedBookings.length} booking${selectedBookings.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>

          {/* Results Summary */}
          {searchTerm && (
            <div className="text-sm text-gray-600">
              Showing {filteredBookings.length} of {bookings.length} bookings
              {filteredBookings.length !== bookings.length && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="p-0 h-auto ml-2 text-blue-600"
                >
                  Clear filter
                </Button>
              )}
            </div>
          )}

          {/* Bookings Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Cleaner</TableHead>
                  <TableHead>Current Cost</TableHead>
                  <TableHead>Current Cleaner Pay</TableHead>
                  <TableHead>Hourly Rate</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Payment Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      {searchTerm ? 'No bookings match your search' : 'No upcoming bookings found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedBookings.includes(booking.id)}
                          onCheckedChange={(checked) => handleBookingSelect(booking.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {booking.date_time ? format(new Date(booking.date_time), 'dd/MM/yyyy') : 'No date'}
                          </div>
                          <div className="text-gray-500">
                            {booking.date_time ? format(new Date(booking.date_time), 'HH:mm') : 'No time'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {booking.first_name} {booking.last_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.cleaners?.full_name || 'No cleaner assigned'}
                      </TableCell>
                      <TableCell className="font-medium">
                        £{booking.total_cost?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className="font-medium">
                        £{booking.cleaner_pay?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className="font-medium">
                        £{booking.cleaner_rate?.toFixed(2) || '0.00'}/hr
                      </TableCell>
                      <TableCell className="font-medium">
                        {booking.cleaner_percentage || '0'}%
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          booking.payment_status?.toLowerCase() === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {booking.payment_status || 'Unpaid'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditBookingsDialog;
