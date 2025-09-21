import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CustomerSelector from './CustomerSelector';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Home, 
  Building2, 
  Bed,
  Bath,
  Users,
  CheckCircle,
  ChevronRight,
  Info,
  Plus,
  Minus,
  Calendar,
  MapPin,
  FileText,
  Sparkles,
  Sofa,
  Car,
  Cookie,
  Shirt,
  Refrigerator,
  Monitor,
  Blinds,
  Package,
  Grid3X3,
  CheckSquare,
  User,
  ChevronLeft
} from 'lucide-react';

interface EndOfTenancyBookingFormProps {
  onBookingCreated?: () => void;
  children?: React.ReactNode;
  onSubmit?: (bookingData: any) => void;
}

// Property configurations
const propertyTypes = [
  { id: 'apartment', label: 'Apartment', icon: Building2, basePrice: 180 },
  { id: 'house', label: 'House', icon: Home, basePrice: 220 },
  { id: 'studio', label: 'Studio', icon: Bed, basePrice: 120 },
  { id: 'shared_house', label: 'Shared House', icon: Users, basePrice: 200 }
];

const propertyConditions = [
  { id: 'excellent', label: 'Excellent', multiplier: 1, description: 'Recently cleaned, minimal work needed' },
  { id: 'good', label: 'Good', multiplier: 1.2, description: 'Regular use, standard cleaning required' },
  { id: 'fair', label: 'Fair', multiplier: 1.5, description: 'Some deep cleaning needed' },
  { id: 'poor', label: 'Poor', multiplier: 2, description: 'Significant cleaning and restoration required' }
];

const propertyStatuses = [
  { id: 'furnished', label: 'Furnished', icon: Sofa, description: 'Property has furniture' },
  { id: 'unfurnished', label: 'Unfurnished', icon: Home, description: 'Property is empty' }
];

// Additional services
const additionalRooms = [
  { id: 'conservatory', label: 'Conservatory', price: 25, icon: Building2 },
  { id: 'garage', label: 'Garage', price: 30, icon: Car },
  { id: 'utility', label: 'Utility Room', price: 20, icon: Shirt },
  { id: 'pantry', label: 'Pantry', price: 15, icon: Cookie }
];

const ovenTypes = [
  { id: 'single', label: 'Single Oven', price: 25, icon: Cookie },
  { id: 'double', label: 'Double Oven', price: 40, icon: Cookie },
  { id: 'range', label: 'Range Cooker', price: 55, icon: Cookie }
];

const blindsOptions = [
  { id: 'venetian', label: 'Venetian Blinds', price: 8, icon: Blinds },
  { id: 'vertical', label: 'Vertical Blinds', price: 10, icon: Blinds },
  { id: 'roller', label: 'Roller Blinds', price: 6, icon: Blinds }
];

const extraServices = [
  { id: 'fridge', label: 'Inside Fridge', price: 20, icon: Refrigerator },
  { id: 'washing_machine', label: 'Inside Washing Machine', price: 15, icon: Shirt },
  { id: 'dishwasher', label: 'Inside Dishwasher', price: 15, icon: Sparkles },
  { id: 'microwave', label: 'Inside Microwave', price: 10, icon: Monitor },
  { id: 'bbq', label: 'BBQ Cleaning', price: 35, icon: Sparkles },
  { id: 'balcony', label: 'Balcony Deep Clean', price: 25, icon: Building2 }
];

const carpetOptions = [
  { id: 'bedroom', label: 'Bedroom Carpet', price: 30, icon: Bed },
  { id: 'living', label: 'Living Room Carpet', price: 45, icon: Sofa },
  { id: 'stairs', label: 'Stairs Carpet', price: 25, icon: Home },
  { id: 'hallway', label: 'Hallway Carpet', price: 20, icon: Home }
];

const upholsteryOptions = [
  { id: 'sofa_2seater', label: '2-Seater Sofa', price: 60, icon: Sofa },
  { id: 'sofa_3seater', label: '3-Seater Sofa', price: 80, icon: Sofa },
  { id: 'armchair', label: 'Armchair', price: 40, icon: Sofa },
  { id: 'dining_chairs', label: 'Dining Chairs (per chair)', price: 15, icon: Sofa }
];

