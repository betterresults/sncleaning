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
  Building,
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
  Trash2,
  Monitor,
  Blinds,
  HandHeart,
  Scissors
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
  { id: 'shared_house', label: 'Shared House', icon: Users, basePrice: 200 },
  { id: 'office', label: 'Office', icon: Building, basePrice: 150 }
];

const propertySizes = [
  { id: '1bed', label: '1 Bedroom', multiplier: 1 },
  { id: '2bed', label: '2 Bedrooms', multiplier: 1.3 },
  { id: '3bed', label: '3 Bedrooms', multiplier: 1.6 },
  { id: '4bed', label: '4+ Bedrooms', multiplier: 2 }
];

const propertyConditions = [
  { id: 'excellent', label: 'Excellent', multiplier: 1, description: 'Recently cleaned, minimal work needed' },
  { id: 'good', label: 'Good', multiplier: 1.2, description: 'Regular use, standard cleaning required' },
  { id: 'fair', label: 'Fair', multiplier: 1.5, description: 'Some deep cleaning needed' },
  { id: 'poor', label: 'Poor', multiplier: 2, description: 'Significant cleaning and restoration required' }
];

const propertyStatuses = [
  { id: 'furnished', label: 'Furnished', icon: Sofa },
  { id: 'unfurnished', label: 'Unfurnished', icon: Home }
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

interface FormData {
  // Property details
  propertyType: string;
  propertySize: string;
  bedrooms: number;
  bathrooms: number;
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

const steps = [
  { id: 1, title: 'Property', description: 'Property details' },
  { id: 2, title: 'Customer', description: 'Customer selection' },
  { id: 3, title: 'Services', description: 'Additional services' },
  { id: 4, title: 'Booking', description: 'Date & details' }
];

export function EndOfTenancyBookingForm({ onBookingCreated, children, onSubmit }: EndOfTenancyBookingFormProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    propertyType: '',
    propertySize: '',
    bedrooms: 1,
    bathrooms: 1,
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
    if (!formData.propertyType || !formData.propertySize || !formData.condition) return 0;

    const propertyType = propertyTypes.find(p => p.id === formData.propertyType);
    const propertySize = propertySizes.find(s => s.id === formData.propertySize);
    const condition = propertyConditions.find(c => c.id === formData.condition);

    if (!propertyType || !propertySize || !condition) return 0;

    let basePrice = propertyType.basePrice * propertySize.multiplier * condition.multiplier;

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

  const nextStep = () => {
    if (canProceed()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.propertyType && formData.propertySize && formData.condition && formData.status;
      case 2:
        return formData.customerId;
      case 3:
        return true;
      case 4:
        return formData.preferredDate && formData.address;
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
        property_size: formData.propertySize,
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
      setCurrentStep(1);
      setFormData({
        propertyType: '',
        propertySize: '',
        bedrooms: 1,
        bathrooms: 1,
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-primary hover:bg-primary-dark text-primary-foreground">
            <Sparkles className="w-4 h-4 mr-2" />
            End of Tenancy Cleaning
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Main Form */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-card">
              <h2 className="text-2xl font-bold text-primary mb-4">End of Tenancy Cleaning</h2>
              
              {/* Step Indicator */}
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                      ${currentStep > step.id 
                        ? 'bg-accent text-accent-foreground' 
                        : currentStep === step.id 
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      {currentStep > step.id ? <CheckCircle className="w-4 h-4" /> : step.id}
                    </div>
                    <div className="ml-2 text-sm">
                      <div className={`font-medium ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.title}
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-px mx-4 ${currentStep > step.id ? 'bg-accent' : 'bg-border'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Step 1: Property Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Property Type</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {propertyTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <Card 
                            key={type.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              formData.propertyType === type.id 
                                ? 'ring-2 ring-primary bg-primary/5' 
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => updateField('propertyType', type.id)}
                          >
                            <CardContent className="p-4 text-center">
                              <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                              <div className="font-medium text-sm">{type.label}</div>
                              <div className="text-xs text-muted-foreground">From £{type.basePrice}</div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Property Size</Label>
                      <div className="space-y-2">
                        {propertySizes.map((size) => (
                          <Card
                            key={size.id}
                            className={`cursor-pointer transition-all ${
                              formData.propertySize === size.id 
                                ? 'ring-2 ring-primary bg-primary/5' 
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => updateField('propertySize', size.id)}
                          >
                            <CardContent className="p-3">
                              <div className="font-medium text-sm">{size.label}</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-semibold mb-3 block">Property Condition</Label>
                      <div className="space-y-2">
                        {propertyConditions.map((condition) => (
                          <Card
                            key={condition.id}
                            className={`cursor-pointer transition-all ${
                              formData.condition === condition.id 
                                ? 'ring-2 ring-primary bg-primary/5' 
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => updateField('condition', condition.id)}
                          >
                            <CardContent className="p-3 flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm capitalize">{condition.label}</div>
                                <div className="text-xs text-muted-foreground">{condition.description}</div>
                              </div>
                              <Info className="w-4 h-4 text-muted-foreground" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                        <Bed className="w-4 h-4" />
                        Bedrooms: {formData.bedrooms}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateField('bedrooms', Math.max(1, formData.bedrooms - 1))}
                          disabled={formData.bedrooms <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <div className="w-12 text-center font-medium">{formData.bedrooms}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateField('bedrooms', formData.bedrooms + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                        <Bath className="w-4 h-4" />
                        Bathrooms: {formData.bathrooms}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateField('bathrooms', Math.max(1, formData.bathrooms - 1))}
                          disabled={formData.bathrooms <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <div className="w-12 text-center font-medium">{formData.bathrooms}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateField('bathrooms', formData.bathrooms + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Property Status</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {propertyStatuses.map((status) => {
                        const Icon = status.icon;
                        return (
                          <Card
                            key={status.id}
                            className={`cursor-pointer transition-all ${
                              formData.status === status.id 
                                ? 'ring-2 ring-primary bg-primary/5' 
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => updateField('status', status.id)}
                          >
                            <CardContent className="p-4 text-center">
                              <Icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                              <div className="font-medium text-sm">{status.label}</div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Customer Selection */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Select Customer</Label>
                    <CustomerSelector
                      onCustomerSelect={handleCustomerSelect}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Additional Services */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  {/* Additional Rooms */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Additional Rooms</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {additionalRooms.map((room) => {
                        const Icon = room.icon;
                        const isSelected = formData.additionalRooms.includes(room.id);
                        return (
                          <Card
                            key={room.id}
                            className={`cursor-pointer transition-all ${
                              isSelected ? 'ring-2 ring-accent bg-accent/5' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => toggleArrayItem('additionalRooms', room.id)}
                          >
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-accent" />
                                <span className="font-medium text-sm">{room.label}</span>
                              </div>
                              <Badge variant="secondary">+£{room.price}</Badge>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Oven Cleaning */}
                  {formData.propertyType !== 'studio' && formData.propertyType !== 'shared_house' && (
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Oven Cleaning</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {ovenTypes.map((oven) => {
                          const Icon = oven.icon;
                          const isSelected = formData.ovenCleaning.includes(oven.id);
                          return (
                            <Card
                              key={oven.id}
                              className={`cursor-pointer transition-all ${
                                isSelected ? 'ring-2 ring-accent bg-accent/5' : 'hover:bg-muted/50'
                              }`}
                              onClick={() => toggleArrayItem('ovenCleaning', oven.id)}
                            >
                              <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4 text-accent" />
                                  <span className="font-medium text-sm">{oven.label}</span>
                                </div>
                                <Badge variant="secondary">+£{oven.price}</Badge>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Blinds Cleaning */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Blinds Cleaning (per window)</Label>
                    <div className="space-y-3">
                      {blindsOptions.map((blind) => {
                        const Icon = blind.icon;
                        const count = getBlindCount(blind.id);
                        return (
                          <Card key={blind.id} className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-accent" />
                                <span className="font-medium text-sm">{blind.label}</span>
                                <Badge variant="secondary">£{blind.price}/window</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateBlindCount(blind.id, Math.max(0, count - 1))}
                                  disabled={count <= 0}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <div className="w-8 text-center text-sm font-medium">{count}</div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateBlindCount(blind.id, count + 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Extra Services */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Extra Services</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {extraServices.map((service) => {
                        const Icon = service.icon;
                        const isSelected = formData.extraServices.includes(service.id);
                        return (
                          <Card
                            key={service.id}
                            className={`cursor-pointer transition-all ${
                              isSelected ? 'ring-2 ring-accent bg-accent/5' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => toggleArrayItem('extraServices', service.id)}
                          >
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-accent" />
                                <span className="font-medium text-sm">{service.label}</span>
                              </div>
                              <Badge variant="secondary">+£{service.price}</Badge>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Carpet Cleaning */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Carpet Cleaning</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {carpetOptions.map((carpet) => {
                        const Icon = carpet.icon;
                        const isSelected = formData.carpetCleaning.includes(carpet.id);
                        return (
                          <Card
                            key={carpet.id}
                            className={`cursor-pointer transition-all ${
                              isSelected ? 'ring-2 ring-accent bg-accent/5' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => toggleArrayItem('carpetCleaning', carpet.id)}
                          >
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-accent" />
                                <span className="font-medium text-sm">{carpet.label}</span>
                              </div>
                              <Badge variant="secondary">+£{carpet.price}</Badge>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Upholstery Cleaning */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Upholstery Cleaning</Label>
                    <div className="space-y-3">
                      {upholsteryOptions.map((upholstery) => {
                        const Icon = upholstery.icon;
                        const count = getUpholsteryCount(upholstery.id);
                        return (
                          <Card key={upholstery.id} className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-accent" />
                                <span className="font-medium text-sm">{upholstery.label}</span>
                                <Badge variant="secondary">£{upholstery.price}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateUpholsteryCount(upholstery.id, Math.max(0, count - 1))}
                                  disabled={count <= 0}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <div className="w-8 text-center text-sm font-medium">{count}</div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateUpholsteryCount(upholstery.id, count + 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mattress Cleaning */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Mattress Cleaning</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {mattressOptions.map((mattress) => {
                        const Icon = mattress.icon;
                        const isSelected = formData.mattressCleaning.includes(mattress.id);
                        return (
                          <Card
                            key={mattress.id}
                            className={`cursor-pointer transition-all ${
                              isSelected ? 'ring-2 ring-accent bg-accent/5' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => toggleArrayItem('mattressCleaning', mattress.id)}
                          >
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-accent" />
                                <span className="font-medium text-sm">{mattress.label}</span>
                              </div>
                              <Badge variant="secondary">+£{mattress.price}</Badge>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Booking Details */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="preferred-date" className="text-base font-semibold mb-3 block flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Preferred Date
                      </Label>
                      <Input
                        id="preferred-date"
                        type="date"
                        value={formData.preferredDate}
                        onChange={(e) => updateField('preferredDate', e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postcode" className="text-base font-semibold mb-3 block">
                        Postcode
                      </Label>
                      <Input
                        id="postcode"
                        value={formData.postcode}
                        onChange={(e) => updateField('postcode', e.target.value)}
                        placeholder="Enter postcode"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-base font-semibold mb-3 block flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Property Address
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="Enter full property address"
                      className="w-full min-h-[80px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-base font-semibold mb-3 block flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Additional Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => updateField('notes', e.target.value)}
                      placeholder="Any special requirements or additional information..."
                      className="w-full min-h-[100px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t bg-card flex justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Back
              </Button>
              
              {currentStep < steps.length ? (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="bg-primary hover:bg-primary-dark text-primary-foreground"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || loading}
                  className="bg-accent hover:bg-accent-turquoise-dark text-accent-foreground"
                >
                  {loading ? 'Creating...' : 'Complete Booking'}
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar Calculator */}
          <div className="w-80 bg-muted/30 border-l flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg mb-2">Booking Summary</h3>
              <div className="text-2xl font-bold text-primary">
                £{totalPrice.toLocaleString()}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {/* Property Details */}
                {formData.propertyType && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Property</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{propertyTypes.find(p => p.id === formData.propertyType)?.label}</span>
                        <span>Base</span>
                      </div>
                      {formData.propertySize && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{propertySizes.find(s => s.id === formData.propertySize)?.label}</span>
                        </div>
                      )}
                      {formData.condition && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Condition: {propertyConditions.find(c => c.id === formData.condition)?.label}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Services */}
                {(formData.additionalRooms.length > 0 || 
                  formData.ovenCleaning.length > 0 || 
                  formData.blindsCleaning.length > 0 || 
                  formData.extraServices.length > 0 || 
                  formData.carpetCleaning.length > 0 || 
                  formData.upholsteryCleaning.length > 0 || 
                  formData.mattressCleaning.length > 0) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Additional Services</h4>
                      <div className="space-y-1">
                        {formData.additionalRooms.map(roomId => {
                          const room = additionalRooms.find(r => r.id === roomId);
                          return room && (
                            <div key={roomId} className="flex justify-between text-sm">
                              <span>{room.label}</span>
                              <span>+£{room.price}</span>
                            </div>
                          );
                        })}
                        
                        {formData.ovenCleaning.map(ovenId => {
                          const oven = ovenTypes.find(o => o.id === ovenId);
                          return oven && (
                            <div key={ovenId} className="flex justify-between text-sm">
                              <span>{oven.label}</span>
                              <span>+£{oven.price}</span>
                            </div>
                          );
                        })}
                        
                        {formData.blindsCleaning.map(blind => {
                          const blindType = blindsOptions.find(b => b.id === blind.type);
                          return blindType && (
                            <div key={blind.type} className="flex justify-between text-sm">
                              <span>{blindType.label} x{blind.count}</span>
                              <span>+£{blindType.price * blind.count}</span>
                            </div>
                          );
                        })}
                        
                        {formData.extraServices.map(serviceId => {
                          const service = extraServices.find(s => s.id === serviceId);
                          return service && (
                            <div key={serviceId} className="flex justify-between text-sm">
                              <span>{service.label}</span>
                              <span>+£{service.price}</span>
                            </div>
                          );
                        })}
                        
                        {formData.carpetCleaning.map(carpetId => {
                          const carpet = carpetOptions.find(c => c.id === carpetId);
                          return carpet && (
                            <div key={carpetId} className="flex justify-between text-sm">
                              <span>{carpet.label}</span>
                              <span>+£{carpet.price}</span>
                            </div>
                          );
                        })}
                        
                        {formData.upholsteryCleaning.map(upholstery => {
                          const upholsteryType = upholsteryOptions.find(u => u.id === upholstery.type);
                          return upholsteryType && (
                            <div key={upholstery.type} className="flex justify-between text-sm">
                              <span>{upholsteryType.label} x{upholstery.count}</span>
                              <span>+£{upholsteryType.price * upholstery.count}</span>
                            </div>
                          );
                        })}
                        
                        {formData.mattressCleaning.map(mattressId => {
                          const mattress = mattressOptions.find(m => m.id === mattressId);
                          return mattress && (
                            <div key={mattressId} className="flex justify-between text-sm">
                              <span>{mattress.label}</span>
                              <span>+£{mattress.price}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Customer Info */}
                {formData.customerName && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Customer</h4>
                      <div className="text-sm font-medium">{formData.customerName}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t bg-card">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">£{totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}