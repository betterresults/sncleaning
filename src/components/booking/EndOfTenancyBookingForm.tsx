import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Home, Bath, Bed, Utensils, Car, BookOpen, Sun, Trees, Trash2, Building, Building2, Users, Sofa, ChefHat, Blinds, Package, Armchair, BedDouble, Calendar as CalendarIcon, Mail, Phone, MapPin, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
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
  { id: 'apartment', icon: Building, label: 'Apartment', color: 'bg-blue-500', colorLight: 'bg-blue-50' },
  { id: 'house', icon: Home, label: 'House', color: 'bg-green-500', colorLight: 'bg-green-50' },
  { id: 'shared_house', icon: Users, label: 'Shared House', color: 'bg-orange-500', colorLight: 'bg-orange-50' }
];

const apartmentTypes = [
  { id: 'studio', label: 'Studio Apartment', bedrooms: 0 },
  { id: '1bed', label: '1 Bedroom', bedrooms: 1 },
  { id: '2bed', label: '2 Bedrooms', bedrooms: 2 },
  { id: '3bed', label: '3 Bedrooms', bedrooms: 3 },
  { id: '4bed', label: '4+ Bedrooms', bedrooms: 4 }
];

const propertyConditions = [
  { id: 'well_maintained', label: 'Well-Maintained', icon: CheckCircle2, color: 'text-green-600' },
  { id: 'moderate', label: 'Moderate Condition', icon: Clock, color: 'text-yellow-600' },
  { id: 'heavily_used', label: 'Heavily Used', icon: Trash2, color: 'text-orange-600' },
  { id: 'intensive_required', label: 'Intensive Cleaning Required', icon: Sparkles, color: 'text-red-600' }
];

