import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, MapPin, Clock } from 'lucide-react';
import { useAirbnbPricing } from '@/hooks/useAirbnbPricing';
import AirbnbCostCalculator from './AirbnbCostCalculator';

interface ModernAirbnbBookingFormProps {
  customerData: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  onBookingCreated: () => void;
}

interface FormData {
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  serviceType: string;
  cleaningProducts: string;
  linensHandling: string;
  ironingRequired: boolean;
  selectedDate: Date | undefined;
  selectedTime: string;
  address: string;
  postcode: string;
  propertyDetails: string;
  additionalDetails: string;
  isSameDayCleaning: boolean;
}

const ModernAirbnbBookingForm: React.FC<ModernAirbnbBookingFormProps> = ({ 
  customerData, 
  onBookingCreated 
}) => {
  const { toast } = useToast();
  const { calculateCost, loading: pricingLoading } = useAirbnbPricing();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
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
    isSameDayCleaning: false
  });

  // Calculate cost whenever form data changes
  const costBreakdown = calculateCost(formData);

  const propertyTypes = [
    { value: 'flat', label: 'Flat', icon: '🏠' },
    { value: 'house', label: 'House', icon: '🏡' },
    { value: 'studio', label: 'Studio', icon: '🏢' }
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
    { value: 'check_in_out', label: 'Check In / Out', description: 'Complete turnover cleaning between guests' },
    { value: 'mid_stay', label: 'Mid Stay', description: 'Maintenance cleaning during guest stay' },
    { value: 'light_cleaning', label: 'Light Cleaning', description: 'Quick refresh for recently cleaned properties' },
    { value: 'deep_cleaning', label: 'Deep Cleaning', description: 'Thorough cleaning for extended occupancy' }
  ];

  const cleaningProductsOptions = [
    { value: 'i_provide', label: "I'll Provide Products" },
    { value: 'bring_own', label: 'Bring Products (+£10)' }
  ];

  const linensOptions = [
    { value: 'delivered', label: 'Delivered to property' },
    { value: 'wash_hang', label: 'Wash and hang to dry' },
    { value: 'wash_dry', label: 'Wash and machine dry' }
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  // Check if selected date is same day
  useEffect(() => {
    if (formData.selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDay = new Date(formData.selectedDate);
      selectedDay.setHours(0, 0, 0, 0);
      
      const isSameDay = selectedDay.getTime() === today.getTime();
      if (isSameDay !== formData.isSameDayCleaning) {
        setFormData(prev => ({ ...prev, isSameDayCleaning: isSameDay }));
      }
    }
  }, [formData.selectedDate]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

      const [hours, minutes] = formData.selectedTime.split(':');
      const dateTime = new Date(formData.selectedDate);
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const propertyDetails = `Property: ${formData.propertyType} • ${formData.bedrooms} bed • ${formData.bathrooms} bath`;
      
      let additionalDetails = `Service: ${serviceTypes.find(st => st.value === formData.serviceType)?.label}\n`;
      additionalDetails += `Products: ${cleaningProductsOptions.find(opt => opt.value === formData.cleaningProducts)?.label}\n`;
      additionalDetails += `Linens: ${linensOptions.find(opt => opt.value === formData.linensHandling)?.label}\n`;
      additionalDetails += `Ironing: ${formData.ironingRequired ? 'Yes' : 'No'}\n`;
      if (formData.additionalDetails) {
        additionalDetails += `\nNotes: ${formData.additionalDetails}`;
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
        total_cost: costBreakdown.total,
        payment_method: 'Online',
        payment_status: 'Unpaid',
        booking_status: 'Confirmed',
        frequently: formData.isSameDayCleaning ? 'Same Day' : null,
        same_day: formData.isSameDayCleaning
      };

      const { error } = await supabase
        .from('bookings')
        .insert([bookingData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your Airbnb cleaning booking has been created successfully!",
      });

      onBookingCreated();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Details */}
            <Card className="border-border shadow-sm">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Property Details</h2>
                  
                  {/* Property Type */}
                  <div className="space-y-3 mb-6">
                    <Label className="text-sm font-medium text-foreground">
                      Property Type <span className="text-destructive">*</span>
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {propertyTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => handleInputChange('propertyType', type.value)}
                          className={cn(
                            "p-4 rounded-lg border-2 text-center transition-all hover:shadow-sm",
                            formData.propertyType === type.value
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border hover:border-muted-foreground/30 text-muted-foreground"
                          )}
                        >
                          <div className="text-2xl mb-1">{type.icon}</div>
                          <div className="text-sm">{type.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bedrooms and Bathrooms */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">
                        Bedrooms <span className="text-destructive">*</span>
                      </Label>
                      <Select value={formData.bedrooms} onValueChange={(value) => handleInputChange('bedrooms', value)}>
                        <SelectTrigger className="h-11 border-border">
                          <SelectValue placeholder="Select bedrooms" />
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

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">
                        Bathrooms <span className="text-destructive">*</span>
                      </Label>
                      <Select value={formData.bathrooms} onValueChange={(value) => handleInputChange('bathrooms', value)}>
                        <SelectTrigger className="h-11 border-border">
                          <SelectValue placeholder="Select bathrooms" />
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
                </div>
              </CardContent>
            </Card>

            {/* Service Details */}
            <Card className="border-border shadow-sm">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-xl font-semibold text-foreground">Service Details</h2>
                
                {/* Service Type */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">
                    Service Type <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {serviceTypes.map((service) => (
                      <button
                        key={service.value}
                        type="button"
                        onClick={() => handleInputChange('serviceType', service.value)}
                        className={cn(
                          "p-4 rounded-lg border-2 text-left transition-all hover:shadow-sm",
                          formData.serviceType === service.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-muted-foreground/30"
                        )}
                      >
                        <div className="font-medium text-foreground">{service.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{service.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">Cleaning Products</Label>
                    <Select value={formData.cleaningProducts} onValueChange={(value) => handleInputChange('cleaningProducts', value)}>
                      <SelectTrigger className="h-11 border-border">
                        <SelectValue placeholder="Choose option" />
                      </SelectTrigger>
                      <SelectContent>
                        {cleaningProductsOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">Linen Handling</Label>
                    <Select value={formData.linensHandling} onValueChange={(value) => handleInputChange('linensHandling', value)}>
                      <SelectTrigger className="h-11 border-border">
                        <SelectValue placeholder="Choose option" />
                      </SelectTrigger>
                      <SelectContent>
                        {linensOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Ironing Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ironing"
                    checked={formData.ironingRequired}
                    onCheckedChange={(checked) => handleInputChange('ironingRequired', !!checked)}
                  />
                  <Label htmlFor="ironing" className="text-sm font-medium text-foreground">
                    Include ironing service (+£15)
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card className="border-border shadow-sm">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-xl font-semibold text-foreground">Booking Details</h2>
                
                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">
                      Date <span className="text-destructive">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-11 justify-start text-left font-normal border-border",
                            !formData.selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.selectedDate ? format(formData.selectedDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">
                      Time <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.selectedTime} onValueChange={(value) => handleInputChange('selectedTime', value)}>
                      <SelectTrigger className="h-11 border-border">
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
                </div>

                {/* Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">
                      Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Enter property address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="h-11 border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">
                      Postcode <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Enter postcode"
                      value={formData.postcode}
                      onChange={(e) => handleInputChange('postcode', e.target.value)}
                      className="h-11 border-border"
                    />
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Additional Notes</Label>
                  <Textarea
                    placeholder="Any special requirements or instructions..."
                    value={formData.additionalDetails}
                    onChange={(e) => handleInputChange('additionalDetails', e.target.value)}
                    className="min-h-20 border-border resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-base font-medium"
              disabled={loading || pricingLoading}
            >
              {loading ? 'Creating Booking...' : 'Book Now'}
            </Button>
          </div>

          {/* Cost Calculator Sidebar */}
          <div className="lg:col-span-1">
            <AirbnbCostCalculator
              breakdown={costBreakdown}
              selectedOptions={formData}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModernAirbnbBookingForm;