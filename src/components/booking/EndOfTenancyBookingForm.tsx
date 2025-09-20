import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, Home, Bath, Bed, Utensils, Car, BookOpen, Sun, Trees, Trash2, Building, Building2, Users, Sofa, ChefHat, Blinds, Package, Armchair, BedDouble, Calendar, Mail, Phone, MapPin } from 'lucide-react';

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

const bedroomOptions = [
  { id: 'studio', label: 'Studio' },
  { id: '1_bedroom', label: '1 Bedroom' },
  { id: '2_bedroom', label: '2 Bedrooms' },
  { id: '3_bedroom', label: '3 Bedrooms' },
  { id: '4_bedroom', label: '4 Bedrooms' },
  { id: '5_bedroom', label: '5+ Bedrooms' }
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

export function EndOfTenancyBookingForm({ children, onSubmit }: EndOfTenancyBookingFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    // Customer info
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    postcode: '',
    
    // Property details
    property_type: 'apartment',
    property_condition: 'well_maintained',
    property_status: 'furnished',
    bedrooms: '1_bedroom',
    bathrooms: 1,
    separate_wc: 0,
    oven_type: 'single',
    
    // Additional features
    additional_features: [],
    
    // Services
    blinds_cleaning: [],
    extra_services: [],
    carpet_cleaning: [],
    upholstery_cleaning: [],
    mattress_cleaning: [],
    
    // Booking details
    preferred_date: '',
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

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit({
        ...formData,
        service_type: 'End of Tenancy'
      });
    }
    setOpen(false);
  };

  // Logic for bathroom constraints based on property type and bedrooms
  const getMaxBathrooms = () => {
    if (formData.property_type === 'apartment' && formData.bedrooms === 'studio') {
      return 1;
    }
    return 10; // No real limit for other types
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            End of Tenancy Cleaning Booking
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="customer" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="customer">Customer</TabsTrigger>
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>
          
          {/* Customer Information */}
          <TabsContent value="customer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => updateBasicField('first_name', e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => updateBasicField('last_name', e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateBasicField('email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateBasicField('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Property Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateBasicField('address', e.target.value)}
                    placeholder="Enter full property address"
                  />
                </div>
                
                <div>
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    value={formData.postcode}
                    onChange={(e) => updateBasicField('postcode', e.target.value)}
                    placeholder="Enter postcode"
                    className="w-32"
                  />
                </div>
                
                <div>
                  <Label htmlFor="preferred_date">Preferred Date</Label>
                  <Input
                    id="preferred_date"
                    type="date"
                    value={formData.preferred_date}
                    onChange={(e) => updateBasicField('preferred_date', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Property Details */}
          <TabsContent value="property" className="space-y-4">
            {/* Property Type */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-primary">Property Type</h3>
                <div className="grid grid-cols-3 gap-3">
                  {propertyTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.id}
                        variant={formData.property_type === type.id ? "default" : "outline"}
                        className="h-12 justify-start gap-2"
                        onClick={() => updateBasicField('property_type', type.id)}
                      >
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Bedrooms - only show for apartments */}
            {formData.property_type === 'apartment' && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-primary">Number of Bedrooms</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {bedroomOptions.map(option => (
                      <Button
                        key={option.id}
                        variant={formData.bedrooms === option.id ? "default" : "outline"}
                        className="h-10"
                        onClick={() => updateBasicField('bedrooms', option.id)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Property Condition */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-primary">Property Condition</h3>
                <div className="grid grid-cols-2 gap-3">
                  {propertyConditions.map(condition => (
                    <Button
                      key={condition.id}
                      variant={formData.property_condition === condition.id ? "default" : "outline"}
                      className="h-10 text-xs"
                      onClick={() => updateBasicField('property_condition', condition.id)}
                    >
                      {condition.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Property Status */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-primary">Property Status</h3>
                <div className="grid grid-cols-3 gap-3">
                  {propertyStatuses.map(status => (
                    <Button
                      key={status.id}
                      variant={formData.property_status === status.id ? "default" : "outline"}
                      className="h-10"
                      onClick={() => updateBasicField('property_status', status.id)}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Oven Type */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-primary">Oven Size</h3>
                <div className="grid grid-cols-2 gap-3">
                  {ovenTypes.map(oven => (
                    <Button
                      key={oven.id}
                      variant={formData.oven_type === oven.id ? "default" : "outline"}
                      className="h-10 text-xs"
                      onClick={() => updateBasicField('oven_type', oven.id)}
                    >
                      {oven.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rooms */}
          <TabsContent value="rooms" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-primary">Room Configuration</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Bathrooms */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bath className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">Bathrooms</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCount('bathrooms', false)}
                        disabled={formData.bathrooms <= 1}
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Badge variant="secondary" className="min-w-[2rem] justify-center">
                        {formData.bathrooms}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCount('bathrooms', true)}
                        disabled={formData.bathrooms >= getMaxBathrooms()}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Separate WC */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">Separate WC</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCount('separate_wc', false)}
                        disabled={formData.separate_wc <= 0}
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Badge variant="secondary" className="min-w-[2rem] justify-center">
                        {formData.separate_wc}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCount('separate_wc', true)}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features */}
          <TabsContent value="features" className="space-y-4">
            {/* Additional Features */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-primary">Additional Features</h3>
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
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-primary">Blinds Cleaning</h3>
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
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-primary">Extra Services</h3>
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

          {/* Services */}
          <TabsContent value="services" className="space-y-4">
            {/* Carpet Cleaning */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-primary">Carpet Cleaning</h3>
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

            {/* Upholstery Cleaning */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-primary">Upholstery Cleaning</h3>
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

            {/* Mattress Cleaning */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-primary">Mattress Cleaning</h3>
                <div className="grid grid-cols-2 gap-3">
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

            {/* Additional Notes */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-primary">Additional Notes</h3>
                <Textarea
                  value={formData.additional_notes}
                  onChange={(e) => updateBasicField('additional_notes', e.target.value)}
                  placeholder="Any additional requirements or information..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary text-primary-foreground">
            Submit Booking Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}