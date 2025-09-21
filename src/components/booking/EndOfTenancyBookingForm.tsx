import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Home, Bath, Bed, Utensils, Car, BookOpen, Sun, Trees, Trash2, Building, Building2, Users, Sofa, ChefHat, Blinds, Package, Armchair, BedDouble, Calendar as CalendarIcon, CheckCircle2, ArrowLeft, ArrowRight, Star, AlertTriangle, Wrench, Zap } from 'lucide-react';
import CustomerSelector from './CustomerSelector';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EndOfTenancyBookingFormProps {
  children: React.ReactNode;
  onSubmit?: (bookingData: any) => void;
}

// Property Configuration
const propertyTypes = [
  { id: 'apartment', label: 'Apartment', icon: Building },
  { id: 'house', label: 'House', icon: Home },
  { id: 'studio', label: 'Studio', icon: Building2 },
  { id: 'shared_house', label: 'House Share', icon: Users }
];

const apartmentSizes = [
  { id: 'studio', label: 'Studio', bedrooms: 0 },
  { id: '1bed', label: '1 Bedroom', bedrooms: 1 },
  { id: '2bed', label: '2 Bedrooms', bedrooms: 2 },
  { id: '3bed', label: '3 Bedrooms', bedrooms: 3 },
  { id: '4bed', label: '4+ Bedrooms', bedrooms: 4 }
];

const propertyConditions = [
  { id: 'well_maintained', label: 'Well-Maintained', icon: CheckCircle2 },
  { id: 'moderate', label: 'Moderate Condition', icon: Star },
  { id: 'heavily_used', label: 'Heavily Used', icon: AlertTriangle },
  { id: 'intensive_required', label: 'Intensive Cleaning Required', icon: Zap }
];

const propertyStatuses = [
  { id: 'furnished', label: 'Furnished', icon: Sofa },
  { id: 'unfurnished', label: 'Unfurnished', icon: Home },
  { id: 'part_furnished', label: 'Part Furnished', icon: Package }
];

// Additional Rooms
const additionalRooms = [
  { id: 'utility_room', label: 'Utility Room', icon: Wrench },
  { id: 'dining_room', label: 'Dining Room', icon: Utensils },
  { id: 'conservatory', label: 'Conservatory', icon: Sun },
  { id: 'study_room', label: 'Study Room', icon: BookOpen },
  { id: 'separate_kitchen_living', label: 'Separate Kitchen/Living', icon: Home },
  { id: 'other_room', label: 'Any Other Room', icon: Building }
];

// Oven Types & Sizes
const ovenTypes = [
  { id: 'no_oven', label: 'No Oven Cleaning Required', price: 0 },
  { id: 'single_oven', label: 'Single Oven', price: 20 },
  { id: 'single_convection', label: 'Single & Convection Oven', price: 35 },
  { id: 'double_oven', label: 'Double Oven', price: 40 },
  { id: 'range_oven', label: 'Range Oven', price: 45 },
  { id: 'aga_oven', label: 'AGA Oven', price: 60 }
];

// Blinds & Shutters
const blindsOptions = [
  { id: 'small_blinds', label: 'Small Blinds / Shutters', price: 6, description: '60cm x 120cm (bathrooms, offices)' },
  { id: 'medium_blinds', label: 'Medium Blinds / Shutters', price: 9, description: '100cm x 160cm (bedrooms, kitchens)' },
  { id: 'large_blinds', label: 'Large Blinds / Shutters', price: 12, description: '140cm x 220cm (living rooms, commercial)' }
];

// Extra Services
const extraServices = [
  { id: 'balcony_cleaning', label: 'Balcony Cleaning', price: 30, icon: Sun },
  { id: 'waste_removal', label: 'Household Waste Removal', price: 40, icon: Trash2 },
  { id: 'garage_cleaning', label: 'Garage Cleaning', price: 50, icon: Car }
];

