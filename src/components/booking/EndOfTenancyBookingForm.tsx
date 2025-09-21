import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Home, Bath, Bed, Utensils, Car, BookOpen, Sun, Trees, Trash2, Building, Building2, Users, Sofa, ChefHat, Blinds, Package, Armchair, BedDouble, Calendar as CalendarIcon, Mail, Phone, MapPin } from 'lucide-react';
import CustomerSelector from './CustomerSelector';
import { BookingSidebar } from './BookingSidebar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EndOfTenancyBookingFormProps {
  children: React.ReactNode;
  onSubmit?: (bookingData: any) => void;
}

const propertyTypes = [
  { id: 'apartment', icon: Building, label: 'Apartment' },
  { id: 'house', icon: Home, label: 'House' },
  { id: 'shared_house', icon: Users, label: 'Shared House' }
];

const propertyConditions = [
  { id: 'well_maintained', label: 'Well-Maintained' },
  { id: 'moderate', label: 'Moderate Condition' },
  { id: 'heavily_used', label: 'Heavily Used' },
  { id: 'intensive_required', label: 'Intensive Cleaning Required' }
];

const propertyStatuses = [
  { id: 'furnished', label: 'Furnished' },
  { id: 'unfurnished', label: 'Unfurnished' },
  { id: 'part_furnished', label: 'Part Furnished' }
];

const ovenTypes = [
  { id: 'no_oven', label: 'No Oven Cleaning Required' },
  { id: 'single', label: 'Single Oven' },
  { id: 'single_convection', label: 'Single & Convection Oven' },
  { id: 'double', label: 'Double Oven' },
  { id: 'range', label: 'Range Oven' },
  { id: 'aga', label: 'AGA Oven' }
];

const additionalFeatures = [
  { id: 'utility_room', icon: Car, label: 'Utility Room' },
  { id: 'conservatory', icon: Sun, label: 'Conservatory' },
  { id: 'separate_kitchen_living', icon: Home, label: 'Separate Kitchen/Living Room' },
  { id: 'dining_room', icon: Utensils, label: 'Dining Room' },
  { id: 'study_room', icon: BookOpen, label: 'Study Room' },
  { id: 'other_room', icon: Building, label: 'Any Other Additional Room' }
];

const blindsOptions = [
  { id: 'small', label: 'Small Blinds/Shutters', size: '60cm x 120cm' },
  { id: 'medium', label: 'Medium Blinds/Shutters', size: '100cm x 160cm' },
  { id: 'large', label: 'Large Blinds/Shutters', size: '140cm x 220cm' }
];

const extraServices = [
  { id: 'balcony', icon: Trees, label: 'Balcony Cleaning' },
  { id: 'waste_removal', icon: Trash2, label: 'Household Waste Removal' },
  { id: 'garage', icon: Car, label: 'Garage Cleaning' }
];

const carpetRooms = [
  { id: 'bedroom', icon: Bed, label: 'Bedroom' },
  { id: 'living_room', icon: Sofa, label: 'Living Room' },
  { id: 'dining_room', icon: Utensils, label: 'Dining Room' },
  { id: 'hallway', icon: Home, label: 'Hallway' },
  { id: 'staircase', icon: Building, label: 'Staircase' },
  { id: 'landing', icon: Home, label: 'Landing' }
];

const upholsteryOptions = [
  { id: 'two_seater', icon: Sofa, label: 'Two Seater Sofa' },
  { id: 'three_seater', icon: Sofa, label: 'Three Seater Sofa' },
  { id: 'four_seater', icon: Sofa, label: 'Four Seater or Corner Sofa' },
  { id: 'armchair', icon: Armchair, label: 'Armchair' },
  { id: 'dining_chair', icon: Utensils, label: 'Dining Chair' },
  { id: 'cushions', icon: Package, label: 'Cushions' },
  { id: 'curtains', icon: Blinds, label: 'Curtains Pair' }
];

