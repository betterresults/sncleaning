import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Home, MapPin, Clock, PoundSterling } from 'lucide-react';

interface AirbnbBookingFormProps {
  customerData: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  onBookingCreated: () => void;
}

interface AirbnbFormData {
  // Property Details
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  
  // Service Details
  serviceType: string;
  cleaningProducts: string;
  linensHandling: string;
  ironingRequired: boolean;
  
  // Booking Details
  selectedDate: Date | undefined;
  selectedTime: string;
  address: string;
  postcode: string;
  
  // Additional Details
  propertyDetails: string;
  additionalDetails: string;
  
  // Cost
  totalCost: number;
  
  // Same day cleaning
  isSameDayCleaning: boolean;
}

const AirbnbBookingForm: React.FC<AirbnbBookingFormProps> = ({ customerData, onBookingCreated }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AirbnbFormData>({
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    serviceType: '',
    cleaningProducts: '',
    linensHandling: '',
    ironingRequired: false,
    selectedDate: undefined,
    selectedTime: '10:00',
    address: '',
    postcode: '',
    propertyDetails: '',
    additionalDetails: '',
    totalCost: 0,
    isSameDayCleaning: false
  });

  const propertyTypes = [
    { value: 'flat', label: 'Flat' },
    { value: 'house', label: 'House' },
    { value: 'studio', label: 'Studio' }
  ];

  const bedroomOptions = [
    { value: '1', label: '1 Bedroom' },
    { value: '2', label: '2 Bedrooms' },
    { value: '3', label: '3 Bedrooms' },
    { value: '4', label: '4 Bedrooms' },
    { value: '5', label: '5+ Bedrooms' }
  ];

  const bathroomOptions = [
    { value: '1', label: '1 Bathroom' },
    { value: '2', label: '2 Bathrooms' },
    { value: '3', label: '3 Bathrooms' },
    { value: '4', label: '4+ Bathrooms' }
  ];

  const serviceTypes = [
    { value: 'check_in_out', label: 'Check In / Out Cleaning', description: 'This service is for when guests are moving out and new guests are arriving. It ensures the property is thoroughly cleaned and ready for the next guests.' },
    { value: 'mid_stay', label: 'Mid Stay Cleaning', description: 'This option is for cleaning the property while guests are still staying there, ensuring it remains tidy and comfortable.' },
    { value: 'light_cleaning', label: 'Light Cleaning', description: 'This is a quick refresh of the property before new guests arrive, perfect if the property has been cleaned previously but has been vacant for a while.' },
    { value: 'deep_cleaning', label: 'Deep Cleaning', description: 'Ideal for properties that have been occupied for more than 3-4 weeks or haven\'t been cleaned professionally to Airbnb standard. This service involves a thorough and detailed cleaning.' }
  ];

  const cleaningProductsOptions = [
    { value: 'i_provide', label: "I'll Provide The Cleaning Products" },
    { value: 'bring_own', label: 'Bring The Cleaning Products' }
  ];

  const linensOptions = [
    { value: 'delivered', label: 'They will be delivered to the property' },
    { value: 'wash_hang', label: 'Wash in the property and hang to dry' },
    { value: 'wash_dry', label: 'Wash and dry in the property' }
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  // Calculate cost based on selections
  useEffect(() => {
    let basePrice = 0;
    
    // Base pricing logic (simplified - you can adjust based on your actual pricing)
    if (formData.propertyType && formData.bedrooms && formData.bathrooms && formData.serviceType) {
      const bedroomCount = parseInt(formData.bedrooms);
      const bathroomCount = parseInt(formData.bathrooms);
      
      // Base rates (adjust these according to your pricing)
      switch (formData.serviceType) {
        case 'check_in_out':
          basePrice = (bedroomCount * 15) + (bathroomCount * 10) + 30;
          break;
        case 'mid_stay':
          basePrice = (bedroomCount * 12) + (bathroomCount * 8) + 25;
          break;
        case 'light_cleaning':
          basePrice = (bedroomCount * 10) + (bathroomCount * 6) + 20;
          break;
        case 'deep_cleaning':
          basePrice = (bedroomCount * 20) + (bathroomCount * 15) + 40;
          break;
      }
      
      // Add cost for ironing
      if (formData.ironingRequired) {
        basePrice += 15;
      }
      
      // Same day cleaning surcharge
      if (formData.isSameDayCleaning) {
        basePrice *= 1.2; // 20% surcharge
      }
    }
    
    setFormData(prev => ({ ...prev, totalCost: Math.round(basePrice * 100) / 100 }));
  }, [formData.propertyType, formData.bedrooms, formData.bathrooms, formData.serviceType, formData.ironingRequired, formData.isSameDayCleaning]);

  const handleInputChange = (field: keyof AirbnbFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.selectedDate || !formData.propertyType || !formData.bedrooms || 
          !formData.bathrooms || !formData.serviceType || !formData.address || !formData.postcode) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create date and time
      const [hours, minutes] = formData.selectedTime.split(':');
      const dateTime = new Date(formData.selectedDate);
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Build property details
      const propertyDetails = `Property Type: ${formData.propertyType}\nBedrooms: ${formData.bedrooms}\nBathrooms: ${formData.bathrooms}`;
      
      // Build additional details
      let additionalDetails = '';
      if (formData.cleaningProducts) {
        additionalDetails += `Cleaning Products: ${cleaningProductsOptions.find(opt => opt.value === formData.cleaningProducts)?.label}\n`;
      }
      if (formData.linensHandling) {
        additionalDetails += `Linens: ${linensOptions.find(opt => opt.value === formData.linensHandling)?.label}\n`;
      }
      if (formData.ironingRequired) {
        additionalDetails += 'Ironing: Yes, please iron them\n';
      } else {
        additionalDetails += 'Ironing: No, ironing is not required\n';
      }
      if (formData.additionalDetails) {
        additionalDetails += `\nAdditional Notes: ${formData.additionalDetails}`;
      }

      const bookingData = {
        customer: customerData.id,
        first_name: customerData.first_name,
        last_name: customerData.last_name,
        email: customerData.email,
        phone_number: customerData.phone,
        date_time: dateTime.toISOString(),
        address: formData.address,
        postcode: formData.postcode,
        cleaning_type: serviceTypes.find(st => st.value === formData.serviceType)?.label || 'Check In / Out Cleaning',
        service_type: 'Air BnB',
        property_details: propertyDetails,
        additional_details: additionalDetails,
        total_cost: formData.totalCost,
        payment_method: 'Online',
        payment_status: 'Unpaid',
        booking_status: 'Confirmed',
        frequently: formData.isSameDayCleaning ? 'Same Day' : null,
        same_day: formData.isSameDayCleaning
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
        description: "Your Airbnb cleaning booking has been created successfully!",
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

  const selectedServiceType = serviceTypes.find(st => st.value === formData.serviceType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Get An Instant Airbnb Cleaning Quote & Book Online
          </h1>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-blue-600 h-2 rounded-full w-1/3"></div>
          </div>
          <span className="text-sm text-gray-600">33% Property Details</span>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Details */}
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">
                  Please Provide Details About The Property
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Property Type */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-gray-700">
                    Property Type <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    {propertyTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleInputChange('propertyType', type.value)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-center transition-all",
                          formData.propertyType === type.value
                            ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bedrooms and Bathrooms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold text-gray-700">
                      Bedrooms <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.bedrooms} onValueChange={(value) => handleInputChange('bedrooms', value)}>
                      <SelectTrigger className="h-12 text-gray-500">
                        <SelectValue placeholder="Choose an Option" />
                      </SelectTrigger>
                      <SelectContent>
                        {bedroomOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-lg font-semibold text-gray-700">
                      Bathrooms / Toilets <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.bathrooms} onValueChange={(value) => handleInputChange('bathrooms', value)}>
                      <SelectTrigger className="h-12 text-gray-500">
                        <SelectValue placeholder="Choose an Option" />
                      </SelectTrigger>
                      <SelectContent>
                        {bathroomOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Service Type */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-gray-700">
                    Service Type <span className="text-red-500">*</span>
                  </Label>
                  <div className="text-sm text-gray-600 mb-4">
                    {selectedServiceType?.description}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {serviceTypes.map((service) => (
                      <button
                        key={service.value}
                        type="button"
                        onClick={() => handleInputChange('serviceType', service.value)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-center transition-all",
                          formData.serviceType === service.value
                            ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                        )}
                      >
                        {service.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cleaning Products */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-gray-700">
                    Can You Provide The Cleaning Products & Equipment <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cleaningProductsOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange('cleaningProducts', option.value)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-center transition-all",
                          formData.cleaningProducts === option.value
                            ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Linens Handling */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-gray-700">
                    How would you like the linens to be handled? <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-gray-600">
                    Please note: At the moment, we do not offer a linen delivery or rental service. However, we can handle washing, drying and ironing the linens directly at the property if needed, following the options provided.
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {linensOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange('linensHandling', option.value)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all",
                          formData.linensHandling === option.value
                            ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ironing */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-gray-700">
                    Do you need the linens to be ironed? <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleInputChange('ironingRequired', true)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-center transition-all",
                        formData.ironingRequired
                          ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      )}
                    >
                      Yes, please iron them
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('ironingRequired', false)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-center transition-all",
                        !formData.ironingRequired
                          ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      )}
                    >
                      No, ironing is not required
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date, Time & Address */}
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <CalendarIcon className="h-6 w-6" />
                  Date, Time & Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12",
                          !formData.selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.selectedDate ? format(formData.selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.selectedDate}
                        onSelect={(date) => handleInputChange('selectedDate', date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Time *</Label>
                  <Select value={formData.selectedTime} onValueChange={(value) => handleInputChange('selectedTime', value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Same Day Cleaning */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sameDayCleaning"
                    checked={formData.isSameDayCleaning}
                    onCheckedChange={(checked) => handleInputChange('isSameDayCleaning', checked)}
                  />
                  <Label htmlFor="sameDayCleaning" className="text-sm">
                    Same day cleaning (+20% surcharge)
                  </Label>
                </div>

                {/* Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Address *</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="h-12"
                      placeholder="Property address"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Postcode *</Label>
                    <Input
                      value={formData.postcode}
                      onChange={(e) => handleInputChange('postcode', e.target.value)}
                      className="h-12"
                      placeholder="Postcode"
                      required
                    />
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Additional Details</Label>
                  <Textarea
                    value={formData.additionalDetails}
                    onChange={(e) => handleInputChange('additionalDetails', e.target.value)}
                    placeholder="Any special instructions or notes..."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => window.history.back()}>
                Back
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 bg-teal-600 hover:bg-teal-700 text-white"
                disabled={loading}
              >
                {loading ? 'Creating Booking...' : 'Continue'}
              </Button>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 border-0 shadow-xl bg-gradient-to-br from-teal-600 to-teal-700 text-white">
              <CardHeader>
                <CardTitle className="text-xl">Airbnb Cleaning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.serviceType && (
                  <div>
                    <h4 className="font-semibold mb-2">Service Details:</h4>
                    <p className="text-sm opacity-90">
                      {serviceTypes.find(st => st.value === formData.serviceType)?.label}
                    </p>
                    {formData.propertyType && (
                      <p className="text-sm opacity-90">
                        {propertyTypes.find(pt => pt.value === formData.propertyType)?.label}
                        {formData.bedrooms && ` • ${formData.bedrooms} Bedrooms`}
                        {formData.bathrooms && ` • ${formData.bathrooms} Bathrooms`}
                      </p>
                    )}
                    {formData.cleaningProducts && (
                      <p className="text-sm opacity-90">
                        {cleaningProductsOptions.find(cp => cp.value === formData.cleaningProducts)?.label}
                      </p>
                    )}
                    {formData.linensHandling && (
                      <p className="text-sm opacity-90">
                        {linensOptions.find(lo => lo.value === formData.linensHandling)?.label}
                      </p>
                    )}
                  </div>
                )}
                
                <Separator className="bg-white/20" />
                
                <div>
                  <h4 className="font-bold text-xl">
                    Total Cost: £{formData.totalCost.toFixed(2)}
                  </h4>
                  {formData.isSameDayCleaning && (
                    <p className="text-sm opacity-90">Includes same day surcharge</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="couponCode" />
                  <Label htmlFor="couponCode" className="text-sm">
                    I have a coupon code
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AirbnbBookingForm;