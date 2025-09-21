import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Home, Bath, Bed, Utensils, Car, BookOpen, Sun, Trees, Trash2, Building, Building2, Users, Sofa, ChefHat, Blinds, Package, Armchair, BedDouble, Calendar as CalendarIcon, Mail, Phone, MapPin, Sparkles, Clock, CheckCircle2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
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

const steps = [
  { id: 1, title: 'Property Details', icon: Building2, description: 'Tell us about your property' },
  { id: 2, title: 'Select Customer', icon: Users, description: 'Choose or add a customer' },
  { id: 3, title: 'Additional Services', icon: Sparkles, description: 'Extra cleaning options' },
  { id: 4, title: 'Date & Details', icon: CalendarIcon, description: 'When and where' }
];

const propertyTypes = [
  { id: 'apartment', icon: Building, label: 'Apartment', description: 'Flat or apartment unit' },
  { id: 'house', icon: Home, label: 'House', description: 'Standalone house' },
  { id: 'shared_house', icon: Users, label: 'Shared House', description: 'Single room in shared property' }
];

const apartmentTypes = [
  { id: 'studio', label: 'Studio', bedrooms: 0, description: 'Open-plan living' },
  { id: '1bed', label: '1 Bedroom', bedrooms: 1, description: 'One bedroom flat' },
  { id: '2bed', label: '2 Bedrooms', bedrooms: 2, description: 'Two bedroom flat' },
  { id: '3bed', label: '3 Bedrooms', bedrooms: 3, description: 'Three bedroom flat' },
  { id: '4bed', label: '4+ Bedrooms', bedrooms: 4, description: 'Large apartment' }
];

const propertyConditions = [
  { id: 'well_maintained', label: 'Well-Maintained', icon: CheckCircle2 },
  { id: 'moderate', label: 'Moderate Condition', icon: Clock },
  { id: 'heavily_used', label: 'Heavily Used', icon: Trash2 },
  { id: 'intensive_required', label: 'Deep Clean Required', icon: Sparkles }
];

const propertyStatuses = [
  { id: 'furnished', label: 'Furnished', icon: Sofa },
  { id: 'unfurnished', label: 'Unfurnished', icon: Home },
  { id: 'part_furnished', label: 'Part Furnished', icon: Package }
];

const additionalFeatures = [
  { id: 'utility_room', icon: Car, label: 'Utility Room' },
  { id: 'conservatory', icon: Sun, label: 'Conservatory' },
  { id: 'separate_kitchen_living', icon: Home, label: 'Separate Kitchen/Living Room' },
  { id: 'dining_room', icon: Utensils, label: 'Dining Room' },
  { id: 'study_room', icon: BookOpen, label: 'Study Room' },
  { id: 'other_room', icon: Building, label: 'Any Other Additional Room' }
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
  { id: 'curtains', icon: Blinds, label: 'Curtains Pair' }
];

const mattressOptions = [
  { id: 'single', icon: Bed, label: 'Single Mattress' },
  { id: 'double', icon: BedDouble, label: 'Double Mattress' },
  { id: 'king', icon: BedDouble, label: 'King Size Mattress' }
];

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

const cleaningServiceTypes = [
  { id: 'carpet_cleaning', label: 'Carpet Cleaning', icon: Home },
  { id: 'upholstery_cleaning', label: 'Upholstery Cleaning', icon: Sofa },
  { id: 'mattress_cleaning', label: 'Mattress Cleaning', icon: Bed }
];

