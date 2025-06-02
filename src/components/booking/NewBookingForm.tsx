import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, User, MapPin, Clock, Banknote, Home, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CustomerSelector from './CustomerSelector';
import CleanerSelector from './CleanerSelector';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface NewBookingFormProps {
  onBookingCreated: () => void;
}

interface BookingData {
  // Customer info
  customerId: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  
  // Cleaner info
  cleanerId: number | null;
  
  // Booking details
  selectedDate: Date | undefined;
  selectedTime: string;
  address: string;
  postcode: string;
  
  // Service details
  serviceType: string; // domestic, commercial, airbnb, end_of_tenancy, deep_cleaning, carpet_cleaning
  cleaningSubType: string; // standard_cleaning, deep_cleaning (only for domestic/commercial/airbnb)
  totalHours: number; // changed from hoursRequired to totalHours
  cleaningTime: string; // only for end_of_tenancy/deep_cleaning/carpet_cleaning
  
  // Airbnb specific
  isSameDayCleaning: boolean;
  
  // Additional cleaning items (for end_of_tenancy/deep_cleaning/carpet_cleaning)
  carpetCleaningItems: string;
  mattressCleaningItems: string;
  upholsteryCleaningItems: string;
  
  // Property access
  propertyAccess: string;
  keyPickupAddress: string; // shown when propertyAccess is "estate_agent"
  useClientAddress: boolean;
  
  // Cost and payment
  totalCost: number;
  cleanerPay: number;
  paymentMethod: string;
  paymentStatus: string;
  
  // Cleaner rate overrides
  cleanerHourlyRate: number;
  cleanerPercentage: number;
  
  // Additional details
  propertyDetails: string;
  additionalDetails: string;
}

