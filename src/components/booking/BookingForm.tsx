
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, User, MapPin, Clock, Banknote, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
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
  cleanerPaymentMethod: 'hourly' | 'percentage';
  cleanerHourlyRate: number;
  cleanerPercentageRate: number;
  
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
  carpetCleaning: boolean;
  
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
    cleanerPaymentMethod: 'percentage',
    cleanerHourlyRate: 0,
    cleanerPercentageRate: 70,
    dateTime: '',
    address: '',
    postcode: '',
    hoursRequired: 0,
    totalCost: 0,
    cleanerPay: 0,
    formName: 'Standard Cleaning',
    cleaningType: 'Domestic',
    propertyDetails: '',
    additionalDetails: '',
    carpetCleaning: false,
    paymentMethod: 'Cash',
    paymentStatus: 'Unpaid'
  });

  const handleInputChange = (field: keyof BookingData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerSelect = (customer: any) => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        firstName: customer.first_name || '',
        lastName: customer.last_name || '',
        email: customer.email || '',
        phoneNumber: customer.phone || ''
      }));
    } else {
      // Reset customer fields when no customer is selected
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
        cleanerPercentageRate: cleaner.presentage_rate || 70
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        cleanerId: null
      }));
    }
  };

  const calculateCleanerPay = () => {
    let cleanerPay = 0;
    
    if (formData.cleanerPaymentMethod === 'hourly') {
      cleanerPay = formData.hoursRequired * formData.cleanerHourlyRate;
    } else if (formData.cleanerPaymentMethod === 'percentage') {
      cleanerPay = (formData.totalCost * formData.cleanerPercentageRate) / 100;
    }
    
    setFormData(prev => ({
      ...prev,
      cleanerPay: cleanerPay
    }));
  };

  useEffect(() => {
    calculateCleanerPay();
  }, [formData.totalCost, formData.hoursRequired, formData.cleanerPaymentMethod, formData.cleanerHourlyRate, formData.cleanerPercentageRate]);

  const showCarpetCleaningOption = formData.formName === 'Deep Cleaning' || formData.formName === 'End of Tenancy';

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
        total_hours: formData.hoursRequired,
        total_cost: formData.totalCost,
        cleaner_pay: formData.cleanerPay,
        cleaner_rate: formData.cleanerPaymentMethod === 'hourly' ? formData.cleanerHourlyRate : null,
        cleaner_percentage: formData.cleanerPaymentMethod === 'percentage' ? formData.cleanerPercentageRate : null,
        form_name: formData.formName,
        cleaning_type: formData.cleaningType,
        property_details: formData.propertyDetails,
        additional_details: `${formData.additionalDetails}${formData.carpetCleaning ? ' - Carpet cleaning included' : ''}`,
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

      {/* Service Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Service Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="formName">Cleaning Service *</Label>
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
              <Label htmlFor="cleaningType">Property Type *</Label>
              <Select value={formData.cleaningType} onValueChange={(value) => handleInputChange('cleaningType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Domestic">Domestic</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Air BnB">Air BnB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {showCarpetCleaningOption && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="carpetCleaning"
                checked={formData.carpetCleaning}
                onCheckedChange={(checked) => handleInputChange('carpetCleaning', checked as boolean)}
              />
              <Label htmlFor="carpetCleaning">Include Carpet Cleaning</Label>
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
          <div>
            <Label htmlFor="postcode">Postcode *</Label>
            <Input
              id="postcode"
              value={formData.postcode}
              onChange={(e) => handleInputChange('postcode', e.target.value)}
              required
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

      {/* Cleaner Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Cleaner Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CleanerSelector onCleanerSelect={handleCleanerSelect} />
          
          {formData.cleanerId && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="cleanerPaymentMethod">Payment Method</Label>
                <Select 
                  value={formData.cleanerPaymentMethod} 
                  onValueChange={(value: 'hourly' | 'percentage') => handleInputChange('cleanerPaymentMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly Rate</SelectItem>
                    <SelectItem value="percentage">Percentage of Total</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {formData.cleanerPaymentMethod === 'hourly' ? (
                  <div>
                    <Label htmlFor="cleanerHourlyRate">Hourly Rate (£)</Label>
                    <Input
                      id="cleanerHourlyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cleanerHourlyRate}
                      onChange={(e) => handleInputChange('cleanerHourlyRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="cleanerPercentageRate">Percentage (%)</Label>
                    <Input
                      id="cleanerPercentageRate"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={formData.cleanerPercentageRate}
                      onChange={(e) => handleInputChange('cleanerPercentageRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
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
