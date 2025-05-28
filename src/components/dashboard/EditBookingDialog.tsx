
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

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
}

interface EditBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  onSuccess: () => void;
}

const EditBookingDialog: React.FC<EditBookingDialogProps> = ({
  open,
  onOpenChange,
  booking,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [cleaners, setCleaners] = useState<{ id: number; full_name: string }[]>([]);
  const [formData, setFormData] = useState({
    date_time: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    postcode: '',
    total_cost: 0,
    cleaner: null as number | null,
    payment_status: '',
    additional_details: '',
  });

  useEffect(() => {
    console.log('Booking data received in EditBookingDialog:', booking);
    if (booking && open) {
      const formattedDateTime = booking.date_time 
        ? format(new Date(booking.date_time), "yyyy-MM-dd'T'HH:mm")
        : '';
      
      // Map payment status correctly
      let mappedPaymentStatus = 'unpaid';
      if (booking.payment_status) {
        const status = booking.payment_status.toLowerCase().replace(/\s+/g, '');
        if (status === 'paid') mappedPaymentStatus = 'paid';
        else if (status === 'notpaid') mappedPaymentStatus = 'unpaid';
        else if (status === 'pending') mappedPaymentStatus = 'pending';
      }
      
      const newFormData = {
        date_time: formattedDateTime,
        first_name: booking.first_name || '',
        last_name: booking.last_name || '',
        email: booking.email || '',
        phone_number: booking.phone_number || '',
        address: booking.address || '',
        postcode: booking.postcode || '',
        total_cost: Number(booking.total_cost) || 0,
        cleaner: booking.cleaner,
        payment_status: mappedPaymentStatus,
        additional_details: booking.additional_details || '',
      };

      console.log('Setting form data with:', newFormData);
      setFormData(newFormData);
    }
  }, [booking, open]);

  useEffect(() => {
    const fetchCleaners = async () => {
      const { data } = await supabase
        .from('cleaners')
        .select('id, full_name')
        .order('full_name');
      
      if (data) {
        setCleaners(data);
      }
    };

    if (open) {
      fetchCleaners();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          date_time: formData.date_time,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone_number: formData.phone_number,
          address: formData.address,
          postcode: formData.postcode,
          total_cost: formData.total_cost,
          cleaner: formData.cleaner,
          payment_status: formData.payment_status,
          additional_details: formData.additional_details,
        })
        .eq('id', booking.id);

      if (error) {
        console.error('Error updating booking:', error);
        return;
      }

      console.log('Booking updated successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating booking:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>
            Update booking details for {booking?.first_name} {booking?.last_name}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                value={formData.postcode}
                onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="date_time">Date & Time</Label>
              <Input
                id="date_time"
                type="datetime-local"
                value={formData.date_time}
                onChange={(e) => setFormData({ ...formData, date_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total_cost">Total Cost (£)</Label>
              <Input
                id="total_cost"
                type="number"
                step="0.01"
                value={formData.total_cost}
                onChange={(e) => setFormData({ ...formData, total_cost: Number(e.target.value) })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select 
                value={formData.payment_status} 
                onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="cleaner">Assign Cleaner</Label>
            <Select 
              value={formData.cleaner?.toString() || ''} 
              onValueChange={(value) => setFormData({ ...formData, cleaner: value === '' ? null : Number(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a cleaner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No cleaner assigned</SelectItem>
                {cleaners.map((cleaner) => (
                  <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                    {cleaner.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="additional_details">Additional Details</Label>
            <Textarea
              id="additional_details"
              value={formData.additional_details}
              onChange={(e) => setFormData({ ...formData, additional_details: e.target.value })}
              placeholder="Any additional notes or details..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Booking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBookingDialog;
