
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, User, MapPin, Clock, Banknote, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CustomerSelector from './CustomerSelector';
import CleanerSelector from './CleanerSelector';

interface BookingFormProps {
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
  dateTime: string;
  address: string;
  postcode: string;
  hoursRequired: number;
  totalCost: number;
  cleanerPay: number;
  
  // Service details
  formName: string;
  cleaningType: string;
  propertyDetails: string;
  additionalDetails: string;
  
  // Payment
  paymentMethod: string;
  paymentStatus: string;
}

const BookingForm = ({ onBookingCreated }: BookingFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BookingData>({
    customerId: null,
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    cleanerId: null,
    dateTime: '',
    address: '',
    postcode: '',
    hoursRequired: 0,
    totalCost: 0,
    cleanerPay: 0,
    formName: 'Standard Cleaning',
    cleaningType: 'Regular',
    propertyDetails: '',
    additionalDetails: '',
    paymentMethod: 'Cash',
    paymentStatus: 'Unpaid'
  });

  const handleInputChange = (field: keyof BookingData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerSelect = (customer: any) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer.id,
      firstName: customer.first_name || '',
      lastName: customer.last_name || '',
      email: customer.email || '',
      phoneNumber: customer.phone || ''
    }));
  };

  const handleCleanerSelect = (cleaner: any) => {
    setFormData(prev => ({
      ...prev,
      cleanerId: cleaner.id
    }));
  };

  const calculateCleanerPay = () => {
    // Calculate 70% of total cost as cleaner pay
    const cleanerPay = formData.totalCost * 0.7;
    setFormData(prev => ({
      ...prev,
      cleanerPay: cleanerPay
    }));
  };

  useEffect(() => {
    calculateCleanerPay();
  }, [formData.totalCost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookingData = {
        customer: formData.customerId,
        cleaner: formData.cleanerId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        date_time: formData.dateTime,
        address: formData.address,
        postcode: formData.postcode,
        hours_required: formData.hoursRequired,
        total_cost: formData.totalCost,
        cleaner_pay: formData.cleanerPay,
        form_name: formData.formName,
        cleaning_type: formData.cleaningType,
        property_details: formData.propertyDetails,
        additional_details: formData.additionalDetails,
        payment_method: formData.paymentMethod,
        payment_status: formData.paymentStatus,
        booking_status: 'Confirmed'
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

      {/* Cleaner Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Cleaner Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CleanerSelector onCleanerSelect={handleCleanerSelect} />
        </CardContent>
      </Card>

      {/* Booking Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Booking Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateTime">Date & Time *</Label>
              <Input
                id="dateTime"
                type="datetime-local"
                value={formData.dateTime}
                onChange={(e) => handleInputChange('dateTime', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="hoursRequired">Hours Required *</Label>
              <Input
                id="hoursRequired"
                type="number"
                step="0.5"
                min="1"
                value={formData.hoursRequired}
                onChange={(e) => handleInputChange('hoursRequired', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="formName">Service Type</Label>
              <Select value={formData.formName} onValueChange={(value) => handleInputChange('formName', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard Cleaning">Standard Cleaning</SelectItem>
                  <SelectItem value="Deep Cleaning">Deep Cleaning</SelectItem>
                  <SelectItem value="End of Tenancy">End of Tenancy</SelectItem>
                  <SelectItem value="Office Cleaning">Office Cleaning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cleaningType">Cleaning Type</Label>
              <Select value={formData.cleaningType} onValueChange={(value) => handleInputChange('cleaningType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cleaning type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="One-off">One-off</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Fortnightly">Fortnightly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Property Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Full Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postcode">Postcode *</Label>
              <Input
                id="postcode"
                value={formData.postcode}
                onChange={(e) => handleInputChange('postcode', e.target.value)}
                required
              />
            </div>
          </div>
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

export default BookingForm;