const mattressOptions = [
  { id: 'single', label: 'Single Mattress', price: 25, icon: Bed },
  { id: 'double', label: 'Double Mattress', price: 35, icon: Bed },
  { id: 'king', label: 'King Mattress', price: 45, icon: Bed },
  { id: 'super_king', label: 'Super King Mattress', price: 55, icon: Bed }
];

const steps = [
  { id: 'property', label: 'Property Type', icon: Home },
  { id: 'condition', label: 'Property Condition', icon: Info },
  { id: 'furnished', label: 'Furnished Status', icon: Package },
  { id: 'details', label: 'Room Details', icon: Grid3X3 },
  { id: 'extras', label: 'Extras', icon: Plus },
  { id: 'services', label: 'Services', icon: CheckSquare },
  { id: 'booking', label: 'Booking Details', icon: Calendar },
];

interface FormData {
  // Property details
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  toilets: number;
  condition: string;
  status: string;
  
  // Customer
  customerId: string;
  customerName: string;
  
  // Additional services
  additionalRooms: string[];
  ovenCleaning: string[];
  blindsCleaning: { type: string; count: number }[];
  extraServices: string[];
  carpetCleaning: string[];
  upholsteryCleaning: { type: string; count: number }[];
  mattressCleaning: string[];
  
  // Booking details
  preferredDate: string;
  address: string;
  postcode: string;
  notes: string;
}