// Carpet Cleaning Rooms
const carpetRooms = [
  { id: 'bedroom', label: 'Bedroom', price: 30, icon: Bed },
  { id: 'living_room', label: 'Living Room', price: 40, icon: Sofa },
  { id: 'dining_room', label: 'Dining Room', price: 40, icon: Utensils },
  { id: 'hallway', label: 'Hallway', price: 15, icon: Home },
  { id: 'staircase', label: 'Staircase', price: 30, icon: Building },
  { id: 'landing', label: 'Landing', price: 10, icon: Home },
  { id: 'standard_rug', label: 'Standard Size Rug', price: 25, icon: Package },
  { id: 'large_rug', label: 'Large Rug', price: 40, icon: Package },
  { id: 'other_room', label: 'Any Other Room', price: 30, icon: Building }
];

// Upholstery Options
const upholsteryOptions = [
  { id: 'two_seater', label: 'Two Seater Sofa', price: 30, icon: Sofa },
  { id: 'three_seater', label: 'Three Seater Sofa', price: 45, icon: Sofa },
  { id: 'four_seater', label: 'Four Seater or Corner Sofa', price: 70, icon: Sofa },
  { id: 'armchair', label: 'Armchair', price: 20, icon: Armchair },
  { id: 'dining_chair', label: 'Dining Chair', price: 8, icon: Utensils },
  { id: 'cushions', label: 'Cushions', price: 5, icon: Package },
  { id: 'curtains', label: 'Curtains Pair', price: 20, icon: Blinds }
];

// Mattress Cleaning
const mattressOptions = [
  { id: 'single_mattress', label: 'Single Mattress', price: 25, icon: Bed },
  { id: 'double_mattress', label: 'Double Mattress', price: 35, icon: BedDouble },
  { id: 'king_mattress', label: 'King Size Mattress', price: 40, icon: BedDouble }
];

// Steps Configuration
const steps = [
  { id: 1, title: 'Property Details', short: 'Property' },
  { id: 2, title: 'Select Customer', short: 'Customer' },
  { id: 3, title: 'Additional Services', short: 'Services' },
  { id: 4, title: 'Date & Address', short: 'Details' }
];

