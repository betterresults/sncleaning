import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
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
  Plus,
  Minus,
  Calendar,
  MapPin,
  FileText,
  Sparkles,
  Sofa,
  Car,
  Shirt,
  Calculator,
  Utensils,
  Trees,
  Sun,
  BedDouble,
  Armchair,
  Blinds,
  Package,
  User,
  ChevronLeft,
  Building
} from 'lucide-react';

interface EndOfTenancyBookingFormProps {
  onBookingCreated?: () => void;
  children?: React.ReactNode;
  onSubmit?: (bookingData: any) => void;
}

// Property types with large cards
const propertyTypes = [
  { 
    id: 'apartment', 
    label: 'Apartment', 
    icon: Building2, 
    basePrice: 180,
    description: 'Standard apartment or flat'
  },
  { 
    id: 'house', 
    label: 'House', 
    icon: Home, 
    basePrice: 220,
    description: 'Detached or semi-detached house'
  },
  { 
    id: 'studio', 
    label: 'Studio', 
    icon: Building, 
    basePrice: 120,
    description: 'Studio apartment or bedsit'
  },
  { 
    id: 'shared_house', 
    label: 'Shared House', 
    icon: Users, 
    basePrice: 200,
    description: 'House share or HMO property'
  }
];

const propertyConditions = [
  { 
    id: 'excellent', 
    label: 'Well-Maintained', 
    multiplier: 1, 
    color: 'bg-primary',
    description: 'Property is in excellent condition, minimal deep cleaning needed'
  },
  { 
    id: 'good', 
    label: 'Good Condition', 
    multiplier: 1.2, 
    color: 'bg-accent',
    description: 'Standard wear and tear, regular cleaning required'
  },
  { 
    id: 'fair', 
    label: 'Moderate Use', 
    multiplier: 1.5, 
    color: 'bg-muted',
    description: 'Some intensive cleaning needed in areas'
  },
  { 
    id: 'poor', 
    label: 'Heavy Cleaning Required', 
    multiplier: 2, 
    color: 'bg-destructive',
    description: 'Significant deep cleaning and restoration needed'
  }
];

const propertyStatuses = [
  { 
    id: 'furnished', 
    label: 'Furnished', 
    icon: Sofa, 
    color: 'bg-primary',
    description: 'Property has furniture requiring cleaning'
  },
  { 
    id: 'unfurnished', 
    label: 'Unfurnished', 
    icon: Building2, 
    color: 'bg-accent',
    description: 'Empty property, structural cleaning only'
  }
];

// Extra services
const extraServices = [
  { id: 'balcony', label: 'Balcony Deep Clean', price: 25, icon: Trees },
  { id: 'garage', label: 'Garage Cleaning', price: 35, icon: Car },  
  { id: 'utility', label: 'Utility Room', price: 20, icon: Shirt },
  { id: 'conservatory', label: 'Conservatory', price: 30, icon: Sun },
  { id: 'inside_fridge', label: 'Inside Fridge', price: 20, icon: Package },
  { id: 'inside_oven', label: 'Deep Oven Clean', price: 25, icon: Package }
];

// Service categories
const carpetOptions = [
  { id: 'bedroom', label: 'Bedroom Carpet', price: 30, icon: Bed },
  { id: 'living', label: 'Living Room Carpet', price: 45, icon: Sofa },
  { id: 'stairs', label: 'Stairs Carpet', price: 25, icon: Home },
  { id: 'hallway', label: 'Hallway Carpet', price: 20, icon: Home }
];

const upholsteryOptions = [
  { id: 'sofa_2seater', label: '2-Seater Sofa', price: 60, icon: Sofa },
  { id: 'sofa_3seater', label: '3-Seater Sofa', price: 80, icon: Sofa },
  { id: 'armchair', label: 'Armchair', price: 40, icon: Armchair },
  { id: 'dining_chairs', label: 'Dining Chair', price: 15, icon: Utensils }
];

const mattressOptions = [
  { id: 'single', label: 'Single Mattress', price: 25, icon: Bed },
  { id: 'double', label: 'Double Mattress', price: 35, icon: BedDouble },
  { id: 'king', label: 'King Mattress', price: 45, icon: BedDouble }
];

interface FormData {
  // Step 1: Property Type (only this shows initially)
  propertyType: string;
  
  // Step 2: Property Details (shows after type is selected)
  condition: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  
  // Step 3: Extras
  extraServices: string[];
  