export function EndOfTenancyBookingForm({ onBookingCreated, children, onSubmit }: EndOfTenancyBookingFormProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState('property');
  const [loading, setLoading] = useState(false);
  const [showConditionInfo, setShowConditionInfo] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    propertyType: '',
    bedrooms: 1,
    bathrooms: 1,
    toilets: 1,
    condition: '',
    status: '',
    customerId: '',
    customerName: '',
    additionalRooms: [],
    ovenCleaning: [],
    blindsCleaning: [],
    extraServices: [],
    carpetCleaning: [],
    upholsteryCleaning: [],
    mattressCleaning: [],
    preferredDate: '',
    address: '',
    postcode: '',
    notes: ''
  });

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!formData.propertyType || !formData.condition) return 0;

    const propertyType = propertyTypes.find(p => p.id === formData.propertyType);
    const condition = propertyConditions.find(c => c.id === formData.condition);

    if (!propertyType || !condition) return 0;

    // Base calculation: property base price * condition multiplier + (bedrooms + bathrooms) * 20
    let basePrice = propertyType.basePrice * condition.multiplier;
    basePrice += (formData.bedrooms + formData.bathrooms) * 20;

    // Add additional rooms
    basePrice += formData.additionalRooms.reduce((sum, roomId) => {
      const room = additionalRooms.find(r => r.id === roomId);
      return sum + (room?.price || 0);
    }, 0);

    // Add oven cleaning
    basePrice += formData.ovenCleaning.reduce((sum, ovenId) => {
      const oven = ovenTypes.find(o => o.id === ovenId);
      return sum + (oven?.price || 0);
    }, 0);

    // Add blinds cleaning
    basePrice += formData.blindsCleaning.reduce((sum, blind) => {
      const blindType = blindsOptions.find(b => b.id === blind.type);
      return sum + (blindType?.price || 0) * blind.count;
    }, 0);

    // Add extra services
    basePrice += formData.extraServices.reduce((sum, serviceId) => {
      const service = extraServices.find(s => s.id === serviceId);
      return sum + (service?.price || 0);
    }, 0);

    // Add carpet cleaning
    basePrice += formData.carpetCleaning.reduce((sum, carpetId) => {
      const carpet = carpetOptions.find(c => c.id === carpetId);
      return sum + (carpet?.price || 0);
    }, 0);

    // Add upholstery cleaning
    basePrice += formData.upholsteryCleaning.reduce((sum, upholstery) => {
      const upholsteryType = upholsteryOptions.find(u => u.id === upholstery.type);
      return sum + (upholsteryType?.price || 0) * upholstery.count;
    }, 0);

    // Add mattress cleaning
    basePrice += formData.mattressCleaning.reduce((sum, mattressId) => {
      const mattress = mattressOptions.find(m => m.id === mattressId);
      return sum + (mattress?.price || 0);
    }, 0);

    return Math.round(basePrice);
  }, [formData]);

  // Helper functions
  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof FormData, item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: Array.isArray(prev[field]) 
        ? (prev[field] as string[]).includes(item)
          ? (prev[field] as string[]).filter(i => i !== item)
          : [...(prev[field] as string[]), item]
        : [item]
    }));
  };

  const updateBlindCount = (type: string, count: number) => {
    setFormData(prev => ({
      ...prev,
      blindsCleaning: count === 0 
        ? prev.blindsCleaning.filter(b => b.type !== type)
        : prev.blindsCleaning.some(b => b.type === type)
          ? prev.blindsCleaning.map(b => b.type === type ? { ...b, count } : b)
          : [...prev.blindsCleaning, { type, count }]
    }));
  };

  const updateUpholsteryCount = (type: string, count: number) => {
    setFormData(prev => ({
      ...prev,
      upholsteryCleaning: count === 0 
        ? prev.upholsteryCleaning.filter(u => u.type !== type)
        : prev.upholsteryCleaning.some(u => u.type === type)
          ? prev.upholsteryCleaning.map(u => u.type === type ? { ...u, count } : u)
          : [...prev.upholsteryCleaning, { type, count }]
    }));
  };

  const getBlindCount = (type: string) => {
    return formData.blindsCleaning.find(b => b.type === type)?.count || 0;
  };

  const getUpholsteryCount = (type: string) => {
    return formData.upholsteryCleaning.find(u => u.type === type)?.count || 0;
  };

  const handleCustomerSelect = (customer: any) => {
    updateField('customerId', customer.id);
    updateField('customerName', `${customer.first_name} ${customer.last_name}`);
  };

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
  
  const nextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const goToStep = (stepId: string) => {
    setCurrentStep(stepId);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'property':
        return formData.propertyType;
      case 'condition':
        return formData.condition;
      case 'furnished':
        return formData.status;
      case 'details':
        return formData.bedrooms >= 0 && formData.bathrooms >= 0;
      case 'extras':
        return true; // Optional step
      case 'services':
        return true; // Optional step
      case 'booking':
        return formData.customerId && formData.preferredDate && formData.address;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setLoading(true);
    try {
      const bookingData = {
        customer_id: formData.customerId,
        service_type: 'End of Tenancy Cleaning',
        property_type: formData.propertyType,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        condition: formData.condition,
        status: formData.status,
        additional_services: JSON.stringify({
          additionalRooms: formData.additionalRooms,
          ovenCleaning: formData.ovenCleaning,
          blindsCleaning: formData.blindsCleaning,
          extraServices: formData.extraServices,
          carpetCleaning: formData.carpetCleaning,
          upholsteryCleaning: formData.upholsteryCleaning,
          mattressCleaning: formData.mattressCleaning
        }),
        preferred_date: formData.preferredDate,
        address: formData.address,
        postcode: formData.postcode,
        notes: formData.notes,
        total_cost: totalPrice,
        booking_status: 'pending'
      };

      const { error } = await supabase
        .from('bookings')
        .insert([bookingData]);

      if (error) throw error;

      toast.success('End of Tenancy booking created successfully!');
      setOpen(false);
      setCurrentStep('property');
      setFormData({
        propertyType: '',
        bedrooms: 1,
        bathrooms: 1,
        toilets: 1,
        condition: '',
        status: '',
        customerId: '',
        customerName: '',
        additionalRooms: [],
        ovenCleaning: [],
        blindsCleaning: [],
        extraServices: [],
        carpetCleaning: [],
        upholsteryCleaning: [],
        mattressCleaning: [],
        preferredDate: '',
        address: '',
        postcode: '',
        notes: ''
      });
      onBookingCreated?.();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children || (
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
              <Sparkles className="w-4 h-4 mr-2" />
              End of Tenancy Cleaning
            </Button>
          )}
        </DialogTrigger>
        
        <DialogContent className="max-w-7xl h-[95vh] p-0 overflow-hidden bg-background">
          <div className="flex h-full">
            {/* Main Form */}
            <div className="flex-1 flex flex-col">
              {/* Modern Header with Illustration */}
              <div className="relative px-6 py-6 bg-gradient-to-r from-primary to-accent text-primary-foreground overflow-hidden">
                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="absolute bottom-0 right-16 w-16 h-16 bg-white/5 rounded-full translate-y-4"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">End of Tenancy Cleaning</h2>
                      <p className="text-primary-foreground/80">Professional cleaning for your move-out</p>
                    </div>
                    <Sparkles className="w-12 h-12 text-accent" />
                  </div>
                  
                  {/* Step Indicator */}
                  <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                      const StepIcon = step.icon;
                      const isActive = step.id === currentStep;
                      const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
                      
                      return (
                        <div key={step.id} className="flex items-center">
                          <button
                            onClick={() => goToStep(step.id)}
                            className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all ${
                              isCompleted
                                ? 'bg-accent text-accent-foreground cursor-pointer hover:scale-105'
                                : isActive
                                  ? 'bg-primary-foreground text-primary cursor-pointer'
                                  : 'bg-primary-foreground/20 text-primary-foreground/60 cursor-pointer hover:bg-primary-foreground/30'
                            }`}
                          >
                            {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                          </button>
                          <div className="ml-2 text-sm">
                            <div className={`font-medium ${isActive || isCompleted ? 'text-primary-foreground' : 'text-primary-foreground/60'}`}>
                              {step.label}
                            </div>
                          </div>
                          {index < steps.length - 1 && (
                            <div className={`w-8 h-0.5 mx-3 ${isCompleted ? 'bg-accent' : 'bg-primary-foreground/20'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {/* Step 1: Property Type */}
                {currentStep === 'property' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
                      <Label className="text-xl font-semibold mb-6 block text-primary">Select Property Type</Label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {propertyTypes.map((type) => {
                          const Icon = type.icon;
                          return (
                            <Card 
                              key={type.id}
                              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                                formData.propertyType === type.id 
                                  ? 'border-accent bg-accent/10 shadow-lg' 
                                  : 'border-slate-200 hover:border-accent/50 hover:bg-accent/5'
                              }`}
                              onClick={() => updateField('propertyType', type.id)}
                            >
                              <CardContent className="p-6 text-center">
                                <Icon className="w-12 h-12 mx-auto mb-3 text-primary" />
                                <div className="font-semibold text-base mb-1">{type.label}</div>
                                <div className="text-sm text-accent font-medium">From £{type.basePrice}</div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Property Condition */}
                {currentStep === 'condition' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
                      <div className="flex items-center justify-between mb-6">
                        <Label className="text-xl font-semibold text-primary">Property Condition</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setShowConditionInfo(!showConditionInfo)}
                            >
                              <Info className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-xs">
                              <p className="text-sm">Property condition affects the final price. Better condition = lower price.</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {propertyConditions.map((condition) => (
                          <Card
                            key={condition.id}
                            className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                              formData.condition === condition.id 
                                ? 'border-accent bg-accent/10 shadow-lg' 
                                : 'border-slate-200 hover:border-accent/50 hover:bg-accent/5'
                            }`}
                            onClick={() => updateField('condition', condition.id)}
                          >
                            <CardContent className="p-5">
                              <div className="font-semibold text-base mb-2">{condition.label}</div>
                              <div className="text-sm text-muted-foreground mb-2">{condition.description}</div>
                              <div className="text-sm font-medium text-accent">
                                Price multiplier: {condition.multiplier}x
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Furnished Status */}
                {currentStep === 'furnished' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
                      <Label className="text-xl font-semibold mb-6 block text-primary">Furnished Status</Label>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {propertyStatuses.map((status) => {
                          const Icon = status.icon;
                          return (
                            <Card
                              key={status.id}
                              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                                formData.status === status.id 
                                  ? 'border-accent bg-accent/10 shadow-lg' 
                                  : 'border-slate-200 hover:border-accent/50 hover:bg-accent/5'
                              }`}
                              onClick={() => updateField('status', status.id)}
                            >
                              <CardContent className="p-6 text-center">
                                <Icon className="w-12 h-12 mx-auto mb-3 text-primary" />
                                <div className="font-semibold text-base mb-1">{status.label}</div>
                                <div className="text-sm text-muted-foreground">{status.description}</div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Room Details */}
                {currentStep === 'details' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
                      <Label className="text-xl font-semibold mb-6 block text-primary">Room Details</Label>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Bedrooms */}
                        <div className="space-y-3">
                          <Label className="text-base font-medium flex items-center gap-2">
                            <Bed className="w-4 h-4 text-accent" />
                            Bedrooms
                          </Label>
                          <div className="flex items-center justify-center gap-3 bg-slate-50 rounded-lg p-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateField('bedrooms', Math.max(0, formData.bedrooms - 1))}
                              disabled={formData.bedrooms <= 0}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="text-xl font-semibold min-w-[3rem] text-center">{formData.bedrooms}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateField('bedrooms', formData.bedrooms + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Bathrooms */}
                        <div className="space-y-3">
                          <Label className="text-base font-medium flex items-center gap-2">
                            <Bath className="w-4 h-4 text-accent" />
                            Bathrooms
                          </Label>
                          <div className="flex items-center justify-center gap-3 bg-slate-50 rounded-lg p-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateField('bathrooms', Math.max(0, formData.bathrooms - 1))}
                              disabled={formData.bathrooms <= 0}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="text-xl font-semibold min-w-[3rem] text-center">{formData.bathrooms}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateField('bathrooms', formData.bathrooms + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Toilets */}
                        <div className="space-y-3">
                          <Label className="text-base font-medium flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-accent" />
                            Separate Toilets
                          </Label>
                          <div className="flex items-center justify-center gap-3 bg-slate-50 rounded-lg p-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateField('toilets', Math.max(0, formData.toilets - 1))}
                              disabled={formData.toilets <= 0}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="text-xl font-semibold min-w-[3rem] text-center">{formData.toilets}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateField('toilets', formData.toilets + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Extras */}
                {currentStep === 'extras' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
                      <Label className="text-xl font-semibold mb-6 block text-primary">Additional Rooms</Label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {additionalRooms.map((room) => {
                          const Icon = room.icon;
                          const isSelected = formData.additionalRooms.includes(room.id);
                          return (
                            <Card
                              key={room.id}
                              className={`cursor-pointer transition-all border-2 ${
                                isSelected 
                                  ? 'border-accent bg-accent/10' 
                                  : 'border-slate-200 hover:border-accent/50'
                              }`}
                              onClick={() => toggleArrayItem('additionalRooms', room.id)}
                            >
                              <CardContent className="p-4 text-center">
                                <Icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                                <div className="text-sm font-medium mb-1">{room.label}</div>
                                <div className="text-xs text-accent font-medium">+£{room.price}</div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
                      <Label className="text-xl font-semibold mb-6 block text-primary">Oven Cleaning</Label>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        {ovenTypes.map((oven) => {
                          const Icon = oven.icon;
                          const isSelected = formData.ovenCleaning.includes(oven.id);
                          return (
                            <Card
                              key={oven.id}
                              className={`cursor-pointer transition-all border-2 ${
                                isSelected 
                                  ? 'border-accent bg-accent/10' 
                                  : 'border-slate-200 hover:border-accent/50'
                              }`}
                              onClick={() => toggleArrayItem('ovenCleaning', oven.id)}
                            >
                              <CardContent className="p-4 text-center">
                                <Icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                                <div className="text-sm font-medium mb-1">{oven.label}</div>
                                <div className="text-xs text-accent font-medium">+£{oven.price}</div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 6: Services */}
                {currentStep === 'services' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
                      <Label className="text-xl font-semibold mb-6 block text-primary">Carpet Cleaning</Label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {carpetOptions.map((carpet) => {
                          const Icon = carpet.icon;
                          const isSelected = formData.carpetCleaning.includes(carpet.id);
                          return (
                            <Card
                              key={carpet.id}
                              className={`cursor-pointer transition-all border-2 ${
                                isSelected 
                                  ? 'border-accent bg-accent/10' 
                                  : 'border-slate-200 hover:border-accent/50'
                              }`}
                              onClick={() => toggleArrayItem('carpetCleaning', carpet.id)}
                            >
                              <CardContent className="p-4 text-center">
                                <Icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                                <div className="text-sm font-medium mb-1">{carpet.label}</div>
                                <div className="text-xs text-accent font-medium">+£{carpet.price}</div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
                      <Label className="text-xl font-semibold mb-6 block text-primary">Extra Services</Label>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {extraServices.map((service) => {
                          const Icon = service.icon;
                          const isSelected = formData.extraServices.includes(service.id);
                          return (
                            <Card
                              key={service.id}
                              className={`cursor-pointer transition-all border-2 ${
                                isSelected 
                                  ? 'border-accent bg-accent/10' 
                                  : 'border-slate-200 hover:border-accent/50'
                              }`}
                              onClick={() => toggleArrayItem('extraServices', service.id)}
                            >
                              <CardContent className="p-4 text-center">
                                <Icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                                <div className="text-sm font-medium mb-1">{service.label}</div>
                                <div className="text-xs text-accent font-medium">+£{service.price}</div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 7: Booking Details */}
                {currentStep === 'booking' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
                      <Label className="text-xl font-semibold mb-6 block text-primary">Customer Selection</Label>
                      <CustomerSelector onCustomerSelect={handleCustomerSelect} />
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
                      <Label className="text-xl font-semibold mb-6 block text-primary">Booking Details</Label>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="date" className="text-base font-medium">Preferred Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={formData.preferredDate}
                            onChange={(e) => updateField('preferredDate', e.target.value)}
                            className="border-slate-300"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="postcode" className="text-base font-medium">Postcode</Label>
                          <Input
                            id="postcode"
                            placeholder="e.g. SW1A 1AA"
                            value={formData.postcode}
                            onChange={(e) => updateField('postcode', e.target.value)}
                            className="border-slate-300"
                          />
                        </div>
                      </div>
                      <div className="mt-6 space-y-3">
                        <Label htmlFor="address" className="text-base font-medium">Full Address</Label>
                        <Textarea
                          id="address"
                          placeholder="Enter the complete property address"
                          value={formData.address}
                          onChange={(e) => updateField('address', e.target.value)}
                          className="border-slate-300"
                          rows={3}
                        />
                      </div>
                      <div className="mt-6 space-y-3">
                        <Label htmlFor="notes" className="text-base font-medium">Additional Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any special requirements or notes..."
                          value={formData.notes}
                          onChange={(e) => updateField('notes', e.target.value)}
                          className="border-slate-300"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={getCurrentStepIndex() === 0}
                    className="border-slate-300"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  
                  {getCurrentStepIndex() === steps.length - 1 ? (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!canProceed() || loading}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      {loading ? 'Creating...' : 'Create Booking'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Price Calculator Sidebar */}
            <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-primary mb-2">Booking Summary</h3>
                <p className="text-sm text-muted-foreground">Live price calculation</p>
              </div>

              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                {formData.propertyType && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">{propertyTypes.find(p => p.id === formData.propertyType)?.label}</span>
                    <span className="font-medium text-accent">
                      £{propertyTypes.find(p => p.id === formData.propertyType)?.basePrice}
                    </span>
                  </div>
                )}

                {formData.condition && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Condition ({propertyConditions.find(c => c.id === formData.condition)?.label})</span>
                    <span className="font-medium text-accent">
                      x{propertyConditions.find(c => c.id === formData.condition)?.multiplier}
                    </span>
                  </div>
                )}

                {(formData.bedrooms > 0 || formData.bathrooms > 0) && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Rooms ({formData.bedrooms + formData.bathrooms})</span>
                    <span className="font-medium text-accent">
                      £{(formData.bedrooms + formData.bathrooms) * 20}
                    </span>
                  </div>
                )}

                {formData.additionalRooms.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Additional Rooms:</div>
                    {formData.additionalRooms.map(roomId => {
                      const room = additionalRooms.find(r => r.id === roomId);
                      return room ? (
                        <div key={roomId} className="flex justify-between items-center py-1 pl-3">
                          <span className="text-xs">{room.label}</span>
                          <span className="text-sm font-medium text-accent">£{room.price}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {formData.ovenCleaning.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Oven Cleaning:</div>
                    {formData.ovenCleaning.map(ovenId => {
                      const oven = ovenTypes.find(o => o.id === ovenId);
                      return oven ? (
                        <div key={ovenId} className="flex justify-between items-center py-1 pl-3">
                          <span className="text-xs">{oven.label}</span>
                          <span className="text-sm font-medium text-accent">£{oven.price}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {formData.carpetCleaning.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Carpet Cleaning:</div>
                    {formData.carpetCleaning.map(carpetId => {
                      const carpet = carpetOptions.find(c => c.id === carpetId);
                      return carpet ? (
                        <div key={carpetId} className="flex justify-between items-center py-1 pl-3">
                          <span className="text-xs">{carpet.label}</span>
                          <span className="text-sm font-medium text-accent">£{carpet.price}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {formData.extraServices.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Extra Services:</div>
                    {formData.extraServices.map(serviceId => {
                      const service = extraServices.find(s => s.id === serviceId);
                      return service ? (
                        <div key={serviceId} className="flex justify-between items-center py-1 pl-3">
                          <span className="text-xs">{service.label}</span>
                          <span className="text-sm font-medium text-accent">£{service.price}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-primary">Total Price:</span>
                  <span className="text-2xl font-bold text-accent">£{totalPrice}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Final price may vary based on property inspection
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}