
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, User, MapPin, Home, Banknote, UserCheck } from 'lucide-react';

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [formData, setFormData] = useState({
    // Customer info
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    
    // Address & Access
    address: '',
    postcode: '',
    access: '',
    key_collection: '',
    parking_details: '',
    additional_details: '',
    
    // Cleaning Details
    form_name: '',
    cleaning_type: '',
    hours_required: 0,
    total_hours: 0,
    ironing_hours: 0,
    cleaning_time: 0,
    property_details: '',
    carpet_items: '',
    upholstery_items: '',
    mattress_items: '',
    exclude_areas: '',
    extras: '',
    linens: '',
    ironing: '',
    oven_size: '',
    
    // Payment
    total_cost: 0,
    cleaning_cost_per_hour: 0,
    payment_status: '',
    payment_method: '',
    deposit: 0,
    
    // Cleaner
    cleaner: null as number | null,
    cleaner_pay: 0,
    cleaner_rate: 0,
    cleaner_percentage: 70,
  });

  const timeOptions = [
    '12:00 AM', '12:30 AM', '01:00 AM', '01:30 AM', '02:00 AM', '02:30 AM',
    '03:00 AM', '03:30 AM', '04:00 AM', '04:30 AM', '05:00 AM', '05:30 AM',
    '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
    '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM',
    '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'
  ];

  const serviceTypes = [
    { value: 'Standard Cleaning', label: 'Standard Cleaning' },
    { value: 'Deep Cleaning', label: 'Deep Cleaning' },
    { value: 'End of Tenancy', label: 'End of Tenancy' },
    { value: 'Office Cleaning', label: 'Office Cleaning' },
    { value: 'Carpet Cleaning', label: 'Carpet Cleaning' }
  ];

  const cleaningTypes = [
    { value: 'Domestic', label: 'Domestic' },
    { value: 'Commercial', label: 'Commercial' },
    { value: 'Air BnB', label: 'Air BnB' }
  ];

  const accessOptions = [
    { value: 'customer_present', label: 'Customer will be present' },
    { value: 'key_left', label: 'Key will be left' },
    { value: 'keybox', label: 'Access via keybox' },
    { value: 'estate_agent', label: 'Pick up keys from estate agent' },
    { value: 'other', label: 'Other arrangement' }
  ];

  // Check if service is hourly-based
  const isHourlyService = () => {
    return formData.cleaning_type === 'Domestic' || 
           formData.cleaning_type === 'Air BnB' || 
           formData.cleaning_type === 'Commercial';
  };

  // Calculate total cost automatically for hourly services
  const calculateTotalCost = () => {
    if (isHourlyService() && formData.hours_required > 0 && formData.cleaning_cost_per_hour > 0) {
      return formData.hours_required * formData.cleaning_cost_per_hour;
    }
    return formData.total_cost;
  };

  useEffect(() => {
    if (isHourlyService()) {
      const calculatedCost = calculateTotalCost();
      setFormData(prev => ({ ...prev, total_cost: calculatedCost }));
    }
  }, [formData.hours_required, formData.cleaning_cost_per_hour, formData.cleaning_type]);

  useEffect(() => {
    if (booking && open) {
      const bookingDateTime = booking.date_time ? new Date(booking.date_time) : undefined;
      
      if (bookingDateTime) {
        setSelectedDate(bookingDateTime);
        const hours = bookingDateTime.getHours().toString().padStart(2, '0');
        const minutes = bookingDateTime.getMinutes().toString().padStart(2, '0');
        const period = bookingDateTime.getHours() >= 12 ? 'PM' : 'AM';
        const displayHours = bookingDateTime.getHours() === 0 ? 12 : 
                           bookingDateTime.getHours() > 12 ? bookingDateTime.getHours() - 12 : 
                           bookingDateTime.getHours();
        setSelectedTime(`${displayHours.toString().padStart(2, '0')}:${minutes} ${period}`);
      }

      let mappedPaymentStatus = 'unpaid';
      if (booking.payment_status) {
        const status = booking.payment_status.toLowerCase().replace(/\s+/g, '');
        if (status === 'paid') mappedPaymentStatus = 'paid';
        else if (status === 'notpaid') mappedPaymentStatus = 'unpaid';
        else if (status === 'pending') mappedPaymentStatus = 'pending';
      }

      setFormData({
        first_name: booking.first_name || '',
        last_name: booking.last_name || '',
        email: booking.email || '',
        phone_number: booking.phone_number || '',
        address: booking.address || '',
        postcode: booking.postcode || '',
        access: booking.access || '',
        key_collection: booking.key_collection || '',
        parking_details: booking.parking_details || '',
        additional_details: booking.additional_details || '',
        form_name: booking.form_name || '',
        cleaning_type: booking.cleaning_type || '',
        hours_required: Number(booking.hours_required) || 0,
        total_hours: Number(booking.total_hours) || 0,
        ironing_hours: Number(booking.ironing_hours) || 0,
        cleaning_time: Number(booking.cleaning_time) || 0,
        property_details: booking.property_details || '',
        carpet_items: booking.carpet_items || '',
        upholstery_items: booking.upholstery_items || '',
        mattress_items: booking.mattress_items || '',
        exclude_areas: booking.exclude_areas || '',
        extras: booking.extras || '',
        linens: booking.linens || '',
        ironing: booking.ironing || '',
        oven_size: booking.oven_size || '',
        total_cost: Number(booking.total_cost) || 0,
        cleaning_cost_per_hour: Number(booking.cleaning_cost_per_hour) || 0,
        payment_status: mappedPaymentStatus,
        payment_method: booking.payment_method || '',
        deposit: Number(booking.deposit) || 0,
        cleaner: booking.cleaner,
        cleaner_pay: Number(booking.cleaner_pay) || 0,
        cleaner_rate: Number(booking.cleaner_rate) || 0,
        cleaner_percentage: Number(booking.cleaner_percentage) || 70,
      });
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

  const convertTo24Hour = (time12h: string): string => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = String(parseInt(hours, 10) + 12);
    }
    return `${hours}:${minutes}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setLoading(true);

    try {
      let dateTime = null;
      if (selectedDate) {
        const time24h = convertTo24Hour(selectedTime);
        const [hours, minutes] = time24h.split(':');
        const combinedDateTime = new Date(selectedDate);
        combinedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        dateTime = combinedDateTime.toISOString();
      }

      const { error } = await supabase
        .from('bookings')
        .update({
          date_time: dateTime,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone_number: formData.phone_number,
          address: formData.address,
          postcode: formData.postcode,
          access: formData.access,
          key_collection: formData.key_collection,
          parking_details: formData.parking_details,
          additional_details: formData.additional_details,
          form_name: formData.form_name,
          cleaning_type: formData.cleaning_type,
          hours_required: formData.hours_required,
          total_hours: formData.total_hours,
          ironing_hours: formData.ironing_hours,
          cleaning_time: formData.cleaning_time,
          property_details: formData.property_details,
          carpet_items: formData.carpet_items,
          upholstery_items: formData.upholstery_items,
          mattress_items: formData.mattress_items,
          exclude_areas: formData.exclude_areas,
          extras: formData.extras,
          linens: formData.linens,
          ironing: formData.ironing,
          oven_size: formData.oven_size,
          total_cost: formData.total_cost,
          cleaning_cost_per_hour: formData.cleaning_cost_per_hour,
          payment_status: formData.payment_status,
          payment_method: formData.payment_method,
          deposit: formData.deposit,
          cleaner: formData.cleaner,
          cleaner_pay: formData.cleaner_pay,
          cleaner_rate: formData.cleaner_rate,
          cleaner_percentage: formData.cleaner_percentage,
        })
        .eq('id', booking.id);

      if (error) {
        console.error('Error updating booking:', error);
        throw error;
      }

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>
            Update booking details for {booking?.first_name} {booking?.last_name}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Accordion type="multiple" defaultValue={["customer", "datetime", "address", "cleaning", "payment", "cleaner"]} className="w-full">
            
            {/* Customer Information */}
            <AccordionItem value="customer">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
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
              </AccordionContent>
            </AccordionItem>

            {/* Date & Time */}
            <AccordionItem value="datetime">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Date & Time
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                          className="p-4 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Address & Access */}
            <AccordionItem value="address">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address & Access
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    value={formData.postcode}
                    onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="access">Property Access</Label>
                  <Select value={formData.access} onValueChange={(value) => setFormData({ ...formData, access: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select access method" />
                    </SelectTrigger>
                    <SelectContent>
                      {accessOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="key_collection">Key Collection Details</Label>
                  <Textarea
                    id="key_collection"
                    value={formData.key_collection}
                    onChange={(e) => setFormData({ ...formData, key_collection: e.target.value })}
                    placeholder="Key collection instructions..."
                  />
                </div>
                <div>
                  <Label htmlFor="parking_details">Parking Details</Label>
                  <Textarea
                    id="parking_details"
                    value={formData.parking_details}
                    onChange={(e) => setFormData({ ...formData, parking_details: e.target.value })}
                    placeholder="Parking information..."
                  />
                </div>
                <div>
                  <Label htmlFor="additional_details">Additional Notes</Label>
                  <Textarea
                    id="additional_details"
                    value={formData.additional_details}
                    onChange={(e) => setFormData({ ...formData, additional_details: e.target.value })}
                    placeholder="Any additional notes..."
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Cleaning Details */}
            <AccordionItem value="cleaning">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Cleaning Details
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="form_name">Service Type</Label>
                    <Select value={formData.form_name} onValueChange={(value) => setFormData({ ...formData, form_name: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((service) => (
                          <SelectItem key={service.value} value={service.value}>
                            {service.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cleaning_type">Property Type</Label>
                    <Select value={formData.cleaning_type} onValueChange={(value) => setFormData({ ...formData, cleaning_type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        {cleaningTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isHourlyService() && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="hours_required">Hours Required</Label>
                      <Input
                        id="hours_required"
                        type="number"
                        step="0.5"
                        value={formData.hours_required}
                        onChange={(e) => setFormData({ ...formData, hours_required: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cleaning_cost_per_hour">Cost per Hour (£)</Label>
                      <Input
                        id="cleaning_cost_per_hour"
                        type="number"
                        step="0.01"
                        value={formData.cleaning_cost_per_hour}
                        onChange={(e) => setFormData({ ...formData, cleaning_cost_per_hour: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="total_hours">Total Hours</Label>
                      <Input
                        id="total_hours"
                        type="number"
                        step="0.5"
                        value={formData.total_hours}
                        onChange={(e) => setFormData({ ...formData, total_hours: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ironing_hours">Ironing Hours</Label>
                    <Input
                      id="ironing_hours"
                      type="number"
                      step="0.5"
                      value={formData.ironing_hours}
                      onChange={(e) => setFormData({ ...formData, ironing_hours: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cleaning_time">Cleaning Time</Label>
                    <Input
                      id="cleaning_time"
                      type="number"
                      step="0.5"
                      value={formData.cleaning_time}
                      onChange={(e) => setFormData({ ...formData, cleaning_time: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="property_details">Property Details</Label>
                  <Textarea
                    id="property_details"
                    value={formData.property_details}
                    onChange={(e) => setFormData({ ...formData, property_details: e.target.value })}
                    placeholder="Number of bedrooms, bathrooms, special requirements..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="carpet_items">Carpet Items</Label>
                    <Textarea
                      id="carpet_items"
                      value={formData.carpet_items}
                      onChange={(e) => setFormData({ ...formData, carpet_items: e.target.value })}
                      placeholder="Carpet cleaning details..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="upholstery_items">Upholstery Items</Label>
                    <Textarea
                      id="upholstery_items"
                      value={formData.upholstery_items}
                      onChange={(e) => setFormData({ ...formData, upholstery_items: e.target.value })}
                      placeholder="Upholstery cleaning details..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mattress_items">Mattress Items</Label>
                    <Textarea
                      id="mattress_items"
                      value={formData.mattress_items}
                      onChange={(e) => setFormData({ ...formData, mattress_items: e.target.value })}
                      placeholder="Mattress cleaning details..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="exclude_areas">Exclude Areas</Label>
                    <Textarea
                      id="exclude_areas"
                      value={formData.exclude_areas}
                      onChange={(e) => setFormData({ ...formData, exclude_areas: e.target.value })}
                      placeholder="Areas to exclude from cleaning..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="extras">Extras</Label>
                    <Input
                      id="extras"
                      value={formData.extras}
                      onChange={(e) => setFormData({ ...formData, extras: e.target.value })}
                      placeholder="Extra services..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="linens">Linens</Label>
                    <Input
                      id="linens"
                      value={formData.linens}
                      onChange={(e) => setFormData({ ...formData, linens: e.target.value })}
                      placeholder="Linen requirements..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="oven_size">Oven Size</Label>
                    <Input
                      id="oven_size"
                      value={formData.oven_size}
                      onChange={(e) => setFormData({ ...formData, oven_size: e.target.value })}
                      placeholder="Single, Double, etc."
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Payment */}
            <AccordionItem value="payment">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Payment
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="total_cost">Total Cost (£)</Label>
                    <Input
                      id="total_cost"
                      type="number"
                      step="0.01"
                      value={formData.total_cost}
                      onChange={(e) => setFormData({ ...formData, total_cost: Number(e.target.value) })}
                      readOnly={isHourlyService()}
                      className={isHourlyService() ? "bg-gray-100" : ""}
                    />
                    {isHourlyService() && (
                      <p className="text-sm text-gray-500 mt-1">
                        Auto-calculated: {formData.hours_required} hours × £{formData.cleaning_cost_per_hour}/hour
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="deposit">Deposit (£)</Label>
                    <Input
                      id="deposit"
                      type="number"
                      step="0.01"
                      value={formData.deposit}
                      onChange={(e) => setFormData({ ...formData, deposit: Number(e.target.value) })}
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
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select 
                    value={formData.payment_method} 
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Cleaner & Cleaner Pay */}
            <AccordionItem value="cleaner">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Cleaner & Payment
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="cleaner">Assign Cleaner</Label>
                  <Select 
                    value={formData.cleaner === null ? 'unassigned' : formData.cleaner.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, cleaner: value === 'unassigned' ? null : Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a cleaner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {cleaners.map((cleaner) => (
                        <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                          {cleaner.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cleaner_pay">Cleaner Pay (£)</Label>
                    <Input
                      id="cleaner_pay"
                      type="number"
                      step="0.01"
                      value={formData.cleaner_pay}
                      onChange={(e) => setFormData({ ...formData, cleaner_pay: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cleaner_rate">Cleaner Rate (£/hour)</Label>
                    <Input
                      id="cleaner_rate"
                      type="number"
                      step="0.01"
                      value={formData.cleaner_rate}
                      onChange={(e) => setFormData({ ...formData, cleaner_rate: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cleaner_percentage">Cleaner Percentage (%)</Label>
                    <Input
                      id="cleaner_percentage"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={formData.cleaner_percentage}
                      onChange={(e) => setFormData({ ...formData, cleaner_percentage: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>

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
