
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

interface PastBooking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  total_cost: string;
  cleaner_pay: number;
  cleaner: number | null;
  payment_status: string;
  cleaner_pay_status: string;
  cleaners?: {
    full_name: string;
  } | null;
}

interface BulkEditPastBookingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const BulkEditPastBookingsDialog: React.FC<BulkEditPastBookingsDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<PastBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<PastBooking[]>([]);
  const [selectedBookings, setSelectedBookings] = useState<number[]>([]);
  const [editType, setEditType] = useState<'total_cost' | 'cleaner_pay' | 'payment_status' | 'cleaner_pay_status'>('total_cost');
  const [newValue, setNewValue] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchPastBookings();
      setSearchTerm('');
      setSelectedBookings([]);
      setNewValue('');
    }
  }, [open]);

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

  const fetchPastBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('past_bookings')
        .select(`
          id,
          date_time,
          first_name,
          last_name,
          total_cost,
          cleaner_pay,
          cleaner,
          payment_status,
          cleaner_pay_status,
          cleaners!past_bookings_cleaner_fkey (
            full_name
          )
        `)
        .order('date_time', { ascending: false });

      if (error) {
        console.error('Error fetching past bookings:', error);
        return;
      }

      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching past bookings:', error);
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

    if (!newValue || newValue.trim() === '') {
      alert('Please enter a valid value.');
      return;
    }

    setLoading(true);

    try {
      let updateData: any = {};
      
      switch (editType) {
        case 'total_cost':
          const costValue = parseFloat(newValue);
          if (isNaN(costValue) || costValue <= 0) {
            alert('Please enter a valid cost amount.');
            setLoading(false);
            return;
          }
          updateData = { total_cost: newValue };
          break;
        case 'cleaner_pay':
          const payValue = parseFloat(newValue);
          if (isNaN(payValue) || payValue < 0) {
            alert('Please enter a valid pay amount.');
            setLoading(false);
            return;
          }
          updateData = { cleaner_pay: payValue };
          break;
        case 'payment_status':
          updateData = { payment_status: newValue };
          break;
        case 'cleaner_pay_status':
          updateData = { cleaner_pay_status: newValue };
          break;
      }
      
      const { error } = await supabase
        .from('past_bookings')
        .update(updateData)
        .in('id', selectedBookings);

      if (error) {
        console.error('Error updating past bookings:', error);
        alert('Error updating past bookings: ' + error.message);
        return;
      }

      console.log(`Successfully updated ${selectedBookings.length} past bookings`);
      onSuccess();
      onOpenChange(false);
      setSelectedBookings([]);
      setNewValue('');
      setSearchTerm('');
    } catch (error) {
      console.error('Error updating past bookings:', error);
      alert('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getFieldLabel = () => {
    switch (editType) {
      case 'total_cost': return 'Total Cost';
      case 'cleaner_pay': return 'Cleaner Pay';
      case 'payment_status': return 'Client Payment Status';
      case 'cleaner_pay_status': return 'Cleaner Payment Status';
      default: return 'Value';
    }
  };

  const getInputType = () => {
    return (editType === 'payment_status' || editType === 'cleaner_pay_status') ? 'select' : 'number';
  };

  const renderValueInput = () => {
    if (editType === 'payment_status') {
      return (
        <Select value={newValue} onValueChange={setNewValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Not Paid">Not Paid</SelectItem>
            <SelectItem value="In Process">In Process</SelectItem>
            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
            <SelectItem value="Refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (editType === 'cleaner_pay_status') {
      return (
        <Select value={newValue} onValueChange={setNewValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select cleaner payment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        type="number"
        step="0.01"
        value={newValue}
        onChange={(e) => setNewValue(e.target.value)}
        placeholder={`Enter new ${getFieldLabel().toLowerCase()}`}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Edit Past Bookings</DialogTitle>
          <DialogDescription>
            Search and select past bookings to update their cost, cleaner pay, or payment status
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
              <Select value={editType} onValueChange={(value: 'total_cost' | 'cleaner_pay' | 'payment_status' | 'cleaner_pay_status') => setEditType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total_cost">Total Cost</SelectItem>
                  <SelectItem value="cleaner_pay">Cleaner Pay</SelectItem>
                  <SelectItem value="payment_status">Client Payment Status</SelectItem>
                  <SelectItem value="cleaner_pay_status">Cleaner Payment Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="newValue">New {getFieldLabel()}</Label>
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
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Cleaner Pay</TableHead>
                  <TableHead>Client Payment</TableHead>
                  <TableHead>Cleaner Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      {searchTerm ? 'No bookings match your search' : 'No past bookings found'}
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
                        £{typeof booking.total_cost === 'string' ? parseFloat(booking.total_cost).toFixed(2) : '0.00'}
                      </TableCell>
                      <TableCell className="font-medium">
                        £{booking.cleaner_pay?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          booking.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
                          booking.payment_status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.payment_status || 'Not Paid'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          booking.cleaner_pay_status === 'Paid' ? 'bg-green-100 text-green-800' :
                          booking.cleaner_pay_status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.cleaner_pay_status || 'Unpaid'}
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

export default BulkEditPastBookingsDialog;