const mattressOptions = [
  { id: 'single', icon: Bed, label: 'Single Mattress' },
  { id: 'double', icon: BedDouble, label: 'Double Mattress' },
  { id: 'king', icon: BedDouble, label: 'King Size Mattress' }
];

// Shared house specific options
const sharedHouseBedroomSizes = [
  { id: 'single_bedroom', label: 'Single Bedroom' },
  { id: 'double_bedroom', label: 'Double Bedroom' },
  { id: 'master_bedroom', label: 'Master Bedroom' }
];

const sharedHouseServices = [
  { id: 'bathroom', icon: Bath, label: 'Bathroom' },
  { id: 'single_oven_cleaning', icon: ChefHat, label: 'Single Oven Cleaning' },
  { id: 'kitchen_cupboards', icon: Package, label: 'Kitchen Cupboards' }
];

// Cleaning service types for conditional display
const cleaningServiceTypes = [
  { id: 'carpet_cleaning', label: 'Carpet Cleaning' },
  { id: 'upholstery_cleaning', label: 'Upholstery Cleaning' },
  { id: 'mattress_cleaning', label: 'Mattress Cleaning' }
];

export function EndOfTenancyBookingForm({ children, onSubmit }: EndOfTenancyBookingFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    // Customer info - will be set by CustomerSelector
    customer: null,
    
    // Property details
    property_type: '', // Initially empty
    property_condition: 'well_maintained',
    property_status: 'furnished',
    bedrooms: 1, // Changed to number
    bathrooms: 1,
    separate_wc: 0,
    oven_type: 'single',
    
    // Shared house specific
    shared_house_bedroom_size: 'single_bedroom',
    shared_house_services: [],
    
    // Additional features
    additional_features: [],
    
    // Services
    blinds_cleaning: [],
    extra_services: [],
    
    // Cleaning services selection
    enabled_cleaning_services: [],
    carpet_cleaning: [],
    upholstery_cleaning: [],
    mattress_cleaning: [],
    
    // Booking details
    preferred_date: null as Date | null,
    address: '',
    postcode: '',
    additional_notes: ''
  });

  const updateBasicField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateCount = (field: string, increment: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + (increment ? 1 : -1))
    }));
  };

  const toggleArrayItem = (arrayName: string, item: any) => {
    setFormData(prev => {
      const currentArray = prev[arrayName] || [];
      const existingIndex = currentArray.findIndex(existing => existing.id === item.id);
      
      if (existingIndex >= 0) {
        const existingItem = currentArray[existingIndex];
        const newQty = (existingItem.quantity || 1) + 1;
        
        return {
          ...prev,
          [arrayName]: currentArray.map((existing, index) =>
            index === existingIndex ? { ...existing, quantity: newQty } : existing
          )
        };
      } else {
        return {
          ...prev,
          [arrayName]: [...currentArray, { ...item, quantity: 1 }]
        };
      }
    });
  };

  const decrementArrayItem = (arrayName: string, itemId: string) => {
    setFormData(prev => {
      const currentArray = prev[arrayName] || [];
      const existingIndex = currentArray.findIndex(item => item.id === itemId);
      
      if (existingIndex >= 0) {
        const existingItem = currentArray[existingIndex];
        const newQty = (existingItem.quantity || 1) - 1;
        
        if (newQty <= 0) {
          return {
            ...prev,
            [arrayName]: currentArray.filter((_, index) => index !== existingIndex)
          };
        } else {
          return {
            ...prev,
            [arrayName]: currentArray.map((existing, index) =>
              index === existingIndex ? { ...existing, quantity: newQty } : existing
            )
          };
        }
      }
      return prev;
    });
  };

  const getItemQuantity = (arrayName: string, itemId: string) => {
    const currentArray = formData[arrayName] || [];
    const item = currentArray.find(item => item.id === itemId);
    return item ? item.quantity || 0 : 0;
  };

  const handleCustomerSelect = (customer: any) => {
    setFormData(prev => ({ 
      ...prev, 
      customer,
      // Auto-populate address fields if customer has address info
      address: customer?.address || prev.address,
      postcode: customer?.postcode || prev.postcode
    }));
  };

  const toggleServiceType = (serviceType: string) => {
    setFormData(prev => {
      const currentServices = prev.enabled_cleaning_services || [];
      const isEnabled = currentServices.includes(serviceType);
      
      if (isEnabled) {
        // Remove the service type and clear its selections
        return {
          ...prev,
          enabled_cleaning_services: currentServices.filter(s => s !== serviceType),
          [serviceType]: []
        };
      } else {
        // Add the service type
        return {
          ...prev,
          enabled_cleaning_services: [...currentServices, serviceType]
        };
      }
    });
  };

  const isServiceEnabled = (serviceType: string) => {
    return (formData.enabled_cleaning_services || []).includes(serviceType);
  };

  const handleSubmit = () => {
    if (onSubmit) {
      const bookingData = {
        ...formData,
        service_type: 'End of Tenancy',
        // Extract customer info for booking
        first_name: formData.customer?.first_name || '',
        last_name: formData.customer?.last_name || '',
        email: formData.customer?.email || '',
        phone: formData.customer?.phone || '',
        customer_id: formData.customer?.id
      };
      onSubmit(bookingData);
    }
    setOpen(false);
  };

  // Logic for bathroom constraints based on property type and bedrooms
  const getMaxBathrooms = () => {
    if (formData.property_type === 'apartment' && formData.bedrooms === 0) {
      return 1; // Studio apartment
    }
    return 10; // No real limit for other types
  };

  const getMaxBedrooms = () => {
    if (formData.property_type === 'apartment') return 5;
    if (formData.property_type === 'house') return 8;
    return 1; // Shared house has only 1 bedroom size selection
  };

  const shouldShowOven = () => {
    return formData.property_type !== '' && 
           formData.property_type !== 'shared_house' && 
           !(formData.property_type === 'apartment' && formData.bedrooms === 0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-full h-[95vh] max-w-[95vw] lg:max-w-7xl p-0 overflow-hidden">
        <DialogHeader className="p-4 lg:p-6 border-b bg-gradient-to-r from-primary/5 to-primary-light/5">
          <DialogTitle className="text-xl lg:text-2xl font-bold flex items-center gap-3 text-primary">
            <Home className="w-5 h-5 lg:w-6 lg:h-6" />
            End of Tenancy Cleaning
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 h-[calc(95vh-80px)] lg:h-[calc(95vh-120px)]">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="property" className="w-full h-full flex flex-col">
              {formData.property_type && (
                <TabsList className="grid w-full grid-cols-5 mx-4 lg:mx-6 mt-4 mb-2 lg:mb-4 h-9 lg:h-10 text-xs lg:text-sm">
                  <TabsTrigger value="property" className="px-2 lg:px-4">Property</TabsTrigger>
                  <TabsTrigger value="customer" className="px-2 lg:px-4">Customer</TabsTrigger>
                  <TabsTrigger value="features" className="px-2 lg:px-4">Rooms</TabsTrigger>
                  <TabsTrigger value="cleaning" className="px-2 lg:px-4">Services</TabsTrigger>
                  <TabsTrigger value="datetime" className="px-2 lg:px-4">Date</TabsTrigger>
                </TabsList>
              )}
              
              <div className="flex-1 overflow-y-auto px-4 lg:px-6">
                {/* Property Details */}
                <TabsContent value="property" className="space-y-4 lg:space-y-6 mt-0">
                  <div className="space-y-4 lg:space-y-6">
                    {/* Property Type Selection */}
                    <Card className="border-0 lg:border shadow-none lg:shadow-sm">
                      <CardContent className="p-4 lg:p-6">
                        <h3 className="text-lg lg:text-xl font-bold mb-4 lg:mb-6 text-primary flex items-center gap-2">
                          <Building className="w-5 h-5" />
                          Select Property Type
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
                          {propertyTypes.map(type => {
                            const Icon = type.icon;
                            return (
                              <Button
                                key={type.id}
                                variant={formData.property_type === type.id ? "default" : "outline"}
                                className="h-20 lg:h-24 flex-col gap-2 lg:gap-3 text-sm lg:text-base font-medium hover:scale-105 transition-transform"
                                onClick={() => updateBasicField('property_type', type.id)}
                              >
                                <Icon className="w-8 h-8 lg:w-10 lg:h-10" />
                                {type.label}
                              </Button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Property Condition & Status - Only show after property type is selected */}
                    {formData.property_type && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                        <Card className="border-0 lg:border shadow-none lg:shadow-sm">
                          <CardContent className="p-4">
                            <Label className="text-sm font-semibold mb-3 block text-primary flex items-center gap-2">
                              <Home className="w-4 h-4" />
                              Property Condition
                            </Label>
                            <Select 
                              value={formData.property_condition} 
                              onValueChange={(value) => updateBasicField('property_condition', value)}
                            >
                              <SelectTrigger className="h-12">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {propertyConditions.map(condition => (
                                  <SelectItem key={condition.id} value={condition.id}>
                                    {condition.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </CardContent>
                        </Card>

                        <Card className="border-0 lg:border shadow-none lg:shadow-sm">
                          <CardContent className="p-4">
                            <Label className="text-sm font-semibold mb-3 block text-primary flex items-center gap-2">
                              <Package className="w-4 h-4" />
                              Furnished Status
                            </Label>
                            <Select 
                              value={formData.property_status} 
                              onValueChange={(value) => updateBasicField('property_status', value)}
                            >
                              <SelectTrigger className="h-12">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {propertyStatuses.map(status => (
                                  <SelectItem key={status.id} value={status.id}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Room Configuration - show after property type is selected */}
                    {formData.property_type && (
                      <Card className="border-0 lg:border shadow-none lg:shadow-sm">
                        <CardContent className="p-4 lg:p-6">
                          <h3 className="text-lg lg:text-xl font-bold mb-4 lg:mb-6 text-primary flex items-center gap-2">
                            <Bed className="w-5 h-5" />
                            Room Configuration
                          </h3>
                          
                          {/* Bedrooms - number input for apartments and houses */}
                          {(formData.property_type === 'apartment' || formData.property_type === 'house') && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 mb-4 lg:mb-6">
                              <div className="flex items-center justify-between p-4 border rounded-xl bg-gradient-to-r from-background to-muted/20">
                                <div className="flex items-center gap-2 lg:gap-3">
                                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Bed className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                                  </div>
                                  <span className="font-semibold text-sm lg:text-base">Bedrooms</span>
                                </div>
                                <div className="flex items-center gap-2 lg:gap-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateCount('bedrooms', false)}
                                    disabled={formData.bedrooms <= 0}
                                    className="h-8 w-8 lg:h-10 lg:w-10 p-0 rounded-full hover:scale-110 transition-transform"
                                  >
                                    <Minus className="w-3 h-3 lg:w-4 lg:h-4" />
                                  </Button>
                                  <Badge variant="secondary" className="min-w-[3rem] lg:min-w-[3.5rem] justify-center text-sm lg:text-base font-bold px-3 py-2">
                                    {formData.bedrooms === 0 ? 'Studio' : formData.bedrooms}
                                  </Badge>
                                  <Button
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => updateCount('bedrooms', true)}
                                    disabled={formData.bedrooms >= getMaxBedrooms()}
                                    className="h-8 w-8 lg:h-10 lg:w-10 p-0 rounded-full hover:scale-110 transition-transform"
                                  >
                                    <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Bath className="w-5 h-5 text-primary" />
                                  <span className="font-medium">Bathrooms</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateCount('bathrooms', false)}
                                    disabled={formData.bathrooms <= 1}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <Badge variant="secondary" className="min-w-[2.5rem] justify-center text-sm">
                                    {formData.bathrooms}
                                  </Badge>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateCount('bathrooms', true)}
                                    disabled={formData.bathrooms >= getMaxBathrooms()}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Building className="w-5 h-5 text-primary" />
                                  <span className="font-medium">Separate WC</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateCount('separate_wc', false)}
                                    disabled={formData.separate_wc <= 0}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <Badge variant="secondary" className="min-w-[2.5rem] justify-center text-sm">
                                    {formData.separate_wc}
                                  </Badge>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateCount('separate_wc', true)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Shared House Bedroom Size */}
                          {formData.property_type === 'shared_house' && (
                            <div className="mb-6">
                              <Label className="text-sm font-medium mb-3 block">Bedroom Size</Label>
                              <div className="grid grid-cols-3 gap-3">
                                {sharedHouseBedroomSizes.map(size => (
                                  <Button
                                    key={size.id}
                                    variant={formData.shared_house_bedroom_size === size.id ? "default" : "outline"}
                                    className="h-12"
                                    onClick={() => updateBasicField('shared_house_bedroom_size', size.id)}
                                  >
                                    {size.label}
                                  </Button>
                                ))}
                              </div>

                              {/* Additional Services for Shared House */}
                              <div className="mt-4">
                                <Label className="text-sm font-medium mb-3 block">Additional Services</Label>
                                <div className="grid grid-cols-3 gap-3">
                                  {sharedHouseServices.map(service => {
                                    const Icon = service.icon;
                                    const isSelected = formData.shared_house_services.some(s => s.id === service.id);
                                    return (
                                      <Button
                                        key={service.id}
                                        variant={isSelected ? "default" : "outline"}
                                        className="h-12 justify-start gap-2"
                                        onClick={() => toggleArrayItem('shared_house_services', service)}
                                      >
                                        <Icon className="w-4 h-4" />
                                        {service.label}
                                      </Button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Oven Type - Only show when appropriate */}
                          {shouldShowOven() && (
                            <div>
                              <Label className="text-sm font-medium mb-3 block">Oven Type</Label>
                              <Select 
                                value={formData.oven_type} 
                                onValueChange={(value) => updateBasicField('oven_type', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ovenTypes.map(oven => (
                                    <SelectItem key={oven.id} value={oven.id}>
                                      {oven.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                {/* Customer Information */}
                <TabsContent value="customer" className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <CustomerSelector onCustomerSelect={handleCustomerSelect} />
                      
                      {formData.customer && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Selected Customer
                          </h4>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              <span>{formData.customer.first_name} {formData.customer.last_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              <span>{formData.customer.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3" />
                              <span>{formData.customer.phone}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-6 space-y-4">
                        <div>
                          <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Property Address
                          </Label>
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => updateBasicField('address', e.target.value)}
                            placeholder="Enter full property address"
                            className="mt-2"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="postcode" className="text-sm font-medium">Postcode</Label>
                          <Input
                            id="postcode"
                            value={formData.postcode}
                            onChange={(e) => updateBasicField('postcode', e.target.value)}
                            placeholder="Enter postcode"
                            className="w-40 mt-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Additional Features */}
                <TabsContent value="features" className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Additional Rooms</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {additionalFeatures.map(feature => {
                          const Icon = feature.icon;
                          const quantity = getItemQuantity('additional_features', feature.id);
                          const isSelected = quantity > 0;
                          
                          return (
                            <div key={feature.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <Button
                                variant={isSelected ? "default" : "outline"}
                                className="flex-1 justify-start gap-2"
                                onClick={() => toggleArrayItem('additional_features', feature)}
                              >
                                <Icon className="w-4 h-4" />
                                {feature.label}
                              </Button>
                              {isSelected && (
                                <div className="flex items-center gap-1 ml-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => decrementArrayItem('additional_features', feature.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <Badge variant="secondary" className="min-w-[1.5rem] justify-center text-xs">
                                    {quantity}
                                  </Badge>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleArrayItem('additional_features', feature)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Blinds Cleaning */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Blinds Cleaning</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {blindsOptions.map(blind => {
                          const quantity = getItemQuantity('blinds_cleaning', blind.id);
                          const isSelected = quantity > 0;
                          
                          return (
                            <div key={blind.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <Button
                                variant={isSelected ? "default" : "outline"}
                                className="flex-1 justify-start"
                                onClick={() => toggleArrayItem('blinds_cleaning', blind)}
                              >
                                <div className="text-left">
                                  <div>{blind.label}</div>
                                  <div className="text-xs text-muted-foreground">{blind.size}</div>
                                </div>
                              </Button>
                              {isSelected && (
                                <div className="flex items-center gap-1 ml-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => decrementArrayItem('blinds_cleaning', blind.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <Badge variant="secondary" className="min-w-[1.5rem] justify-center text-xs">
                                    {quantity}
                                  </Badge>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleArrayItem('blinds_cleaning', blind)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Extra Services */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Extra Services</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {extraServices.map(service => {
                          const Icon = service.icon;
                          const quantity = getItemQuantity('extra_services', service.id);
                          const isSelected = quantity > 0;
                          
                          return (
                            <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <Button
                                variant={isSelected ? "default" : "outline"}
                                className="flex-1 justify-start gap-2"
                                onClick={() => toggleArrayItem('extra_services', service)}
                              >
                                <Icon className="w-4 h-4" />
                                {service.label}
                              </Button>
                              {isSelected && (
                                <div className="flex items-center gap-1 ml-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => decrementArrayItem('extra_services', service.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <Badge variant="secondary" className="min-w-[1.5rem] justify-center text-xs">
                                    {quantity}
                                  </Badge>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleArrayItem('extra_services', service)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Cleaning Services */}
                <TabsContent value="cleaning" className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Do you need any of the following cleaning services?</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {cleaningServiceTypes.map(serviceType => (
                          <Button
                            key={serviceType.id}
                            variant={isServiceEnabled(serviceType.id) ? "default" : "outline"}
                            className="h-12"
                            onClick={() => toggleServiceType(serviceType.id)}
                          >
                            {serviceType.label}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Carpet Cleaning - only show if enabled */}
                  {isServiceEnabled('carpet_cleaning') && (
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Carpet Cleaning</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {carpetRooms.map(room => {
                            const Icon = room.icon;
                            const quantity = getItemQuantity('carpet_cleaning', room.id);
                            const isSelected = quantity > 0;
                            
                            return (
                              <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <Button
                                  variant={isSelected ? "default" : "outline"}
                                  className="flex-1 justify-start gap-2"
                                  onClick={() => toggleArrayItem('carpet_cleaning', room)}
                                >
                                  <Icon className="w-4 h-4" />
                                  {room.label}
                                </Button>
                                {isSelected && (
                                  <div className="flex items-center gap-1 ml-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => decrementArrayItem('carpet_cleaning', room.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <Badge variant="secondary" className="min-w-[1.5rem] justify-center text-xs">
                                      {quantity}
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleArrayItem('carpet_cleaning', room)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Upholstery Cleaning - only show if enabled */}
                  {isServiceEnabled('upholstery_cleaning') && (
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Upholstery Cleaning</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {upholsteryOptions.map(item => {
                            const Icon = item.icon;
                            const quantity = getItemQuantity('upholstery_cleaning', item.id);
                            const isSelected = quantity > 0;
                            
                            return (
                              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <Button
                                  variant={isSelected ? "default" : "outline"}
                                  className="flex-1 justify-start gap-2"
                                  onClick={() => toggleArrayItem('upholstery_cleaning', item)}
                                >
                                  <Icon className="w-4 h-4" />
                                  {item.label}
                                </Button>
                                {isSelected && (
                                  <div className="flex items-center gap-1 ml-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => decrementArrayItem('upholstery_cleaning', item.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <Badge variant="secondary" className="min-w-[1.5rem] justify-center text-xs">
                                      {quantity}
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleArrayItem('upholstery_cleaning', item)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Mattress Cleaning - only show if enabled */}
                  {isServiceEnabled('mattress_cleaning') && (
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Mattress Cleaning</h3>
                        <div className="grid grid-cols-3 gap-3">
                          {mattressOptions.map(mattress => {
                            const Icon = mattress.icon;
                            const quantity = getItemQuantity('mattress_cleaning', mattress.id);
                            const isSelected = quantity > 0;
                            
                            return (
                              <div key={mattress.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <Button
                                  variant={isSelected ? "default" : "outline"}
                                  className="flex-1 justify-start gap-2"
                                  onClick={() => toggleArrayItem('mattress_cleaning', mattress)}
                                >
                                  <Icon className="w-4 h-4" />
                                  {mattress.label}
                                </Button>
                                {isSelected && (
                                  <div className="flex items-center gap-1 ml-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => decrementArrayItem('mattress_cleaning', mattress.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <Badge variant="secondary" className="min-w-[1.5rem] justify-center text-xs">
                                      {quantity}
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleArrayItem('mattress_cleaning', mattress)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Date & Time */}
                <TabsContent value="datetime" className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        Date & Time
                      </h3>
                      
                      <div className="space-y-6">
                        <div>
                          <Label className="text-sm font-medium mb-3 block">Preferred Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-12 justify-start text-left font-normal",
                                  !formData.preferred_date && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-3 h-5 w-5" />
                                {formData.preferred_date ? (
                                  format(formData.preferred_date, "EEEE, MMMM do, yyyy")
                                ) : (
                                  <span>Select your preferred date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={formData.preferred_date || undefined}
                                onSelect={(date) => updateBasicField('preferred_date', date)}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div>
                          <Label htmlFor="notes" className="text-sm font-medium mb-3 block">Additional Notes</Label>
                          <Textarea
                            id="notes"
                            value={formData.additional_notes}
                            onChange={(e) => updateBasicField('additional_notes', e.target.value)}
                            placeholder="Any special requirements, access instructions, or additional information..."
                            rows={4}
                            className="resize-none"
                          />
                        </div>
                        
                        <div className="hidden lg:block">
                          <Button onClick={handleSubmit} className="w-full h-12 text-lg font-semibold">
                            Create End of Tenancy Booking
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
          
          {/* Sidebar - Desktop only */}
          <div className="hidden lg:block lg:w-80 shrink-0">
            <BookingSidebar formData={formData} />
          </div>
        </div>

        {/* Mobile Summary Card */}
        <div className="lg:hidden border-t bg-background p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Estimated Total</p>
              <p className="text-2xl font-bold text-primary">£{(() => {
                let basePrice = 0;
                if (formData.property_type === 'apartment') {
                  if (formData.bedrooms === 0) basePrice = 80;
                  else basePrice = 80 + (formData.bedrooms * 25);
                } else if (formData.property_type === 'house') {
                  basePrice = 120 + (formData.bedrooms * 30);
                } else if (formData.property_type === 'shared_house') {
                  basePrice = 60;
                }
                basePrice += (formData.bathrooms - 1) * 20;
                basePrice += formData.separate_wc * 15;
                basePrice += (formData.additional_features?.length || 0) * 25;
                const carpetCount = formData.carpet_cleaning?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                const upholsteryCount = formData.upholstery_cleaning?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                const mattressCount = formData.mattress_cleaning?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                basePrice += carpetCount * 15;
                basePrice += upholsteryCount * 25;
                basePrice += mattressCount * 20;
                return basePrice;
              })()}</p>
            </div>
            <Button 
              onClick={handleSubmit}
              className="px-8 py-3 h-auto font-semibold"
              disabled={!formData.customer || !formData.property_type || !formData.preferred_date}
            >
              Create Booking
            </Button>
          </div>
        </div>

        {/* Desktop Submit Button */}
        <div className="hidden lg:flex justify-end gap-3 p-6 border-t bg-muted/20">
          <Button variant="outline" onClick={() => setOpen(false)} className="px-6">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="px-8"
            disabled={!formData.customer || !formData.property_type || !formData.preferred_date}
          >
            Create Booking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}