const propertyStatuses = [
  { id: 'furnished', label: 'Furnished', icon: Sofa },
  { id: 'unfurnished', label: 'Unfurnished', icon: Home },
  { id: 'part_furnished', label: 'Part Furnished', icon: Package }
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
  { id: 'utility_room', icon: Car, label: 'Utility Room', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'conservatory', icon: Sun, label: 'Conservatory', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'separate_kitchen_living', icon: Home, label: 'Separate Kitchen/Living Room', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'dining_room', icon: Utensils, label: 'Dining Room', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'study_room', icon: BookOpen, label: 'Study Room', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { id: 'other_room', icon: Building, label: 'Any Other Additional Room', color: 'bg-gray-100 text-gray-700 border-gray-200' }
];

const blindsOptions = [
  { id: 'small', label: 'Small Blinds/Shutters', size: '60cm x 120cm' },
  { id: 'medium', label: 'Medium Blinds/Shutters', size: '100cm x 160cm' },
  { id: 'large', label: 'Large Blinds/Shutters', size: '140cm x 220cm' }
];

const extraServices = [
  { id: 'balcony', icon: Trees, label: 'Balcony Cleaning', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'waste_removal', icon: Trash2, label: 'Household Waste Removal', color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'garage', icon: Car, label: 'Garage Cleaning', color: 'bg-gray-100 text-gray-700 border-gray-200' }
];

const carpetRooms = [
  { id: 'bedroom', icon: Bed, label: 'Bedroom', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'living_room', icon: Sofa, label: 'Living Room', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'dining_room', icon: Utensils, label: 'Dining Room', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'hallway', icon: Home, label: 'Hallway', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'staircase', icon: Building, label: 'Staircase', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { id: 'landing', icon: Home, label: 'Landing', color: 'bg-pink-100 text-pink-700 border-pink-200' }
];

const upholsteryOptions = [
  { id: 'two_seater', icon: Sofa, label: 'Two Seater Sofa', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'three_seater', icon: Sofa, label: 'Three Seater Sofa', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'four_seater', icon: Sofa, label: 'Four Seater or Corner Sofa', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'armchair', icon: Armchair, label: 'Armchair', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'dining_chair', icon: Utensils, label: 'Dining Chair', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'cushions', icon: Package, label: 'Cushions', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { id: 'curtains', icon: Blinds, label: 'Curtains Pair', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' }
];

const mattressOptions = [
  { id: 'single', icon: Bed, label: 'Single Mattress', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'double', icon: BedDouble, label: 'Double Mattress', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'king', icon: BedDouble, label: 'King Size Mattress', color: 'bg-purple-100 text-purple-700 border-purple-200' }
];

// Shared house specific options
const sharedHouseBedroomSizes = [
  { id: 'single_bedroom', label: 'Single Bedroom' },
  { id: 'double_bedroom', label: 'Double Bedroom' },
  { id: 'master_bedroom', label: 'Master Bedroom' }
];

const sharedHouseServices = [
  { id: 'bathroom', icon: Bath, label: 'Bathroom', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'single_oven_cleaning', icon: ChefHat, label: 'Single Oven Cleaning', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'kitchen_cupboards', icon: Package, label: 'Kitchen Cupboards', color: 'bg-green-100 text-green-700 border-green-200' }
];

// Cleaning service types for conditional display
const cleaningServiceTypes = [
  { id: 'carpet_cleaning', label: 'Carpet Cleaning', icon: Home, color: 'bg-blue-500' },
  { id: 'upholstery_cleaning', label: 'Upholstery Cleaning', icon: Sofa, color: 'bg-green-500' },
  { id: 'mattress_cleaning', label: 'Mattress Cleaning', icon: Bed, color: 'bg-purple-500' }
];

export function EndOfTenancyBookingForm({ children, onSubmit }: EndOfTenancyBookingFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    // Customer info - will be set by CustomerSelector
    customer: null,
    
    // Property details
    property_type: '', // Initially empty
    apartment_type: '', // For apartment specific selection
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
    
    // Handle apartment type selection
    if (field === 'apartment_type' && value) {
      const selectedType = apartmentTypes.find(type => type.id === value);
      if (selectedType) {
        setFormData(prev => ({ ...prev, bedrooms: selectedType.bedrooms }));
      }
    }
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
        <DialogHeader className="p-4 lg:p-6 border-b bg-gradient-to-r from-primary/10 via-primary-light/5 to-primary/10">
          <DialogTitle className="text-xl lg:text-2xl font-bold flex items-center gap-3 text-primary">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            End of Tenancy Cleaning
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 h-[calc(95vh-80px)] lg:h-[calc(95vh-120px)]">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6 lg:space-y-8">
            
            {/* Customer Selection */}
            <Card className="border-0 lg:border shadow-lg bg-gradient-to-r from-primary/5 to-primary-light/5">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-lg lg:text-xl font-bold text-primary">Select Customer</h3>
                </div>
                <CustomerSelector 
                  onCustomerSelect={handleCustomerSelect}
                />
              </CardContent>
            </Card>

            {/* Property Type Selection */}
            <Card className="border-0 lg:border shadow-lg">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-lg lg:text-xl font-bold text-primary">Property Type</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
                  {propertyTypes.map(type => {
                    const Icon = type.icon;
                    const isSelected = formData.property_type === type.id;
                    return (
                      <Button
                        key={type.id}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "h-20 lg:h-24 flex-col gap-2 lg:gap-3 text-sm lg:text-base font-semibold hover:scale-105 transition-all duration-200 border-2",
                          isSelected 
                            ? "bg-primary text-primary-foreground border-primary shadow-lg" 
                            : "border-border hover:border-primary/30 hover:bg-primary/5"
                        )}
                        onClick={() => updateBasicField('property_type', type.id)}
                      >
                        <div className={cn(
                          "w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center",
                          isSelected ? "bg-white/20" : type.colorLight
                        )}>
                          <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                        </div>
                        {type.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Apartment Type Selection - Only for apartments */}
            {formData.property_type === 'apartment' && (
              <Card className="border-0 lg:border shadow-lg bg-gradient-to-r from-blue-50 to-blue-100/50">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Bed className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-lg lg:text-xl font-bold text-blue-700">Apartment Configuration</h3>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {apartmentTypes.map(type => {
                      const isSelected = formData.apartment_type === type.id;
                      return (
                        <Button
                          key={type.id}
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "h-16 flex-col gap-1 text-xs lg:text-sm font-medium transition-all duration-200",
                            isSelected 
                              ? "bg-blue-500 text-white border-blue-500 shadow-lg" 
                              : "border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                          )}
                          onClick={() => updateBasicField('apartment_type', type.id)}
                        >
                          <span className="font-semibold">{type.label}</span>
                          {type.bedrooms === 0 && <span className="text-xs opacity-75">Studio</span>}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Property Details - Only show after property type is selected */}
            {formData.property_type && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <Card className="border-0 lg:border shadow-lg bg-gradient-to-r from-green-50 to-green-100/50">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <h4 className="font-bold text-green-700">Property Condition</h4>
                    </div>
                    <div className="space-y-2">
                      {propertyConditions.map(condition => {
                        const Icon = condition.icon;
                        const isSelected = formData.property_condition === condition.id;
                        return (
                          <Button
                            key={condition.id}
                            variant={isSelected ? "default" : "ghost"}
                            className={cn(
                              "w-full justify-start gap-3 h-12 transition-all duration-200",
                              isSelected 
                                ? "bg-green-500 text-white shadow-md" 
                                : "hover:bg-green-100 text-gray-700"
                            )}
                            onClick={() => updateBasicField('property_condition', condition.id)}
                          >
                            <Icon className="w-4 h-4" />
                            {condition.label}
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 lg:border shadow-lg bg-gradient-to-r from-purple-50 to-purple-100/50">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <Package className="w-4 h-4 text-purple-600" />
                      </div>
                      <h4 className="font-bold text-purple-700">Furnished Status</h4>
                    </div>
                    <div className="space-y-2">
                      {propertyStatuses.map(status => {
                        const Icon = status.icon;
                        const isSelected = formData.property_status === status.id;
                        return (
                          <Button
                            key={status.id}
                            variant={isSelected ? "default" : "ghost"}
                            className={cn(
                              "w-full justify-start gap-3 h-12 transition-all duration-200",
                              isSelected 
                                ? "bg-purple-500 text-white shadow-md" 
                                : "hover:bg-purple-100 text-gray-700"
                            )}
                            onClick={() => updateBasicField('property_status', status.id)}
                          >
                            <Icon className="w-4 h-4" />
                            {status.label}
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Room Configuration - show after property type is selected */}
            {formData.property_type && formData.property_type !== 'apartment' && (
              <Card className="border-0 lg:border shadow-lg bg-gradient-to-r from-orange-50 to-orange-100/50">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Bed className="w-4 h-4 text-orange-600" />
                    </div>
                    <h3 className="text-lg lg:text-xl font-bold text-orange-700">Room Configuration</h3>
                  </div>
                  
                  {/* House bedrooms */}
                  {formData.property_type === 'house' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center justify-between p-4 border-2 border-orange-200 rounded-xl bg-white">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <Bed className="w-5 h-5 text-orange-600" />
                          </div>
                          <span className="font-semibold">Bedrooms</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCount('bedrooms', false)}
                            disabled={formData.bedrooms <= 1}
                            className="h-10 w-10 p-0 rounded-full border-orange-200 hover:bg-orange-100"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Badge variant="secondary" className="min-w-[3rem] justify-center text-base font-bold px-4 py-2 bg-orange-100 text-orange-700">
                            {formData.bedrooms}
                          </Badge>
                          <Button
                            variant="outline" 
                            size="sm"
                            onClick={() => updateCount('bedrooms', true)}
                            disabled={formData.bedrooms >= 8}
                            className="h-10 w-10 p-0 rounded-full border-orange-200 hover:bg-orange-100"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border-2 border-orange-200 rounded-xl bg-white">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <Bath className="w-5 h-5 text-orange-600" />
                          </div>
                          <span className="font-semibold">Bathrooms</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCount('bathrooms', false)}
                            disabled={formData.bathrooms <= 1}
                            className="h-10 w-10 p-0 rounded-full border-orange-200 hover:bg-orange-100"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Badge variant="secondary" className="min-w-[3rem] justify-center text-base font-bold px-4 py-2 bg-orange-100 text-orange-700">
                            {formData.bathrooms}
                          </Badge>
                          <Button
                            variant="outline" 
                            size="sm"
                            onClick={() => updateCount('bathrooms', true)}
                            disabled={formData.bathrooms >= 10}
                            className="h-10 w-10 p-0 rounded-full border-orange-200 hover:bg-orange-100"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shared house specific */}
                  {formData.property_type === 'shared_house' && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold mb-3 block text-orange-700">Bedroom Size</Label>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          {sharedHouseBedroomSizes.map(size => {
                            const isSelected = formData.shared_house_bedroom_size === size.id;
                            return (
                              <Button
                                key={size.id}
                                variant={isSelected ? "default" : "outline"}
                                className={cn(
                                  "h-12 transition-all duration-200",
                                  isSelected 
                                    ? "bg-orange-500 text-white border-orange-500" 
                                    : "border-orange-200 hover:border-orange-400 hover:bg-orange-50"
                                )}
                                onClick={() => updateBasicField('shared_house_bedroom_size', size.id)}
                              >
                                {size.label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-semibold mb-3 block text-orange-700">Additional Services</Label>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          {sharedHouseServices.map(service => {
                            const Icon = service.icon;
                            const quantity = getItemQuantity('shared_house_services', service.id);
                            return (
                              <div key={service.id} className="flex items-center justify-between p-3 border-2 border-orange-200 rounded-lg bg-white">
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4 text-orange-600" />
                                  <span className="text-sm font-medium">{service.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {quantity > 0 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => decrementArrayItem('shared_house_services', service.id)}
                                      className="h-8 w-8 p-0 rounded-full border-orange-200"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                  )}
                                  {quantity > 0 && (
                                    <Badge variant="secondary" className="min-w-[1.5rem] justify-center bg-orange-100 text-orange-700">
                                      {quantity}
                                    </Badge>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleArrayItem('shared_house_services', service)}
                                    className="h-8 w-8 p-0 rounded-full border-orange-200 hover:bg-orange-100"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Additional Features */}
            {formData.property_type && (
              <Card className="border-0 lg:border shadow-lg bg-gradient-to-r from-indigo-50 to-indigo-100/50">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      <Building className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-lg lg:text-xl font-bold text-indigo-700">Additional Rooms</h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {additionalFeatures.map(feature => {
                      const Icon = feature.icon;
                      const quantity = getItemQuantity('additional_features', feature.id);
                      return (
                        <div key={feature.id} className="flex items-center justify-between p-4 border-2 border-indigo-200 rounded-lg bg-white hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", feature.color)}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-medium">{feature.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {quantity > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => decrementArrayItem('additional_features', feature.id)}
                                className="h-8 w-8 p-0 rounded-full border-indigo-200"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                            )}
                            {quantity > 0 && (
                              <Badge className="min-w-[1.5rem] justify-center bg-indigo-500 text-white">
                                {quantity}
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleArrayItem('additional_features', feature)}
                              className="h-8 w-8 p-0 rounded-full border-indigo-200 hover:bg-indigo-100"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cleaning Services Selection */}
            {formData.property_type && (
              <Card className="border-0 lg:border shadow-lg bg-gradient-to-r from-pink-50 to-pink-100/50">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-pink-600" />
                    </div>
                    <h3 className="text-lg lg:text-xl font-bold text-pink-700">Cleaning Services</h3>
                  </div>
                  
                  {/* Service Type Selection */}
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3 text-pink-700">Select Services Needed:</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      {cleaningServiceTypes.map(serviceType => {
                        const Icon = serviceType.icon;
                        const isEnabled = isServiceEnabled(serviceType.id);
                        return (
                          <Button
                            key={serviceType.id}
                            variant={isEnabled ? "default" : "outline"}
                            className={cn(
                              "h-16 flex-col gap-2 transition-all duration-200",
                              isEnabled 
                                ? `${serviceType.color} text-white shadow-lg` 
                                : "border-pink-200 hover:border-pink-400 hover:bg-pink-50"
                            )}
                            onClick={() => toggleServiceType(serviceType.id)}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs font-medium">{serviceType.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Carpet Cleaning Options */}
                  {isServiceEnabled('carpet_cleaning') && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                      <h4 className="font-semibold mb-3 text-blue-700 flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Carpet Cleaning Rooms
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {carpetRooms.map(room => {
                          const Icon = room.icon;
                          const quantity = getItemQuantity('carpet_cleaning', room.id);
                          return (
                            <div key={room.id} className="flex items-center justify-between p-3 bg-white border-2 border-blue-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", room.color)}>
                                  <Icon className="w-3 h-3" />
                                </div>
                                <span className="text-sm font-medium">{room.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {quantity > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => decrementArrayItem('carpet_cleaning', room.id)}
                                    className="h-7 w-7 p-0 rounded-full"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                )}
                                {quantity > 0 && (
                                  <Badge className="min-w-[1.5rem] justify-center bg-blue-500 text-white text-xs">
                                    {quantity}
                                  </Badge>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleArrayItem('carpet_cleaning', room)}
                                  className="h-7 w-7 p-0 rounded-full hover:bg-blue-100"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Upholstery Cleaning Options */}
                  {isServiceEnabled('upholstery_cleaning') && (
                    <div className="mb-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                      <h4 className="font-semibold mb-3 text-green-700 flex items-center gap-2">
                        <Sofa className="w-4 h-4" />
                        Upholstery Cleaning Items
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {upholsteryOptions.map(item => {
                          const Icon = item.icon;
                          const quantity = getItemQuantity('upholstery_cleaning', item.id);
                          return (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-white border-2 border-green-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", item.color)}>
                                  <Icon className="w-3 h-3" />
                                </div>
                                <span className="text-sm font-medium">{item.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {quantity > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => decrementArrayItem('upholstery_cleaning', item.id)}
                                    className="h-7 w-7 p-0 rounded-full"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                )}
                                {quantity > 0 && (
                                  <Badge className="min-w-[1.5rem] justify-center bg-green-500 text-white text-xs">
                                    {quantity}
                                  </Badge>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleArrayItem('upholstery_cleaning', item)}
                                  className="h-7 w-7 p-0 rounded-full hover:bg-green-100"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Mattress Cleaning Options */}
                  {isServiceEnabled('mattress_cleaning') && (
                    <div className="mb-6 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                      <h4 className="font-semibold mb-3 text-purple-700 flex items-center gap-2">
                        <Bed className="w-4 h-4" />
                        Mattress Cleaning
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        {mattressOptions.map(mattress => {
                          const Icon = mattress.icon;
                          const quantity = getItemQuantity('mattress_cleaning', mattress.id);
                          return (
                            <div key={mattress.id} className="flex items-center justify-between p-3 bg-white border-2 border-purple-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", mattress.color)}>
                                  <Icon className="w-3 h-3" />
                                </div>
                                <span className="text-sm font-medium">{mattress.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {quantity > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => decrementArrayItem('mattress_cleaning', mattress.id)}
                                    className="h-7 w-7 p-0 rounded-full"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                )}
                                {quantity > 0 && (
                                  <Badge className="min-w-[1.5rem] justify-center bg-purple-500 text-white text-xs">
                                    {quantity}
                                  </Badge>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleArrayItem('mattress_cleaning', mattress)}
                                  className="h-7 w-7 p-0 rounded-full hover:bg-purple-100"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Date & Address */}
            {formData.property_type && (
              <Card className="border-0 lg:border shadow-lg bg-gradient-to-r from-teal-50 to-teal-100/50">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center">
                      <CalendarIcon className="w-4 h-4 text-teal-600" />
                    </div>
                    <h3 className="text-lg lg:text-xl font-bold text-teal-700">Booking Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-semibold mb-3 block text-teal-700">Preferred Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-12 border-2 border-teal-200 hover:border-teal-400",
                              !formData.preferred_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-teal-600" />
                            {formData.preferred_date ? format(formData.preferred_date, "PPP") : <span>Pick a date</span>}
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
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="address" className="text-sm font-semibold mb-3 block text-teal-700">Address</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => updateBasicField('address', e.target.value)}
                          placeholder="Property address"
                          className="h-12 border-2 border-teal-200 focus:border-teal-400"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="postcode" className="text-sm font-semibold mb-3 block text-teal-700">Postcode</Label>
                        <Input
                          id="postcode"
                          value={formData.postcode}
                          onChange={(e) => updateBasicField('postcode', e.target.value)}
                          placeholder="Postcode"
                          className="h-12 border-2 border-teal-200 focus:border-teal-400"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Label htmlFor="notes" className="text-sm font-semibold mb-3 block text-teal-700">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.additional_notes}
                      onChange={(e) => updateBasicField('additional_notes', e.target.value)}
                      placeholder="Any special requirements, access instructions, or additional information..."
                      rows={4}
                      className="resize-none border-2 border-teal-200 focus:border-teal-400"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Sidebar - Desktop only */}
          <div className="hidden lg:block lg:w-80 shrink-0">
            <BookingSidebar formData={formData} />
          </div>
        </div>

        {/* Mobile Summary Card */}
        <div className="lg:hidden border-t bg-gradient-to-r from-primary/5 to-primary-light/5 p-4">
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
              className="px-8 py-3 h-auto font-semibold shadow-lg hover:shadow-xl transition-shadow"
              disabled={!formData.customer || !formData.property_type || !formData.preferred_date}
            >
              Create Booking
            </Button>
          </div>
        </div>

        {/* Desktop Submit Button */}
        <div className="hidden lg:flex justify-end gap-3 p-6 border-t bg-gradient-to-r from-primary/5 to-primary-light/5">
          <Button variant="outline" onClick={() => setOpen(false)} className="px-6">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="px-8 shadow-lg hover:shadow-xl transition-shadow"
            disabled={!formData.customer || !formData.property_type || !formData.preferred_date}
          >
            Create Booking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}