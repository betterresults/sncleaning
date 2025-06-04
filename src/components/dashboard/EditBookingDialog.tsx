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
import { CalendarIcon, User, MapPin, Home, Banknote, UserCheck, Plus, Clock } from 'lucide-react';

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

interface SelectWithAddProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  onAddOption?: (newOption: string) => void;
}

const SelectWithAdd: React.FC<SelectWithAddProps> = ({ value, onValueChange, options, placeholder, onAddOption }) => {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newOption, setNewOption] = useState('');

  const handleAddOption = () => {
    if (newOption.trim() && onAddOption) {
      onAddOption(newOption.trim());
      onValueChange(newOption.trim());
      setNewOption('');
      setShowAddInput(false);
    }
  };

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-blue-500 rounded-lg bg-white shadow-sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-white border-2 border-gray-200 rounded-lg shadow-lg">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="hover:bg-blue-50">
              {option.label}
            </SelectItem>
          ))}
          {onAddOption && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddInput(true)}
                className="w-full text-blue-600 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Option
              </Button>
            </div>
          )}
        </SelectContent>
      </Select>
      
      {showAddInput && (
        <div className="flex gap-2">
          <Input
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            placeholder="Enter custom option"
            className="h-9"
            onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
          />
          <Button onClick={handleAddOption} size="sm" className="bg-blue-600 hover:bg-blue-700">
            Add
          </Button>
          <Button onClick={() => setShowAddInput(false)} variant="outline" size="sm">
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

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
  const [isManualCostEdit, setIsManualCostEdit] = useState(false);
  
  // Custom options state
  const [customServiceTypes, setCustomServiceTypes] = useState<{ value: string; label: string }[]>([]);
  const [customCleaningTypes, setCustomCleaningTypes] = useState<{ value: string; label: string }[]>([]);
  const [customAccessOptions, setCustomAccessOptions] = useState<{ value: string; label: string }[]>([]);
  const [customPaymentMethods, setCustomPaymentMethods] = useState<{ value: string; label: string }[]>([]);

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
    { value: 'Carpet Cleaning', label: 'Carpet Cleaning' },
    ...customServiceTypes
  ];

  const cleaningTypes = [
    { value: 'Domestic', label: 'Domestic' },
    { value: 'Commercial', label: 'Commercial' },
    { value: 'Air BnB', label: 'Air BnB' },
    ...customCleaningTypes
  ];

  const accessOptions = [
    { value: 'customer_present', label: 'Customer will be present' },
    { value: 'key_left', label: 'Key will be left' },
    { value: 'keybox', label: 'Access via keybox' },
    { value: 'estate_agent', label: 'Pick up keys from estate agent' },
    { value: 'other', label: 'Other arrangement' },
    ...customAccessOptions
  ];

  const paymentMethods = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Card', label: 'Card' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Online', label: 'Online' },
    ...customPaymentMethods
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

  // Memoize the calculated cost to prevent unnecessary re-renders
  const calculatedCost = React.useMemo(() => {
    if (isHourlyService() && !isManualCostEdit) {
      return calculateTotalCost();
    }
    return formData.total_cost;
  }, [formData.hours_required, formData.cleaning_cost_per_hour, formData.cleaning_type, formData.total_cost, isManualCostEdit]);

  // Update total cost only when calculated cost changes and user hasn't manually edited
  useEffect(() => {
    if (isHourlyService() && !isManualCostEdit && calculatedCost !== formData.total_cost) {
      setFormData(prev => ({ ...prev, total_cost: calculatedCost }));
    }
  }, [calculatedCost, isHourlyService, isManualCostEdit]);

  useEffect(() => {
    if (booking && open) {
      console.log('Loading booking data:', booking);
      
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

      // Reset manual edit flag when loading new booking
      setIsManualCostEdit(false);
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

  const handleTotalCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCost = Number(e.target.value);
    setFormData({ ...formData, total_cost: newCost });
    setIsManualCostEdit(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50 border-0 shadow-2xl">
        <DialogHeader className="pb-6 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Edit Booking
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-lg">
            Update booking details for {booking?.first_name} {booking?.last_name}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Accordion type="multiple" className="w-full space-y-4">
            
            {/* Customer Information */}
            <AccordionItem value="customer" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-lg font-semibold text-gray-800">Customer Information</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="h-11 border-2 border-gray-200 focus:border-blue-500 rounded-lg bg-white shadow-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="h-11 border-2 border-gray-200 focus:border-blue-500 rounded-lg bg-white shadow-sm"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-11 border-2 border-gray-200 focus:border-blue-500 rounded-lg bg-white shadow-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_number" className="text-sm font-medium text-gray-700">Phone Number</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="h-11 border-2 border-gray-200 focus:border-blue-500 rounded-lg bg-white shadow-sm"
                      required
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Date & Time - New separate section */}
            <AccordionItem value="datetime" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:bg-orange-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-lg font-semibold text-gray-800">Date & Time</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full h-11 justify-start text-left font-normal border-2 border-gray-200 focus:border-orange-500 rounded-lg bg-white shadow-sm hover:bg-gray-50",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-3 h-5 w-5 text-orange-600" />
                          {selectedDate ? format(selectedDate, "EEEE, MMMM do, yyyy") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-2 border-gray-200 rounded-xl shadow-lg" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                          className="p-4 pointer-events-auto rounded-xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Time</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-orange-500 rounded-lg bg-white shadow-sm">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time} className="hover:bg-orange-50">
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
            <AccordionItem value="address" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:bg-green-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-lg font-semibold text-gray-800">Address & Access</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-11 border-2 border-gray-200 focus:border-green-500 rounded-lg bg-white shadow-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postcode" className="text-sm font-medium text-gray-700">Postcode</Label>
                  <Input
                    id="postcode"
                    value={formData.postcode}
                    onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                    className="h-11 border-2 border-gray-200 focus:border-green-500 rounded-lg bg-white shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access" className="text-sm font-medium text-gray-700">Property Access</Label>
                  <SelectWithAdd
                    value={formData.access}
                    onValueChange={(value) => setFormData({ ...formData, access: value })}
                    options={accessOptions}
                    placeholder="Select access method"
                    onAddOption={(newOption) => setCustomAccessOptions(prev => [...prev, { value: newOption, label: newOption }])}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key_collection" className="text-sm font-medium text-gray-700">Key Collection Details</Label>
                  <Textarea
                    id="key_collection"
                    value={formData.key_collection}
                    onChange={(e) => setFormData({ ...formData, key_collection: e.target.value })}
                    placeholder="Key collection instructions..."
                    className="min-h-[100px] border-2 border-gray-200 focus:border-green-500 rounded-lg bg-white shadow-sm resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parking_details" className="text-sm font-medium text-gray-700">Parking Details</Label>
                  <Textarea
                    id="parking_details"
                    value={formData.parking_details}
                    onChange={(e) => setFormData({ ...formData, parking_details: e.target.value })}
                    placeholder="Parking information..."
                    className="min-h-[100px] border-2 border-gray-200 focus:border-green-500 rounded-lg bg-white shadow-sm resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additional_details" className="text-sm font-medium text-gray-700">Additional Notes</Label>
                  <Textarea
                    id="additional_details"
                    value={formData.additional_details}
                    onChange={(e) => setFormData({ ...formData, additional_details: e.target.value })}
                    placeholder="Any additional notes..."
                    className="min-h-[100px] border-2 border-gray-200 focus:border-green-500 rounded-lg bg-white shadow-sm resize-none"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Cleaning Details */}
            <AccordionItem value="cleaning" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:bg-purple-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Home className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-lg font-semibold text-gray-800">Cleaning Details</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="form_name" className="text-sm font-medium text-gray-700">Service Type</Label>
                    <SelectWithAdd
                      value={formData.form_name}
                      onValueChange={(value) => setFormData({ ...formData, form_name: value })}
                      options={serviceTypes}
                      placeholder="Select service type"
                      onAddOption={(newOption) => setCustomServiceTypes(prev => [...prev, { value: newOption, label: newOption }])}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cleaning_type" className="text-sm font-medium text-gray-700">Property Type</Label>
                    <SelectWithAdd
                      value={formData.cleaning_type}
                      onValueChange={(value) => setFormData({ ...formData, cleaning_type: value })}
                      options={cleaningTypes}
                      placeholder="Select property type"
                      onAddOption={(newOption) => setCustomCleaningTypes(prev => [...prev, { value: newOption, label: newOption }])}
                    />
                  </div>
                </div>

                {isHourlyService() && (
                  <div className="grid grid-cols-3 gap-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="space-y-2">
                      <Label htmlFor="hours_required" className="text-sm font-medium text-gray-700">Hours Required</Label>
                      <Input
                        id="hours_required"
                        type="number"
                        step="0.5"
                        value={formData.hours_required}
                        onChange={(e) => {
                          setFormData({ ...formData, hours_required: Number(e.target.value) });
                          setIsManualCostEdit(false); // Allow auto-calculation when hours change
                        }}
                        className="h-11 border-2 border-blue-200 focus:border-blue-500 rounded-lg bg-white shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cleaning_cost_per_hour" className="text-sm font-medium text-gray-700">Cost per Hour (£)</Label>
                      <Input
                        id="cleaning_cost_per_hour"
                        type="number"
                        step="0.01"
                        value={formData.cleaning_cost_per_hour}
                        onChange={(e) => {
                          setFormData({ ...formData, cleaning_cost_per_hour: Number(e.target.value) });
                          setIsManualCostEdit(false); // Allow auto-calculation when rate changes
                        }}
                        className="h-11 border-2 border-blue-200 focus:border-blue-500 rounded-lg bg-white shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total_hours" className="text-sm font-medium text-gray-700">Total Hours</Label>
                      <Input
                        id="total_hours"
                        type="number"
                        step="0.5"
                        value={formData.total_hours}
                        onChange={(e) => setFormData({ ...formData, total_hours: Number(e.target.value) })}
                        className="h-11 border-2 border-blue-200 focus:border-blue-500 rounded-lg bg-white shadow-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="property_details" className="text-sm font-medium text-gray-700">Property Details</Label>
                  <Textarea
                    id="property_details"
                    value={formData.property_details}
                    onChange={(e) => setFormData({ ...formData, property_details: e.target.value })}
                    placeholder="Number of bedrooms, bathrooms, special requirements..."
                    className="min-h-[100px] border-2 border-gray-200 focus:border-purple-500 rounded-lg bg-white shadow-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="ironing_hours" className="text-sm font-medium text-gray-700">Ironing Hours</Label>
                    <Input
                      id="ironing_hours"
                      type="number"
                      step="0.5"
                      value={formData.ironing_hours}
                      onChange={(e) => setFormData({ ...formData, ironing_hours: Number(e.target.value) })}
                      className="h-11 border-2 border-gray-200 focus:border-purple-500 rounded-lg bg-white shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cleaning_time" className="text-sm font-medium text-gray-700">Cleaning Time</Label>
                    <Input
                      id="cleaning_time"
                      type="number"
                      step="0.5"
                      value={formData.cleaning_time}
                      onChange={(e) => setFormData({ ...formData, cleaning_time: Number(e.target.value) })}
                      className="h-11 border-2 border-gray-200 focus:border-purple-500 rounded-lg bg-white shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="carpet_items" className="text-sm font-medium text-gray-700">Carpet Items</Label>
                    <Textarea
                      id="carpet_items"
                      value={formData.carpet_items}
                      onChange={(e) => setFormData({ ...formData, carpet_items: e.target.value })}
                      placeholder="Carpet cleaning details..."
                      className="h-20 border-2 border-gray-200 focus:border-purple-500 rounded-lg bg-white shadow-sm resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="upholstery_items" className="text-sm font-medium text-gray-700">Upholstery Items</Label>
                    <Textarea
                      id="upholstery_items"
                      value={formData.upholstery_items}
                      onChange={(e) => setFormData({ ...formData, upholstery_items: e.target.value })}
                      placeholder="Upholstery cleaning details..."
                      className="h-20 border-2 border-gray-200 focus:border-purple-500 rounded-lg bg-white shadow-sm resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="mattress_items" className="text-sm font-medium text-gray-700">Mattress Items</Label>
                    <Textarea
                      id="mattress_items"
                      value={formData.mattress_items}
                      onChange={(e) => setFormData({ ...formData, mattress_items: e.target.value })}
                      placeholder="Mattress cleaning details..."
                      className="h-20 border-2 border-gray-200 focus:border-purple-500 rounded-lg bg-white shadow-sm resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exclude_areas" className="text-sm font-medium text-gray-700">Exclude Areas</Label>
                    <Textarea
                      id="exclude_areas"
                      value={formData.exclude_areas}
                      onChange={(e) => setFormData({ ...formData, exclude_areas: e.target.value })}
                      placeholder="Areas to exclude from cleaning..."
                      className="h-20 border-2 border-gray-200 focus:border-purple-500 rounded-lg bg-white shadow-sm resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="extras" className="text-sm font-medium text-gray-700">Extras</Label>
                    <Input
                      id="extras"
                      value={formData.extras}
                      onChange={(e) => setFormData({ ...formData, extras: e.target.value })}
                      placeholder="Extra services..."
                      className="h-11 border-2 border-gray-200 focus:border-purple-500 rounded-lg bg-white shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linens" className="text-sm font-medium text-gray-700">Linens</Label>
                    <Input
                      id="linens"
                      value={formData.linens}
                      onChange={(e) => setFormData({ ...formData, linens: e.target.value })}
                      placeholder="Linen requirements..."
                      className="h-11 border-2 border-gray-200 focus:border-purple-500 rounded-lg bg-white shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oven_size" className="text-sm font-medium text-gray-700">Oven Size</Label>
                    <Input
                      id="oven_size"
                      value={formData.oven_size}
                      onChange={(e) => setFormData({ ...formData, oven_size: e.target.value })}
                      placeholder="Single, Double, etc."
                      className="h-11 border-2 border-gray-200 focus:border-purple-500 rounded-lg bg-white shadow-sm"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Payment */}
            <AccordionItem value="payment" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:bg-yellow-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Banknote className="h-5 w-5 text-yellow-600" />
                  </div>
                  <span className="text-lg font-semibold text-gray-800">Payment</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="total_cost" className="text-sm font-medium text-gray-700">Total Cost (£)</Label>
                    <Input
                      id="total_cost"
                      type="number"
                      step="0.01"
                      value={formData.total_cost}
                      onChange={handleTotalCostChange}
                      className="h-11 border-2 border-gray-200 focus:border-yellow-500 rounded-lg bg-white shadow-sm"
                    />
                    {isHourlyService() && !isManualCostEdit && (
                      <p className="text-sm text-blue-600 font-medium">
                        Auto-calculated: {formData.hours_required} hours × £{formData.cleaning_cost_per_hour}/hour
                      </p>
                    )}
                    {isHourlyService() && isManualCostEdit && (
                      <p className="text-sm text-orange-600 font-medium">
                        Manually edited - auto-calculation disabled
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deposit" className="text-sm font-medium text-gray-700">Deposit (£)</Label>
                    <Input
                      id="deposit"
                      type="number"
                      step="0.01"
                      value={formData.deposit}
                      onChange={(e) => setFormData({ ...formData, deposit: Number(e.target.value) })}
                      className="h-11 border-2 border-gray-200 focus:border-yellow-500 rounded-lg bg-white shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_status" className="text-sm font-medium text-gray-700">Payment Status</Label>
                    <Select 
                      value={formData.payment_status} 
                      onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
                    >
                      <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-yellow-500 rounded-lg bg-white shadow-sm">
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                        <SelectItem value="paid" className="hover:bg-yellow-50">Paid</SelectItem>
                        <SelectItem value="unpaid" className="hover:bg-yellow-50">Unpaid</SelectItem>
                        <SelectItem value="pending" className="hover:bg-yellow-50">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_method" className="text-sm font-medium text-gray-700">Payment Method</Label>
                  <SelectWithAdd
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                    options={paymentMethods}
                    placeholder="Select payment method"
                    onAddOption={(newOption) => setCustomPaymentMethods(prev => [...prev, { value: newOption, label: newOption }])}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Cleaner & Cleaner Pay */}
            <AccordionItem value="cleaner" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:bg-indigo-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <UserCheck className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className="text-lg font-semibold text-gray-800">Cleaner & Payment</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cleaner" className="text-sm font-medium text-gray-700">Assign Cleaner</Label>
                  <Select 
                    value={formData.cleaner === null ? 'unassigned' : formData.cleaner.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, cleaner: value === 'unassigned' ? null : Number(value) })}
                  >
                    <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-indigo-500 rounded-lg bg-white shadow-sm">
                      <SelectValue placeholder="Select a cleaner" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                      <SelectItem value="unassigned" className="hover:bg-indigo-50">Unassigned</SelectItem>
                      {cleaners.map((cleaner) => (
                        <SelectItem key={cleaner.id} value={cleaner.id.toString()} className="hover:bg-indigo-50">
                          {cleaner.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="cleaner_pay" className="text-sm font-medium text-gray-700">Cleaner Pay (£)</Label>
                    <Input
                      id="cleaner_pay"
                      type="number"
                      step="0.01"
                      value={formData.cleaner_pay}
                      onChange={(e) => setFormData({ ...formData, cleaner_pay: Number(e.target.value) })}
                      className="h-11 border-2 border-gray-200 focus:border-indigo-500 rounded-lg bg-white shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cleaner_rate" className="text-sm font-medium text-gray-700">Cleaner Rate (£/hour)</Label>
                    <Input
                      id="cleaner_rate"
                      type="number"
                      step="0.01"
                      value={formData.cleaner_rate}
                      onChange={(e) => setFormData({ ...formData, cleaner_rate: Number(e.target.value) })}
                      className="h-11 border-2 border-gray-200 focus:border-indigo-500 rounded-lg bg-white shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cleaner_percentage" className="text-sm font-medium text-gray-700">Cleaner Percentage (%)</Label>
                    <Input
                      id="cleaner_percentage"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={formData.cleaner_percentage}
                      onChange={(e) => setFormData({ ...formData, cleaner_percentage: Number(e.target.value) })}
                      className="h-11 border-2 border-gray-200 focus:border-indigo-500 rounded-lg bg-white shadow-sm"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>

          <DialogFooter className="pt-6 border-t border-gray-200">
            <div className="flex gap-4 w-full justify-center">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="px-8 py-3 h-12 border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="px-12 py-3 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Booking'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBookingDialog;