export function EndOfTenancyBookingForm({ children, onSubmit }: EndOfTenancyBookingFormProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    customer: null,
    property_type: '',
    apartment_type: '',
    property_condition: 'well_maintained',
    property_status: 'furnished',
    bedrooms: 1,
    bathrooms: 1,
    separate_wc: 0,
    shared_house_bedroom_size: 'single_bedroom',
    shared_house_services: [],
    additional_features: [],
    enabled_cleaning_services: [],
    carpet_cleaning: [],
    upholstery_cleaning: [],
    mattress_cleaning: [],
    preferred_date: null as Date | null,
    address: '',
    postcode: '',
    additional_notes: ''
  });

  const updateBasicField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
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
      address: customer?.address || prev.address,
      postcode: customer?.postcode || prev.postcode
    }));
  };

  const toggleServiceType = (serviceType: string) => {
    setFormData(prev => {
      const currentServices = prev.enabled_cleaning_services || [];
      const isEnabled = currentServices.includes(serviceType);
      
      if (isEnabled) {
        return {
          ...prev,
          enabled_cleaning_services: currentServices.filter(s => s !== serviceType),
          [serviceType]: []
        };
      } else {
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

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.property_type !== '';
      case 2:
        return formData.customer !== null;
      case 3:
        return true; // Optional step
      case 4:
        return formData.preferred_date !== null && formData.address !== '';
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      const bookingData = {
        ...formData,
        service_type: 'End of Tenancy',
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-full h-[95vh] max-w-[95vw] lg:max-w-6xl p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 lg:p-8 border-b bg-gradient-to-r from-slate-50 to-slate-100">
          <DialogTitle className="text-2xl lg:text-3xl font-bold text-center text-slate-800">
            End of Tenancy Cleaning
          </DialogTitle>
          <p className="text-slate-600 text-center mt-2">Complete your booking in 4 simple steps</p>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row h-[calc(95vh-120px)]">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            {/* Progress Bar */}
            <div className="mb-8 lg:mb-12">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <div className={cn(
                        "w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                        isActive ? "bg-primary border-primary text-white shadow-lg scale-110" :
                        isCompleted ? "bg-green-500 border-green-500 text-white" :
                        "bg-white border-slate-300 text-slate-400"
                      )}>
                        {isCompleted ? (
                          <Check className="w-5 h-5 lg:w-6 lg:h-6" />
                        ) : (
                          <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <p className={cn(
                          "text-xs lg:text-sm font-medium",
                          isActive ? "text-primary" : 
                          isCompleted ? "text-green-600" : "text-slate-500"
                        )}>
                          {step.title}
                        </p>
                        <p className="text-xs text-slate-400 hidden lg:block">{step.description}</p>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={cn(
                          "hidden lg:block absolute w-20 h-0.5 translate-x-16 -translate-y-8",
                          isCompleted ? "bg-green-500" : "bg-slate-300"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <div className="max-w-2xl mx-auto">
              {/* Step 1: Property Details */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-3">What type of property?</h2>
                    <p className="text-slate-600">Select your property type to get started</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {propertyTypes.map(type => {
                      const Icon = type.icon;
                      const isSelected = formData.property_type === type.id;
                      return (
                        <Button
                          key={type.id}
                          variant="outline"
                          className={cn(
                            "h-32 lg:h-40 flex-col gap-4 p-6 border-2 transition-all duration-300 hover:scale-105",
                            isSelected 
                              ? "border-primary bg-primary/5 shadow-lg" 
                              : "border-slate-200 hover:border-primary/50"
                          )}
                          onClick={() => updateBasicField('property_type', type.id)}
                        >
                          <div className={cn(
                            "w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center",
                            isSelected ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                          )}>
                            <Icon className="w-8 h-8 lg:w-10 lg:h-10" />
                          </div>
                          <div className="text-center">
                            <h3 className="font-semibold text-lg">{type.label}</h3>
                            <p className="text-sm text-slate-500">{type.description}</p>
                          </div>
                        </Button>
                      );
                    })}
                  </div>

                  {/* Apartment Configuration */}
                  {formData.property_type === 'apartment' && (
                    <Card className="mt-8 border-2 border-blue-200 bg-blue-50/50">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-4 text-blue-800">Choose apartment size</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                          {apartmentTypes.map(type => {
                            const isSelected = formData.apartment_type === type.id;
                            return (
                              <Button
                                key={type.id}
                                variant="outline"
                                className={cn(
                                  "h-20 flex-col gap-1 border-2 transition-all duration-200",
                                  isSelected 
                                    ? "border-blue-500 bg-blue-500 text-white shadow-md" 
                                    : "border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                                )}
                                onClick={() => updateBasicField('apartment_type', type.id)}
                              >
                                <span className="font-semibold">{type.label}</span>
                                <span className="text-xs opacity-75">{type.description}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* House Configuration */}
                  {formData.property_type === 'house' && (
                    <Card className="mt-8 border-2 border-green-200 bg-green-50/50">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-6 text-green-800">Configure your house</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="text-center">
                            <Label className="text-sm font-semibold mb-4 block text-green-700">Bedrooms</Label>
                            <div className="flex items-center justify-center gap-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCount('bedrooms', false)}
                                disabled={formData.bedrooms <= 1}
                                className="h-12 w-12 rounded-full border-2 border-green-300"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <div className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center">
                                <span className="text-2xl font-bold">{formData.bedrooms}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCount('bedrooms', true)}
                                disabled={formData.bedrooms >= 8}
                                className="h-12 w-12 rounded-full border-2 border-green-300"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="text-center">
                            <Label className="text-sm font-semibold mb-4 block text-green-700">Bathrooms</Label>
                            <div className="flex items-center justify-center gap-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCount('bathrooms', false)}
                                disabled={formData.bathrooms <= 1}
                                className="h-12 w-12 rounded-full border-2 border-green-300"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <div className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center">
                                <span className="text-2xl font-bold">{formData.bathrooms}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCount('bathrooms', true)}
                                disabled={formData.bathrooms >= 10}
                                className="h-12 w-12 rounded-full border-2 border-green-300"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Shared House Configuration */}
                  {formData.property_type === 'shared_house' && (
                    <Card className="mt-8 border-2 border-orange-200 bg-orange-50/50">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-4 text-orange-800">Your bedroom size</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          {sharedHouseBedroomSizes.map(size => {
                            const isSelected = formData.shared_house_bedroom_size === size.id;
                            return (
                              <Button
                                key={size.id}
                                variant="outline"
                                className={cn(
                                  "h-16 border-2 transition-all duration-200",
                                  isSelected 
                                    ? "border-orange-500 bg-orange-500 text-white" 
                                    : "border-orange-200 hover:border-orange-400"
                                )}
                                onClick={() => updateBasicField('shared_house_bedroom_size', size.id)}
                              >
                                {size.label}
                              </Button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Property Condition & Status */}
                  {formData.property_type && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                      <Card className="border-2 border-slate-200">
                        <CardContent className="p-6">
                          <h4 className="font-semibold mb-4 text-slate-700">Property Condition</h4>
                          <div className="space-y-2">
                            {propertyConditions.map(condition => {
                              const Icon = condition.icon;
                              const isSelected = formData.property_condition === condition.id;
                              return (
                                <Button
                                  key={condition.id}
                                  variant="ghost"
                                  className={cn(
                                    "w-full justify-start gap-3 h-12",
                                    isSelected ? "bg-primary text-white" : "hover:bg-slate-100"
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

                      <Card className="border-2 border-slate-200">
                        <CardContent className="p-6">
                          <h4 className="font-semibold mb-4 text-slate-700">Furnished Status</h4>
                          <div className="space-y-2">
                            {propertyStatuses.map(status => {
                              const Icon = status.icon;
                              const isSelected = formData.property_status === status.id;
                              return (
                                <Button
                                  key={status.id}
                                  variant="ghost"
                                  className={cn(
                                    "w-full justify-start gap-3 h-12",
                                    isSelected ? "bg-primary text-white" : "hover:bg-slate-100"
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
                </div>
              )}

              {/* Step 2: Customer Selection */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-3">Choose customer</h2>
                    <p className="text-slate-600">Select an existing customer or create a new one</p>
                  </div>

                  <Card className="border-2 border-slate-200 max-w-lg mx-auto">
                    <CardContent className="p-8">
                      <CustomerSelector onCustomerSelect={handleCustomerSelect} />
                      
                      {formData.customer && (
                        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-green-800">
                                {formData.customer.first_name} {formData.customer.last_name}
                              </p>
                              <p className="text-sm text-green-600">{formData.customer.email}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 3: Additional Services */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-3">Additional services</h2>
                    <p className="text-slate-600">Add extra rooms and cleaning services (optional)</p>
                  </div>

                  {/* Additional Rooms */}
                  <Card className="border-2 border-slate-200">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">Additional Rooms</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {additionalFeatures.map(feature => {
                          const Icon = feature.icon;
                          const quantity = getItemQuantity('additional_features', feature.id);
                          return (
                            <div key={feature.id} className="flex items-center justify-between p-4 border-2 border-slate-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Icon className="w-5 h-5 text-slate-600" />
                                <span className="font-medium">{feature.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {quantity > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => decrementArrayItem('additional_features', feature.id)}
                                    className="h-8 w-8 p-0 rounded-full"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                )}
                                {quantity > 0 && (
                                  <Badge className="min-w-[1.5rem] justify-center bg-primary">{quantity}</Badge>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleArrayItem('additional_features', feature)}
                                  className="h-8 w-8 p-0 rounded-full hover:bg-primary hover:text-white"
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

                  {/* Cleaning Services */}
                  <Card className="border-2 border-slate-200">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">Extra Cleaning Services</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                        {cleaningServiceTypes.map(serviceType => {
                          const Icon = serviceType.icon;
                          const isEnabled = isServiceEnabled(serviceType.id);
                          return (
                            <Button
                              key={serviceType.id}
                              variant="outline"
                              className={cn(
                                "h-20 flex-col gap-2 border-2 transition-all duration-200",
                                isEnabled 
                                  ? "border-primary bg-primary text-white" 
                                  : "border-slate-200 hover:border-primary/50"
                              )}
                              onClick={() => toggleServiceType(serviceType.id)}
                            >
                              <Icon className="w-6 h-6" />
                              <span className="text-sm font-medium">{serviceType.label}</span>
                            </Button>
                          );
                        })}
                      </div>

                      {/* Service Details */}
                      {isServiceEnabled('carpet_cleaning') && (
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-semibold mb-3 text-blue-800">Carpet Cleaning Rooms</h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {carpetRooms.map(room => {
                              const Icon = room.icon;
                              const quantity = getItemQuantity('carpet_cleaning', room.id);
                              return (
                                <div key={room.id} className="flex items-center justify-between p-3 bg-white rounded border">
                                  <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4 text-blue-600" />
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
                                      <Badge className="bg-blue-500 text-white text-xs">{quantity}</Badge>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleArrayItem('carpet_cleaning', room)}
                                      className="h-7 w-7 p-0 rounded-full"
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

                      {isServiceEnabled('upholstery_cleaning') && (
                        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold mb-3 text-green-800">Upholstery Items</h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {upholsteryOptions.map(item => {
                              const Icon = item.icon;
                              const quantity = getItemQuantity('upholstery_cleaning', item.id);
                              return (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded border">
                                  <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4 text-green-600" />
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
                                      <Badge className="bg-green-500 text-white text-xs">{quantity}</Badge>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleArrayItem('upholstery_cleaning', item)}
                                      className="h-7 w-7 p-0 rounded-full"
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

                      {isServiceEnabled('mattress_cleaning') && (
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <h4 className="font-semibold mb-3 text-purple-800">Mattress Cleaning</h4>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            {mattressOptions.map(mattress => {
                              const Icon = mattress.icon;
                              const quantity = getItemQuantity('mattress_cleaning', mattress.id);
                              return (
                                <div key={mattress.id} className="flex items-center justify-between p-3 bg-white rounded border">
                                  <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4 text-purple-600" />
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
                                      <Badge className="bg-purple-500 text-white text-xs">{quantity}</Badge>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleArrayItem('mattress_cleaning', mattress)}
                                      className="h-7 w-7 p-0 rounded-full"
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
                </div>
              )}

              {/* Step 4: Date & Details */}
              {currentStep === 4 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-3">When and where?</h2>
                    <p className="text-slate-600">Choose your preferred date and confirm the address</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-2 border-slate-200">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Preferred Date</h3>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal h-16 text-lg border-2",
                                !formData.preferred_date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-3 h-6 w-6" />
                              {formData.preferred_date ? format(formData.preferred_date, "EEEE, MMMM do, yyyy") : "Choose date"}
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
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-slate-200">
                      <CardContent className="p-6 space-y-4">
                        <h3 className="text-xl font-semibold">Property Address</h3>
                        <div>
                          <Label htmlFor="address" className="text-sm font-medium mb-2 block">Address</Label>
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => updateBasicField('address', e.target.value)}
                            placeholder="Enter property address"
                            className="h-12 text-lg border-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="postcode" className="text-sm font-medium mb-2 block">Postcode</Label>
                          <Input
                            id="postcode"
                            value={formData.postcode}
                            onChange={(e) => updateBasicField('postcode', e.target.value)}
                            placeholder="Enter postcode"
                            className="h-12 text-lg border-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-2 border-slate-200">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">Additional Notes</h3>
                      <Textarea
                        value={formData.additional_notes}
                        onChange={(e) => updateBasicField('additional_notes', e.target.value)}
                        placeholder="Any special requirements, access instructions, or additional information..."
                        rows={4}
                        className="resize-none text-lg border-2"
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Desktop only */}
          <div className="hidden lg:block lg:w-80 shrink-0 border-l bg-slate-50">
            <BookingSidebar formData={formData} />
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="border-t bg-white p-4 lg:p-6">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="lg:hidden">
              <p className="text-sm text-slate-600">Step {currentStep} of {steps.length}</p>
            </div>

            {currentStep < steps.length ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-8 py-3 text-lg font-semibold"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="px-8 py-3 text-lg font-semibold bg-green-600 hover:bg-green-700"
              >
                Create Booking
                <Check className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Summary - Only show on step 4 */}
        {currentStep === 4 && (
          <div className="lg:hidden border-t bg-slate-50 p-4">
            <div className="text-center">
              <p className="text-sm text-slate-600">Estimated Total</p>
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}