const NewBookingForm = ({ onBookingCreated }: NewBookingFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BookingData>({
    customerId: null,
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    cleanerId: null,
    selectedDate: undefined,
    selectedTime: '09:00 AM',
    address: '',
    postcode: '',
    serviceType: '',
    cleaningSubType: '',
    totalHours: 0,
    cleaningTime: '',
    isSameDayCleaning: false,
    carpetCleaningItems: '',
    mattressCleaningItems: '',
    upholsteryCleaningItems: '',
    propertyAccess: '',
    keyPickupAddress: '',
    useClientAddress: false,
    totalCost: 0,
    cleanerPay: 0,
    paymentMethod: 'Cash',
    paymentStatus: 'Unpaid',
    cleanerHourlyRate: 0,
    cleanerPercentage: 70,
    propertyDetails: '',
    additionalDetails: ''
  });

  const serviceTypes = [
    { value: 'domestic', label: 'Domestic Cleaning' },
    { value: 'commercial', label: 'Commercial Cleaning' },
    { value: 'airbnb', label: 'Airbnb Cleaning' },
    { value: 'end_of_tenancy', label: 'End of Tenancy Cleaning' },
    { value: 'deep_cleaning', label: 'Deep Cleaning' },
    { value: 'carpet_cleaning', label: 'Carpet Cleaning' }
  ];

  const cleaningSubTypes = [
    { value: 'standard_cleaning', label: 'Standard Cleaning' },
    { value: 'deep_cleaning', label: 'Deep Cleaning' }
  ];

  const propertyAccessOptions = [
    { value: 'customer_present', label: 'Customer will be present' },
    { value: 'key_left', label: 'Key will be left' },
    { value: 'estate_agent', label: 'Pick up keys from estate agent' },
    { value: 'other', label: 'Other arrangement' }
  ];

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

  // Check if service type requires hourly input
  const requiresHours = ['domestic', 'commercial', 'airbnb'].includes(formData.serviceType);
  
  // Check if service type requires cleaning time
  const requiresCleaningTime = ['end_of_tenancy', 'deep_cleaning', 'carpet_cleaning'].includes(formData.serviceType);
  
  // Check if service type shows subcategory
  const showSubCategory = ['domestic', 'commercial', 'airbnb'].includes(formData.serviceType);
  
  // Check if service type shows additional cleaning items
  const showCleaningItems = ['end_of_tenancy', 'deep_cleaning', 'carpet_cleaning'].includes(formData.serviceType);

  // Check if Airbnb service type
  const isAirbnbService = formData.serviceType === 'airbnb';

  const handleInputChange = (field: keyof BookingData, value: string | number | boolean | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServiceTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      serviceType: value,
      cleaningSubType: '', // Reset subcategory when service type changes
      totalHours: 0,
      cleaningTime: '',
      isSameDayCleaning: false // Reset same day cleaning when service type changes
    }));
  };

  // Convert 12-hour time to 24-hour time
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

  const handleCustomerSelect = (customer: any) => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        firstName: customer.first_name || '',
        lastName: customer.last_name || '',
        email: customer.email || '',
        phoneNumber: customer.phone || '',
        address: prev.useClientAddress ? (customer.address || '') : prev.address,
        postcode: prev.useClientAddress ? (customer.postcode || '') : prev.postcode,
        keyPickupAddress: prev.useClientAddress ? `${customer.address || ''}, ${customer.postcode || ''}` : prev.keyPickupAddress
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customerId: null,
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: ''
      }));
    }
  };

  const handleCleanerSelect = (cleaner: any) => {
    if (cleaner) {
      setFormData(prev => ({
        ...prev,
        cleanerId: cleaner.id,
        cleanerHourlyRate: cleaner.hourly_rate || 0,
        cleanerPercentage: cleaner.presentage_rate || 70
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        cleanerId: null,
        cleanerHourlyRate: 0,
        cleanerPercentage: 70
      }));
    }
  };

  const handleUseClientAddress = (checked: boolean) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        useClientAddress: checked
      };
      
      // If checked and we have a customer selected, auto-fill the key pickup address
      if (checked && prev.customerId) {
        newData.keyPickupAddress = `${prev.address}, ${prev.postcode}`;
      } else if (!checked) {
        newData.keyPickupAddress = '';
      }
      
      return newData;
    });
  };

  const calculateCleanerPay = () => {
    let cleanerPay = 0;
    if (requiresHours && formData.totalHours > 0 && formData.cleanerHourlyRate > 0) {
      cleanerPay = formData.totalHours * formData.cleanerHourlyRate;
    } else if (formData.cleanerPercentage > 0) {
      cleanerPay = formData.totalCost * (formData.cleanerPercentage / 100);
    }
    
    setFormData(prev => ({
      ...prev,
      cleanerPay: cleanerPay
    }));
  };

  useEffect(() => {
    calculateCleanerPay();
  }, [formData.totalCost, formData.totalHours, formData.cleanerHourlyRate, formData.cleanerPercentage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.selectedDate) {
        toast({
          title: "Error",
          description: "Please select a date.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Combine date and time
      const time24h = convertTo24Hour(formData.selectedTime);
      const [hours, minutes] = time24h.split(':');
      const dateTime = new Date(formData.selectedDate);
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Determine form_name based on service type and sub type
      let formName = '';
      if (showSubCategory && formData.cleaningSubType) {
        formName = formData.cleaningSubType === 'standard_cleaning' ? 'Standard Cleaning' : 'Deep Cleaning';
      } else {
        switch (formData.serviceType) {
          case 'end_of_tenancy':
            formName = 'End of Tenancy';
            break;
          case 'deep_cleaning':
            formName = 'Deep Cleaning';
            break;
          case 'carpet_cleaning':
            formName = 'Carpet Cleaning';
            break;
          default:
            formName = 'Standard Cleaning';
        }
      }

      // Determine cleaning_type
      let cleaningType = '';
      switch (formData.serviceType) {
        case 'domestic':
          cleaningType = 'Domestic';
          break;
        case 'commercial':
          cleaningType = 'Commercial';
          break;
        case 'airbnb':
          cleaningType = 'Air BnB';
          break;
        default:
          cleaningType = 'Domestic';
      }

      // Build additional details
      let additionalDetails = formData.additionalDetails;
      if (showCleaningItems) {
        const cleaningItems = [];
        if (formData.carpetCleaningItems) cleaningItems.push(`Carpet items: ${formData.carpetCleaningItems}`);
        if (formData.mattressCleaningItems) cleaningItems.push(`Mattress items: ${formData.mattressCleaningItems}`);
        if (formData.upholsteryCleaningItems) cleaningItems.push(`Upholstery items: ${formData.upholsteryCleaningItems}`);
        
        if (cleaningItems.length > 0) {
          additionalDetails = additionalDetails ? 
            `${additionalDetails}\n\n${cleaningItems.join('\n')}` : 
            cleaningItems.join('\n');
        }
      }

      // Add property access information
      if (formData.propertyAccess) {
        const accessInfo = `Property Access: ${propertyAccessOptions.find(opt => opt.value === formData.propertyAccess)?.label}`;
        const keyInfo = formData.propertyAccess === 'estate_agent' && formData.keyPickupAddress ? 
          `\nKey pickup address: ${formData.keyPickupAddress}` : '';
        
        additionalDetails = additionalDetails ? 
          `${additionalDetails}\n\n${accessInfo}${keyInfo}` : 
          `${accessInfo}${keyInfo}`;
      }

      // Set frequently field for Airbnb same day cleaning
      let frequently = null;
      if (isAirbnbService && formData.isSameDayCleaning) {
        frequently = 'Same Day';
      }

      const bookingData = {
        customer: formData.customerId,
        cleaner: formData.cleanerId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        date_time: dateTime.toISOString(),
        address: formData.address,
        postcode: formData.postcode,
        total_hours: requiresHours ? formData.totalHours : null, // changed from hours_required to total_hours
        cleaning_time: requiresCleaningTime ? parseFloat(formData.cleaningTime) || null : null,
        total_cost: formData.totalCost,
        cleaner_pay: formData.cleanerPay,
        cleaner_rate: formData.cleanerHourlyRate || null,
        cleaner_percentage: formData.cleanerPercentage || null,
        form_name: formName,
        cleaning_type: cleaningType,
        property_details: formData.propertyDetails,
        additional_details: additionalDetails,
        payment_method: formData.paymentMethod,
        payment_status: formData.paymentStatus,
        booking_status: 'Confirmed',
        frequently: frequently
      };

      const { error } = await supabase
        .from('bookings')
        .insert([bookingData]);

      if (error) {
        console.error('Error creating booking:', error);
        toast({
          title: "Error",
          description: "Failed to create booking. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Booking created successfully!",
      });

      onBookingCreated();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CustomerSelector onCustomerSelect={handleCustomerSelect} />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date & Time Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Date & Time
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.selectedDate ? format(formData.selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.selectedDate}
                    onSelect={(date) => handleInputChange('selectedDate', date)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-4 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Time *</Label>
              <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto border rounded-md p-2">
                {timeOptions.map((time) => (
                  <Button
                    key={time}
                    type="button"
                    variant={formData.selectedTime === time ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => handleInputChange('selectedTime', time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Service Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="serviceType">Service Type *</Label>
            <Select value={formData.serviceType} onValueChange={handleServiceTypeChange}>
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

          {showSubCategory && (
            <div>
              <Label htmlFor="cleaningSubType">Cleaning Type *</Label>
              <Select value={formData.cleaningSubType} onValueChange={(value) => handleInputChange('cleaningSubType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cleaning type" />
                </SelectTrigger>
                <SelectContent>
                  {cleaningSubTypes.map((subType) => (
                    <SelectItem key={subType.value} value={subType.value}>
                      {subType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isAirbnbService && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSameDayCleaning"
                checked={formData.isSameDayCleaning}
                onCheckedChange={(checked) => handleInputChange('isSameDayCleaning', checked)}
              />
              <Label htmlFor="isSameDayCleaning">Same Day Cleaning</Label>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {requiresHours && (
              <div>
                <Label htmlFor="totalHours">Total Hours *</Label>
                <Input
                  id="totalHours"
                  type="number"
                  step="0.5"
                  min="1"
                  value={formData.totalHours}
                  onChange={(e) => handleInputChange('totalHours', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            )}

            {requiresCleaningTime && (
              <div>
                <Label htmlFor="cleaningTime">Cleaning Time *</Label>
                <Input
                  id="cleaningTime"
                  placeholder="e.g., 2-3 hours, Half day, Full day"
                  value={formData.cleaningTime}
                  onChange={(e) => handleInputChange('cleaningTime', e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {showCleaningItems && (
            <div className="space-y-4">
              <h4 className="font-medium">Additional Cleaning Items</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="carpetCleaningItems">Carpet Cleaning Items</Label>
                  <Textarea
                    id="carpetCleaningItems"
                    value={formData.carpetCleaningItems}
                    onChange={(e) => handleInputChange('carpetCleaningItems', e.target.value)}
                    placeholder="Describe carpet cleaning requirements..."
                  />
                </div>
                <div>
                  <Label htmlFor="mattressCleaningItems">Mattress Cleaning Items</Label>
                  <Textarea
                    id="mattressCleaningItems"
                    value={formData.mattressCleaningItems}
                    onChange={(e) => handleInputChange('mattressCleaningItems', e.target.value)}
                    placeholder="Describe mattress cleaning requirements..."
                  />
                </div>
                <div>
                  <Label htmlFor="upholsteryCleaningItems">Upholstery Cleaning Items</Label>
                  <Textarea
                    id="upholsteryCleaningItems"
                    value={formData.upholsteryCleaningItems}
                    onChange={(e) => handleInputChange('upholsteryCleaningItems', e.target.value)}
                    placeholder="Describe upholstery cleaning requirements..."
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="propertyDetails">Property Details</Label>
            <Textarea
              id="propertyDetails"
              value={formData.propertyDetails}
              onChange={(e) => handleInputChange('propertyDetails', e.target.value)}
              placeholder="Bedrooms, bathrooms, special requirements..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Property Address & Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Property Address & Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Property Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="postcode">Postcode *</Label>
            <Input
              id="postcode"
              value={formData.postcode}
              onChange={(e) => handleInputChange('postcode', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="propertyAccess">Property Access *</Label>
            <Select value={formData.propertyAccess} onValueChange={(value) => handleInputChange('propertyAccess', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select access method" />
              </SelectTrigger>
              <SelectContent>
                {propertyAccessOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.propertyAccess === 'estate_agent' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useClientAddress"
                  checked={formData.useClientAddress}
                  onChange={(e) => handleUseClientAddress(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="useClientAddress">Use client address for key pickup</Label>
              </div>
              
              <div>
                <Label htmlFor="keyPickupAddress">Key Pickup Address</Label>
                <Textarea
                  id="keyPickupAddress"
                  value={formData.keyPickupAddress}
                  onChange={(e) => handleInputChange('keyPickupAddress', e.target.value)}
                  placeholder="Enter estate agent office address or use client address..."
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment & Cost */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Payment & Cost
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="totalCost">Total Cost (£) *</Label>
              <Input
                id="totalCost"
                type="number"
                step="0.01"
                min="0"
                value={formData.totalCost}
                onChange={(e) => handleInputChange('totalCost', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div>
              <Label htmlFor="cleanerPay">Cleaner Pay (£)</Label>
              <Input
                id="cleanerPay"
                type="number"
                step="0.01"
                value={formData.cleanerPay}
                onChange={(e) => handleInputChange('cleanerPay', parseFloat(e.target.value) || 0)}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cleaner Rate Override Section */}
          {formData.cleanerId && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Cleaner Rate Override (Optional)</h4>
              <div className="grid grid-cols-2 gap-4">
                {requiresHours && (
                  <div>
                    <Label htmlFor="cleanerHourlyRate">Cleaner Hourly Rate (£)</Label>
                    <Input
                      id="cleanerHourlyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cleanerHourlyRate}
                      onChange={(e) => handleInputChange('cleanerHourlyRate', parseFloat(e.target.value) || 0)}
                      placeholder="Override hourly rate"
                    />
                  </div>
                )}
                {!requiresHours && (
                  <div>
                    <Label htmlFor="cleanerPercentage">Cleaner Percentage (%)</Label>
                    <Input
                      id="cleanerPercentage"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={formData.cleanerPercentage}
                      onChange={(e) => handleInputChange('cleanerPercentage', parseFloat(e.target.value) || 0)}
                      placeholder="Override percentage"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Details */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="additionalDetails">Special Instructions</Label>
            <Textarea
              id="additionalDetails"
              value={formData.additionalDetails}
              onChange={(e) => handleInputChange('additionalDetails', e.target.value)}
              placeholder="Any special instructions or requirements..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Cleaner Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Cleaner Assignment (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CleanerSelector onCleanerSelect={handleCleanerSelect} />
        </CardContent>
      </Card>

      <Separator />

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => onBookingCreated()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating Booking...' : 'Create Booking'}
        </Button>
      </div>
    </form>
  );
};

export default NewBookingForm;