export function EndOfTenancyBookingForm({ children, onSubmit }: EndOfTenancyBookingFormProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    customer: null,
    property_type: '',
    apartment_size: '',
    property_condition: 'well_maintained',
    property_status: 'furnished',
    bedrooms: 1,
    bathrooms: 1,
    separate_wc: 0,
    additional_rooms: [],
    oven_type: 'no_oven',
    blinds_shutters: [],
    extra_services: [],
    carpet_cleaning: [],
    upholstery_cleaning: [],
    mattress_cleaning: [],
    preferred_date: null as Date | null,
    address: '',
    postcode: '',
    additional_notes: ''
  });

  // Calculate total price
  const totalPrice = useMemo(() => {
    let basePrice = 120; // Base end of tenancy price
    
    // Property type adjustments
    if (formData.property_type === 'house') basePrice += 50;
    if (formData.property_type === 'shared_house') basePrice = 80;
    
    // Bedrooms/bathrooms
    basePrice += (formData.bedrooms - 1) * 25;
    basePrice += (formData.bathrooms - 1) * 20;
    basePrice += formData.separate_wc * 15;
    
    // Condition adjustments
    const conditionMultipliers = {
      well_maintained: 1.0,
      moderate: 1.15,
      heavily_used: 1.3,
      intensive_required: 1.5
    };
    basePrice *= conditionMultipliers[formData.property_condition] || 1.0;
    
    // Additional rooms
    basePrice += formData.additional_rooms.length * 25;
    
    // Oven cleaning
    const selectedOven = ovenTypes.find(o => o.id === formData.oven_type);
    if (selectedOven) basePrice += selectedOven.price;
    
    // Blinds & shutters
    const blindsPrice = formData.blinds_shutters.reduce((sum, item) => {
      const blindType = blindsOptions.find(b => b.id === item.id);
      return sum + (blindType ? blindType.price * item.quantity : 0);
    }, 0);
    basePrice += blindsPrice;
    
    // Extra services
    const extrasPrice = formData.extra_services.reduce((sum, item) => {
      const extra = extraServices.find(e => e.id === item.id);
      return sum + (extra ? extra.price * item.quantity : 0);
    }, 0);
    basePrice += extrasPrice;
    
    // Carpet cleaning
    const carpetPrice = formData.carpet_cleaning.reduce((sum, item) => {
      const room = carpetRooms.find(r => r.id === item.id);
      return sum + (room ? room.price * item.quantity : 0);
    }, 0);
    basePrice += carpetPrice;
    
    // Upholstery cleaning
    const upholsteryPrice = formData.upholstery_cleaning.reduce((sum, item) => {
      const upholstery = upholsteryOptions.find(u => u.id === item.id);
      return sum + (upholstery ? upholstery.price * item.quantity : 0);
    }, 0);
    basePrice += upholsteryPrice;
    
    // Mattress cleaning
    const mattressPrice = formData.mattress_cleaning.reduce((sum, item) => {
      const mattress = mattressOptions.find(m => m.id === item.id);
      return sum + (mattress ? mattress.price * item.quantity : 0);
    }, 0);
    basePrice += mattressPrice;
    
    return Math.round(basePrice);
  }, [formData]);

  const updateField = (field: string, value: any) => {
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
        const newArray = [...currentArray];
        newArray[existingIndex] = { ...newArray[existingIndex], quantity: (newArray[existingIndex].quantity || 1) + 1 };
        return { ...prev, [arrayName]: newArray };
      } else {
        return { ...prev, [arrayName]: [...currentArray, { ...item, quantity: 1 }] };
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
          return { ...prev, [arrayName]: currentArray.filter((_, index) => index !== existingIndex) };
        } else {
          const newArray = [...currentArray];
          newArray[existingIndex] = { ...newArray[existingIndex], quantity: newQty };
          return { ...prev, [arrayName]: newArray };
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
        return true;
      case 4:
        return formData.preferred_date !== null && formData.address !== '';
      default:
        return false;
    }
  };

  const getProgress = () => {
    return Math.round((currentStep / steps.length) * 100);
  };

  const handleSubmit = () => {
    if (onSubmit) {
      const bookingData = {
        ...formData,
        service_type: 'End of Tenancy',
        total_price: totalPrice,
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
      <DialogContent className="w-full h-[95vh] max-w-[95vw] lg:max-w-7xl p-0 overflow-hidden">
        {/* Header with Progress */}
        <DialogHeader className="relative bg-gradient-to-r from-primary/5 to-primary/10 border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-xl font-bold text-primary">
              Get An Instant End Of Tenancy Cleaning Quote & Book Online
            </DialogTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold px-3 py-1">
              {getProgress()}% {steps[currentStep - 1]?.title}
            </Badge>
          </div>
          
          {/* Step Progress */}
          <div className="flex items-center justify-center gap-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all",
                  currentStep === step.id ? "bg-primary text-white" :
                  currentStep > step.id ? "bg-green-500 text-white" :
                  "bg-muted text-muted-foreground"
                )}>
                  <span className="hidden sm:inline">{step.title}</span>
                  <span className="sm:hidden">{step.short}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "h-px w-8 transition-colors",
                    currentStep > step.id ? "bg-green-500" : "bg-muted"
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>
        </DialogHeader>

        <div className="flex h-[calc(95vh-140px)]">
          {/* Main Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Step 1: Property Details */}
            {currentStep === 1 && (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Please Provide Details About The Property</h2>
                </div>

                {/* Property Type */}
                <div>
                  <Label className="text-lg font-semibold flex items-center gap-2 mb-4">
                    Property Type <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {propertyTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <Button
                          key={type.id}
                          variant={formData.property_type === type.id ? "default" : "outline"}
                          className={cn(
                            "h-24 flex-col gap-2 text-base font-medium",
                            formData.property_type === type.id && "ring-2 ring-primary ring-offset-2"
                          )}
                          onClick={() => updateField('property_type', type.id)}
                        >
                          <Icon className="w-6 h-6" />
                          {type.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Apartment Size Selection */}
                {formData.property_type === 'apartment' && (
                  <div>
                    <Label className="text-lg font-semibold flex items-center gap-2 mb-4">
                      Apartment Size <span className="text-destructive">*</span>
                    </Label>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                      {apartmentSizes.map(size => (
                        <Button
                          key={size.id}
                          variant={formData.apartment_size === size.id ? "default" : "outline"}
                          className="h-16 flex-col"
                          onClick={() => {
                            updateField('apartment_size', size.id);
                            updateField('bedrooms', size.bedrooms);
                          }}
                        >
                          <span className="font-semibold">{size.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* House Configuration */}
                {formData.property_type === 'house' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <Label className="text-lg font-semibold mb-4 block">Bedrooms</Label>
                      <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={() => updateCount('bedrooms', false)}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="text-2xl font-bold w-12 text-center">{formData.bedrooms}</span>
                        <Button variant="outline" size="sm" onClick={() => updateCount('bedrooms', true)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-lg font-semibold mb-4 block">Bathrooms</Label>
                      <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={() => updateCount('bathrooms', false)}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="text-2xl font-bold w-12 text-center">{formData.bathrooms}</span>
                        <Button variant="outline" size="sm" onClick={() => updateCount('bathrooms', true)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Property Condition */}
                <div>
                  <Label className="text-lg font-semibold flex items-center gap-2 mb-4">
                    Condition Of The Property <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Indicate the current state of the property. 'Well-Maintained' means the property is in good condition with no significant issues. 
                    'Moderate Condition' shows signs of regular use with some areas needing extra attention. 'Heavily Used' indicates that the property 
                    has several areas that need significant cleaning effort. 'Intensive Cleaning Required' points to a property that requires a thorough 
                    and extensive cleaning service due to prolonged usage or buildup.
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {propertyConditions.map(condition => {
                      const Icon = condition.icon;
                      return (
                        <Button
                          key={condition.id}
                          variant={formData.property_condition === condition.id ? "default" : "outline"}
                          className="h-20 flex-col gap-2"
                          onClick={() => updateField('property_condition', condition.id)}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs text-center">{condition.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Property Status */}
                <div>
                  <Label className="text-lg font-semibold flex items-center gap-2 mb-4">
                    Property Status <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    {propertyStatuses.map(status => {
                      const Icon = status.icon;
                      return (
                        <Button
                          key={status.id}
                          variant={formData.property_status === status.id ? "default" : "outline"}
                          className="h-16 flex-col gap-2"
                          onClick={() => updateField('property_status', status.id)}
                        >
                          <Icon className="w-5 h-5" />
                          {status.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-end pt-6">
                  <Button onClick={nextStep} disabled={!canProceed()} size="lg" className="px-12">
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Customer Selection */}
            {currentStep === 2 && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Select Customer</h2>
                  <p className="text-muted-foreground">Choose an existing customer or add a new one</p>
                </div>
                
                <CustomerSelector onCustomerSelect={handleCustomerSelect} />
                
                <div className="flex justify-between pt-8">
                  <Button variant="outline" onClick={prevStep} size="lg">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button onClick={nextStep} disabled={!canProceed()} size="lg" className="px-12">
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Additional Services */}
            {currentStep === 3 && (
              <div className="max-w-6xl mx-auto space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Does Your Property Include Any Of The Following?</h2>
                </div>

                {/* Additional Rooms */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Additional Rooms</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {additionalRooms.map(room => {
                      const Icon = room.icon;
                      const isSelected = formData.additional_rooms.find(r => r.id === room.id);
                      return (
                        <Button
                          key={room.id}
                          variant={isSelected ? "default" : "outline"}
                          className="h-16 flex items-center gap-3 justify-start px-4"
                          onClick={() => {
                            if (isSelected) {
                              setFormData(prev => ({
                                ...prev,
                                additional_rooms: prev.additional_rooms.filter(r => r.id !== room.id)
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                additional_rooms: [...prev.additional_rooms, room]
                              }));
                            }
                          }}
                        >
                          <Icon className="w-5 h-5" />
                          {room.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Oven Size */}
                <div>
                  <h3 className="text-xl font-semibold mb-2">Oven Size <span className="text-destructive">*</span></h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The cost includes cleaning of a standard-sized oven. Please note, cleaning of larger or double ovens will incur an additional 
                    charge, reflecting the extra time and resources required.
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {ovenTypes.map(oven => (
                      <Button
                        key={oven.id}
                        variant={formData.oven_type === oven.id ? "default" : "outline"}
                        className="h-16 flex-col gap-1"
                        onClick={() => updateField('oven_type', oven.id)}
                      >
                        <span className="font-medium text-center">{oven.label}</span>
                        {oven.price > 0 && <span className="text-sm">£{oven.price}</span>}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Blinds/Shutters */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Add Blinds / Shutters Cleaning If Required</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {blindsOptions.map(blinds => {
                      const quantity = getItemQuantity('blinds_shutters', blinds.id);
                      return (
                        <Card key={blinds.id} className="border-2">
                          <CardContent className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Blinds className="w-8 h-8 text-primary" />
                            </div>
                            <h4 className="font-semibold mb-2">{blinds.label}</h4>
                            <p className="text-sm text-muted-foreground mb-4">{blinds.description}</p>
                            <div className="text-2xl font-bold text-primary mb-4">£{blinds.price}</div>
                            <div className="flex items-center justify-center gap-2 mb-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => decrementArrayItem('blinds_shutters', blinds.id)}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-12 text-center font-bold">{quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleArrayItem('blinds_shutters', blinds)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => toggleArrayItem('blinds_shutters', blinds)}
                            >
                              Add
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Extra Services */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Add Any Extras If Required</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {extraServices.map(service => {
                      const Icon = service.icon;
                      const quantity = getItemQuantity('extra_services', service.id);
                      return (
                        <Card key={service.id} className="border-2">
                          <CardContent className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Icon className="w-8 h-8 text-primary" />
                            </div>
                            <h4 className="font-semibold mb-2">{service.label}</h4>
                            <div className="text-2xl font-bold text-primary mb-4">£{service.price}</div>
                            <div className="flex items-center justify-center gap-2 mb-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => decrementArrayItem('extra_services', service.id)}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-12 text-center font-bold">{quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleArrayItem('extra_services', service)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => toggleArrayItem('extra_services', service)}
                            >
                              Add
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Carpet Cleaning */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Select Rooms for Professional Carpet Cleaning</h3>
                  <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
                    {carpetRooms.slice(0, 6).map(room => {
                      const Icon = room.icon;
                      const quantity = getItemQuantity('carpet_cleaning', room.id);
                      return (
                        <Card key={room.id} className="text-center">
                          <CardContent className="p-4">
                            <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <h4 className="font-medium text-sm mb-1">{room.label}</h4>
                            <div className="text-lg font-bold text-primary mb-2">£{room.price}</div>
                            <div className="flex items-center gap-1 mb-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => decrementArrayItem('carpet_cleaning', room.id)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => toggleArrayItem('carpet_cleaning', room)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              className="w-full h-8 text-xs"
                              onClick={() => toggleArrayItem('carpet_cleaning', room)}
                            >
                              Add
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Upholstery Cleaning */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Select Upholstery Cleaning</h3>
                  <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
                    {upholsteryOptions.slice(0, 6).map(item => {
                      const Icon = item.icon;
                      const quantity = getItemQuantity('upholstery_cleaning', item.id);
                      return (
                        <Card key={item.id} className="text-center">
                          <CardContent className="p-4">
                            <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <h4 className="font-medium text-sm mb-1">{item.label}</h4>
                            <div className="text-lg font-bold text-primary mb-2">£{item.price}</div>
                            <div className="flex items-center gap-1 mb-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => decrementArrayItem('upholstery_cleaning', item.id)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => toggleArrayItem('upholstery_cleaning', item)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              className="w-full h-8 text-xs"
                              onClick={() => toggleArrayItem('upholstery_cleaning', item)}
                            >
                              Add
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Mattress Cleaning */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Select Mattress Cleaning</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {mattressOptions.map(mattress => {
                      const Icon = mattress.icon;
                      const quantity = getItemQuantity('mattress_cleaning', mattress.id);
                      return (
                        <Card key={mattress.id} className="text-center">
                          <CardContent className="p-4">
                            <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <h4 className="font-medium text-sm mb-1">{mattress.label}</h4>
                            <div className="text-lg font-bold text-primary mb-2">£{mattress.price}</div>
                            <div className="flex items-center gap-1 mb-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => decrementArrayItem('mattress_cleaning', mattress.id)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => toggleArrayItem('mattress_cleaning', mattress)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              className="w-full h-8 text-xs"
                              onClick={() => toggleArrayItem('mattress_cleaning', mattress)}
                            >
                              Add
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between pt-8">
                  <Button variant="outline" onClick={prevStep} size="lg">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button onClick={nextStep} size="lg" className="px-12">
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Date & Address */}
            {currentStep === 4 && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Booking Details</h2>
                  <p className="text-muted-foreground">Choose your preferred date and confirm the address</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <Label className="text-lg font-semibold flex items-center gap-2 mb-4">
                      Preferred Date <span className="text-destructive">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-12",
                            !formData.preferred_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.preferred_date ? (
                            format(formData.preferred_date, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.preferred_date}
                          onSelect={(date) => updateField('preferred_date', date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label className="text-lg font-semibold flex items-center gap-2 mb-4">
                      Property Address <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      placeholder="Enter the full property address..."
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      className="min-h-[100px] text-base"
                    />
                  </div>

                  <div>
                    <Label className="text-lg font-semibold mb-4 block">Postcode</Label>
                    <Input
                      placeholder="Enter postcode"
                      value={formData.postcode}
                      onChange={(e) => updateField('postcode', e.target.value)}
                      className="text-base h-12"
                    />
                  </div>

                  <div>
                    <Label className="text-lg font-semibold mb-4 block">Additional Notes</Label>
                    <Textarea
                      placeholder="Any special instructions or requirements..."
                      value={formData.additional_notes}
                      onChange={(e) => updateField('additional_notes', e.target.value)}
                      className="min-h-[80px] text-base"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-8">
                  <Button variant="outline" onClick={prevStep} size="lg">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={!canProceed()} size="lg" className="px-12 bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Complete Booking
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Price Calculator Sidebar */}
          <div className="w-80 border-l bg-gradient-to-b from-primary/5 to-primary/10 p-6">
            <Card className="bg-primary text-white">
              <CardHeader className="pb-4">
                <h3 className="text-lg font-bold">End Of Tenancy Cleaning</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Service Details:</h4>
                  <div className="space-y-1 text-sm opacity-90">
                    {formData.property_type && (
                      <div>Property: {propertyTypes.find(p => p.id === formData.property_type)?.label}</div>
                    )}
                    {formData.property_type === 'apartment' && formData.apartment_size && (
                      <div>Size: {apartmentSizes.find(s => s.id === formData.apartment_size)?.label}</div>
                    )}
                    {formData.property_type === 'house' && (
                      <div>{formData.bedrooms} Bedroom{formData.bedrooms !== 1 ? 's' : ''}, {formData.bathrooms} Bathroom{formData.bathrooms !== 1 ? 's' : ''}</div>
                    )}
                    <div>Condition: {propertyConditions.find(c => c.id === formData.property_condition)?.label}</div>
                    
                    {/* Show selected services */}
                    {formData.oven_type !== 'no_oven' && (
                      <div>+ {ovenTypes.find(o => o.id === formData.oven_type)?.label}</div>
                    )}
                    {formData.additional_rooms.length > 0 && (
                      <div>+ {formData.additional_rooms.length} Additional Room{formData.additional_rooms.length !== 1 ? 's' : ''}</div>
                    )}
                    {formData.blinds_shutters.length > 0 && (
                      <div>+ Blinds/Shutters Cleaning</div>
                    )}
                    {formData.extra_services.length > 0 && (
                      <div>+ Extra Services</div>
                    )}
                    {formData.carpet_cleaning.length > 0 && (
                      <div>+ Carpet Cleaning</div>
                    )}
                    {formData.upholstery_cleaning.length > 0 && (
                      <div>+ Upholstery Cleaning</div>
                    )}
                    {formData.mattress_cleaning.length > 0 && (
                      <div>+ Mattress Cleaning</div>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-white/20 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total Cost:</span>
                    <span className="text-2xl font-bold">£{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <input type="checkbox" id="coupon" className="rounded" />
                  <label htmlFor="coupon">I have a coupon code</label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}