  // Step 4: Services
  carpetCleaning: string[];
  upholsteryCleaning: { type: string; count: number }[];
  mattressCleaning: string[];
  
  // Step 5: Booking
  customerId: string;
  customerName: string;
  preferredDate: string;
  address: string;
  postcode: string;
  notes: string;
}

export function EndOfTenancyBookingForm({ onBookingCreated, children, onSubmit }: EndOfTenancyBookingFormProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    propertyType: '',
    condition: '',
    status: '',
    bedrooms: 1,
    bathrooms: 1,
    extraServices: [],
    carpetCleaning: [],
    upholsteryCleaning: [],
    mattressCleaning: [],
    customerId: '',
    customerName: '',
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

    // Base calculation
    let basePrice = propertyType.basePrice * condition.multiplier;
    
    // Add room costs (only for non-studio properties)
    if (formData.propertyType !== 'studio') {
      basePrice += (formData.bedrooms + formData.bathrooms) * 20;
    }

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

  const getUpholsteryCount = (type: string) => {
    return formData.upholsteryCleaning.find(u => u.type === type)?.count || 0;
  };

  const updateRoomCount = (room: 'bedrooms' | 'bathrooms', increment: boolean) => {
    setFormData(prev => ({
      ...prev,
      [room]: Math.max(1, prev[room] + (increment ? 1 : -1))
    }));
  };

  const handleCustomerSelect = (customer: any) => {
    updateField('customerId', customer.id);
    const firstName = customer.first_name || '';
    const lastName = customer.last_name || '';
    updateField('customerName', `${firstName} ${lastName}`.trim());
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.propertyType;
      case 2:
        return formData.condition && formData.status;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return formData.customerId && formData.preferredDate && formData.address;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step <= currentStep || (step === currentStep + 1 && canProceed())) {
      setCurrentStep(step);
    }
  };

  const steps = [
    { number: 1, title: 'Property Type', description: 'Select property type' },
    { number: 2, title: 'Details', description: 'Condition & rooms' },
    { number: 3, title: 'Extras', description: 'Additional services' },
    { number: 4, title: 'Services', description: 'Carpet & cleaning' },
    { number: 5, title: 'Booking', description: 'Date & customer' }
  ];

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setLoading(true);
    try {
      const bookingData = {
        customer: parseInt(formData.customerId),
        service_type: 'End of Tenancy',
        cleaning_type: 'End of Tenancy',
        property_type: formData.propertyType,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        property_details: JSON.stringify({
          condition: formData.condition,
          status: formData.status,
          extraServices: formData.extraServices,
          carpetCleaning: formData.carpetCleaning,
          upholsteryCleaning: formData.upholsteryCleaning,
          mattressCleaning: formData.mattressCleaning
        }),
        date_time: formData.preferredDate,
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
      setCurrentStep(1);
      setFormData({
        propertyType: '',
        condition: '',
        status: '',
        bedrooms: 1,
        bathrooms: 1,
        extraServices: [],
        carpetCleaning: [],
        upholsteryCleaning: [],
        mattressCleaning: [],
        customerId: '',
        customerName: '',
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
            {/* Header - Keep unchanged as requested */}
            <div className="relative px-6 py-6 bg-gradient-to-r from-primary to-accent text-primary-foreground overflow-hidden">
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
                    const isActive = step.number === currentStep;
                    const isCompleted = currentStep > step.number;
                    
                    return (
                      <div key={step.number} className="flex items-center">
                        <button
                          onClick={() => goToStep(step.number)}
                          className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all ${
                            isCompleted
                              ? 'bg-accent text-accent-foreground cursor-pointer hover:scale-105'
                              : isActive
                                ? 'bg-primary-foreground text-primary cursor-pointer'
                                : 'bg-primary-foreground/20 text-primary-foreground/60 cursor-pointer hover:bg-primary-foreground/30'
                          }`}
                        >
                          {isCompleted ? <CheckCircle className="w-5 h-5" /> : step.number}
                        </button>
                        <div className="ml-2 text-sm">
                          <div className={`font-medium ${isActive || isCompleted ? 'text-primary-foreground' : 'text-primary-foreground/60'}`}>
                            {step.title}
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
              
              {/* Step 1: Property Type Only */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200/60">
                    <h3 className="text-2xl font-bold mb-2 text-primary">Select Property Type</h3>
                    <p className="text-muted-foreground mb-8">Choose the type of property for cleaning</p>
                    
                    <div className="grid grid-cols-2 gap-6">
                      {propertyTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <Card 
                            key={type.id}
                            className={`cursor-pointer transition-all hover:shadow-xl border-2 h-40 ${
                              formData.propertyType === type.id 
                                ? 'border-primary bg-primary/5 shadow-xl scale-105' 
                                : 'border-slate-200 hover:border-primary/50 hover:bg-primary/5'
                            }`}
                            onClick={() => updateField('propertyType', type.id)}
                          >
                            <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                              <Icon className={`w-12 h-12 mb-4 ${
                                formData.propertyType === type.id ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                              <h4 className="font-bold text-lg mb-2">{type.label}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
                              <Badge variant="secondary" className="text-xs font-medium">
                                From £{type.basePrice}
                              </Badge>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Property Details (Condition + Status + Rooms) */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* Property Condition */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
                    <h3 className="text-xl font-bold mb-6 text-primary">Property Condition</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {propertyConditions.map((condition) => (
                        <Card 
                          key={condition.id}
                          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                            formData.condition === condition.id 
                              ? 'border-primary bg-primary/5 shadow-lg' 
                              : 'border-slate-200 hover:border-primary/50 hover:bg-primary/5'
                          }`}
                          onClick={() => updateField('condition', condition.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center mb-2">
                              <div className={`w-3 h-3 rounded-full mr-3 ${condition.color}`}></div>
                              <h4 className="font-semibold">{condition.label}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">{condition.description}</p>
                            <Badge variant="outline" className="mt-2 text-xs">
                              {condition.multiplier}x base price
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Property Status */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
                    <h3 className="text-xl font-bold mb-6 text-primary">Property Status</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {propertyStatuses.map((status) => {
                        const Icon = status.icon;
                        return (
                          <Card 
                            key={status.id}
                            className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                              formData.status === status.id 
                                ? 'border-primary bg-primary/5 shadow-lg' 
                                : 'border-slate-200 hover:border-primary/50 hover:bg-primary/5'
                            }`}
                            onClick={() => updateField('status', status.id)}
                          >
                            <CardContent className="p-4 text-center">
                              <Icon className={`w-8 h-8 mx-auto mb-3 ${
                                formData.status === status.id ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                              <h4 className="font-semibold mb-2">{status.label}</h4>
                              <p className="text-sm text-muted-foreground">{status.description}</p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Room Details (only show for non-studio properties) */}
                  {formData.propertyType !== 'studio' && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
                      <h3 className="text-xl font-bold mb-6 text-primary">Room Details</h3>
                      <div className="grid grid-cols-2 gap-6">
                        {/* Bedrooms */}
                        <div className="flex items-center justify-between p-4 border-2 border-slate-200 rounded-lg hover:border-primary/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Bed className="w-6 h-6 text-primary" />
                            <span className="font-semibold">Bedrooms</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateRoomCount('bedrooms', false)}
                              disabled={formData.bedrooms <= 1}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Badge variant="secondary" className="text-lg font-bold px-4 py-2">
                              {formData.bedrooms}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateRoomCount('bedrooms', true)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Bathrooms */}
                        <div className="flex items-center justify-between p-4 border-2 border-slate-200 rounded-lg hover:border-primary/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Bath className="w-6 h-6 text-primary" />
                            <span className="font-semibold">Bathrooms</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateRoomCount('bathrooms', false)}
                              disabled={formData.bathrooms <= 1}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Badge variant="secondary" className="text-lg font-bold px-4 py-2">
                              {formData.bathrooms}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateRoomCount('bathrooms', true)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Extra Services */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
                    <h3 className="text-xl font-bold mb-6 text-primary">Additional Services</h3>
                    <p className="text-muted-foreground mb-6">Select any additional areas or services you need</p>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {extraServices.map((service) => {
                        const Icon = service.icon;
                        const isSelected = formData.extraServices.includes(service.id);
                        return (
                          <Card 
                            key={service.id}
                            className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                              isSelected 
                                ? 'border-primary bg-primary/5 shadow-lg' 
                                : 'border-slate-200 hover:border-primary/50 hover:bg-primary/5'
                            }`}
                            onClick={() => toggleArrayItem('extraServices', service.id)}
                          >
                            <CardContent className="p-4 text-center">
                              <Icon className={`w-8 h-8 mx-auto mb-3 ${
                                isSelected ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                              <h4 className="font-semibold mb-2">{service.label}</h4>
                              <Badge variant={isSelected ? 'default' : 'secondary'} className="text-sm">
                                +£{service.price}
                              </Badge>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Services (Carpet, Upholstery, Mattresses) */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  {/* Carpet Cleaning */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
                    <h3 className="text-xl font-bold mb-6 text-primary">Carpet Cleaning</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {carpetOptions.map((carpet) => {
                        const Icon = carpet.icon;
                        const isSelected = formData.carpetCleaning.includes(carpet.id);
                        return (
                          <Card 
                            key={carpet.id}
                            className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                              isSelected 
                                ? 'border-primary bg-primary/5 shadow-lg' 
                                : 'border-slate-200 hover:border-primary/50 hover:bg-primary/5'
                            }`}
                            onClick={() => toggleArrayItem('carpetCleaning', carpet.id)}
                          >
                            <CardContent className="p-4 text-center">
                              <Icon className={`w-8 h-8 mx-auto mb-3 ${
                                isSelected ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                              <h4 className="font-semibold mb-2">{carpet.label}</h4>
                              <Badge variant={isSelected ? 'default' : 'secondary'} className="text-sm">
                                £{carpet.price}
                              </Badge>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Upholstery Cleaning */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
                    <h3 className="text-xl font-bold mb-6 text-primary">Upholstery Cleaning</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {upholsteryOptions.map((upholstery) => {
                        const Icon = upholstery.icon;
                        const count = getUpholsteryCount(upholstery.id);
                        return (
                          <Card 
                            key={upholstery.id}
                            className={`border-2 transition-all ${
                              count > 0 
                                ? 'border-primary bg-primary/5 shadow-lg' 
                                : 'border-slate-200 hover:border-primary/50 hover:bg-primary/5'
                            }`}
                          >
                            <CardContent className="p-4 text-center">
                              <Icon className={`w-8 h-8 mx-auto mb-3 ${
                                count > 0 ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                              <h4 className="font-semibold mb-2">{upholstery.label}</h4>
                              <Badge variant={count > 0 ? 'default' : 'secondary'} className="text-sm mb-3">
                                £{upholstery.price} each
                              </Badge>
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateUpholsteryCount(upholstery.id, Math.max(0, count - 1))}
                                  disabled={count === 0}
                                  className="h-7 w-7 p-0"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <Badge variant="secondary" className="min-w-[2rem] justify-center">
                                  {count}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateUpholsteryCount(upholstery.id, count + 1)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mattress Cleaning */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
                    <h3 className="text-xl font-bold mb-6 text-primary">Mattress Cleaning</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {mattressOptions.map((mattress) => {
                        const Icon = mattress.icon;
                        const isSelected = formData.mattressCleaning.includes(mattress.id);
                        return (
                          <Card 
                            key={mattress.id}
                            className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                              isSelected 
                                ? 'border-primary bg-primary/5 shadow-lg' 
                                : 'border-slate-200 hover:border-primary/50 hover:bg-primary/5'
                            }`}
                            onClick={() => toggleArrayItem('mattressCleaning', mattress.id)}
                          >
                            <CardContent className="p-4 text-center">
                              <Icon className={`w-8 h-8 mx-auto mb-3 ${
                                isSelected ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                              <h4 className="font-semibold mb-2">{mattress.label}</h4>
                              <Badge variant={isSelected ? 'default' : 'secondary'} className="text-sm">
                                £{mattress.price}
                              </Badge>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Booking Details */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
                    <h3 className="text-xl font-bold mb-6 text-primary">Booking Details</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Customer Selection */}
                      <div>
                        <Label className="text-base font-semibold mb-3 block">Select Customer</Label>
                        <CustomerSelector onCustomerSelect={handleCustomerSelect} />
                        {formData.customerName && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Selected: {formData.customerName}
                          </p>
                        )}
                      </div>

                      {/* Preferred Date */}
                      <div>
                        <Label className="text-base font-semibold mb-3 block">Preferred Date & Time</Label>
                        <Input
                          type="datetime-local"
                          value={formData.preferredDate}
                          onChange={(e) => updateField('preferredDate', e.target.value)}
                          className="w-full"
                        />
                      </div>

                      {/* Address */}
                      <div>
                        <Label className="text-base font-semibold mb-3 block">Property Address</Label>
                        <Input
                          placeholder="Enter full address"
                          value={formData.address}
                          onChange={(e) => updateField('address', e.target.value)}
                          className="w-full"
                        />
                      </div>

                      {/* Postcode */}
                      <div>
                        <Label className="text-base font-semibold mb-3 block">Postcode</Label>
                        <Input
                          placeholder="Enter postcode"
                          value={formData.postcode}
                          onChange={(e) => updateField('postcode', e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mt-6">
                      <Label className="text-base font-semibold mb-3 block">Additional Notes</Label>
                      <Textarea
                        placeholder="Any special instructions or requirements..."
                        value={formData.notes}
                        onChange={(e) => updateField('notes', e.target.value)}
                        className="w-full h-24"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="text-sm text-muted-foreground">
                  Step {currentStep} of {steps.length}
                </div>

                {currentStep === 5 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceed() || loading}
                    className="flex items-center gap-2"
                  >
                    {loading ? 'Creating...' : 'Create Booking'}
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Booking Summary - Keep unchanged as requested */}
          <div className="w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto">
            <div className="sticky top-0 bg-white">
              <div className="flex items-center gap-2 mb-6">
                <Calculator className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-primary">Booking Summary</h3>
              </div>

              {/* Property Summary */}
              {formData.propertyType && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Property Details</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-sm">
                    <div>Type: {propertyTypes.find(p => p.id === formData.propertyType)?.label}</div>
                    {formData.condition && (
                      <div>Condition: {propertyConditions.find(c => c.id === formData.condition)?.label}</div>
                    )}
                    {formData.status && (
                      <div>Status: {propertyStatuses.find(s => s.id === formData.status)?.label}</div>
                    )}
                    {formData.propertyType !== 'studio' && (
                      <div>Rooms: {formData.bedrooms} bed, {formData.bathrooms} bath</div>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Services */}
              {(formData.extraServices.length > 0 || formData.carpetCleaning.length > 0 || 
                formData.upholsteryCleaning.length > 0 || formData.mattressCleaning.length > 0) && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Selected Services</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {formData.extraServices.map(serviceId => {
                      const service = extraServices.find(s => s.id === serviceId);
                      return service && (
                        <div key={serviceId} className="flex justify-between bg-slate-50 rounded px-2 py-1">
                          <span>{service.label}</span>
                          <span>£{service.price}</span>
                        </div>
                      );
                    })}
                    {formData.carpetCleaning.map(carpetId => {
                      const carpet = carpetOptions.find(c => c.id === carpetId);
                      return carpet && (
                        <div key={carpetId} className="flex justify-between bg-slate-50 rounded px-2 py-1">
                          <span>{carpet.label}</span>
                          <span>£{carpet.price}</span>
                        </div>
                      );
                    })}
                    {formData.upholsteryCleaning.map(upholstery => {
                      const upholsteryType = upholsteryOptions.find(u => u.id === upholstery.type);
                      return upholsteryType && (
                        <div key={upholstery.type} className="flex justify-between bg-slate-50 rounded px-2 py-1">
                          <span>{upholsteryType.label} x{upholstery.count}</span>
                          <span>£{upholsteryType.price * upholstery.count}</span>
                        </div>
                      );
                    })}
                    {formData.mattressCleaning.map(mattressId => {
                      const mattress = mattressOptions.find(m => m.id === mattressId);
                      return mattress && (
                        <div key={mattressId} className="flex justify-between bg-slate-50 rounded px-2 py-1">
                          <span>{mattress.label}</span>
                          <span>£{mattress.price}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Total Price */}
              <Separator className="my-4" />
              <div className="bg-primary/5 rounded-lg p-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Price</span>
                  <span className="text-primary">£{totalPrice}</span>
                </div>
                {totalPrice > 0 && formData.propertyType && formData.condition && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Base price includes property cleaning with selected condition multiplier
                  </p>
                )}
              </div>

              {/* Customer & Date */}
              {(formData.customerName || formData.preferredDate) && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Booking Info</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                    {formData.customerName && <div>Customer: {formData.customerName}</div>}
                    {formData.preferredDate && (
                      <div>Date: {new Date(formData.preferredDate).toLocaleString()}</div>
                    )}
                    {formData.address && <div>Address: {formData.address}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
