import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Home, Bath, Bed, Utensils, Car, BookOpen, Sun, Trees, Trash2, Building, Building2, Users, Sofa, ChefHat, Blinds, Package, Armchair, Shirt, BedDouble } from 'lucide-react';

interface ModernPropertyConfigDialogProps {
  propertyConfig: any;
  language: 'english' | 'bulgarian';
  onSave: (config: any) => void;
  children: React.ReactNode;
}

const propertyTypes = [
  { id: 'flat', icon: Building, label: { en: 'Flat', bg: 'Апартамент' } },
  { id: 'house', icon: Home, label: { en: 'House', bg: 'Къща' } },
  { id: 'studio', icon: Building2, label: { en: 'Studio', bg: 'Студио' } },
  { id: 'house_share', icon: Users, label: { en: 'House Share', bg: 'Споделена къща' } }
];

const propertyConditions = [
  { id: 'well_maintained', label: { en: 'Well-Maintained', bg: 'Добре поддържан' } },
  { id: 'moderate', label: { en: 'Moderate Condition', bg: 'Средно състояние' } },
  { id: 'heavily_used', label: { en: 'Heavily Used', bg: 'Интензивно използван' } },
  { id: 'intensive_required', label: { en: 'Intensive Cleaning Required', bg: 'Изисква интензивно почистване' } }
];

const propertyStatuses = [
  { id: 'furnished', label: { en: 'Furnished', bg: 'Обзаведен' } },
  { id: 'unfurnished', label: { en: 'Unfurnished', bg: 'Необзаведен' } },
  { id: 'part_furnished', label: { en: 'Part Furnished', bg: 'Частично обзаведен' } }
];

const ovenTypes = [
  { id: 'no_oven', label: { en: 'No Oven Cleaning Required', bg: 'Без почистване на фурна' } },
  { id: 'single', label: { en: 'Single Oven', bg: 'Единична фурна' } },
  { id: 'single_convection', label: { en: 'Single & Convection Oven', bg: 'Единична и конвекционна фурна' } },
  { id: 'double', label: { en: 'Double Oven', bg: 'Двойна фурна' } },
  { id: 'range', label: { en: 'Range Oven', bg: 'Голяма фурна' } },
  { id: 'aga', label: { en: 'AGA Oven', bg: 'AGA фурна' } }
];

const additionalFeatures = [
  { id: 'utility_room', icon: Car, label: { en: 'Utility Room', bg: 'Перално помещение' } },
  { id: 'dining_room', icon: Utensils, label: { en: 'Dining Room', bg: 'Трапезария' } },
  { id: 'conservatory', icon: Sun, label: { en: 'Conservatory', bg: 'Зимна градина' } },
  { id: 'study_room', icon: BookOpen, label: { en: 'Study Room', bg: 'Кабинет' } },
  { id: 'separate_kitchen_living', icon: Home, label: { en: 'Separate Kitchen/Living Room', bg: 'Отделна кухня/дневна' } },
  { id: 'other_room', icon: Building, label: { en: 'Any Other Additional Room', bg: 'Друго допълнително помещение' } }
];

const blindsOptions = [
  { id: 'small', label: { en: 'Small Blinds/Shutters', bg: 'Малки щори/капаци' }, size: '60cm x 120cm', price: 6 },
  { id: 'medium', label: { en: 'Medium Blinds/Shutters', bg: 'Средни щори/капаци' }, size: '100cm x 160cm', price: 9 },
  { id: 'large', label: { en: 'Large Blinds/Shutters', bg: 'Големи щори/капаци' }, size: '140cm x 220cm', price: 12 }
];

const extraServices = [
  { id: 'balcony', icon: Trees, label: { en: 'Balcony Cleaning', bg: 'Почистване на балкон' }, price: 30 },
  { id: 'waste_removal', icon: Trash2, label: { en: 'Household Waste Removal', bg: 'Извозване на битови отпадъци' }, price: 40 },
  { id: 'garage', icon: Car, label: { en: 'Garage Cleaning', bg: 'Почистване на гараж' }, price: 50 }
];

const carpetRooms = [
  { id: 'bedroom', icon: Bed, label: { en: 'Bedroom', bg: 'Спалня' }, price: 30 },
  { id: 'living_room', icon: Sofa, label: { en: 'Living Room', bg: 'Дневна' }, price: 40 },
  { id: 'dining_room', icon: Utensils, label: { en: 'Dining Room', bg: 'Трапезария' }, price: 40 },
  { id: 'hallway', icon: Home, label: { en: 'Hallway', bg: 'Коридор' }, price: 15 },
  { id: 'staircase', icon: Building, label: { en: 'Staircase', bg: 'Стълбище' }, price: 30 },
  { id: 'landing', icon: Home, label: { en: 'Landing', bg: 'Площадка' }, price: 10 }
];

const upholsteryOptions = [
  { id: 'two_seater', icon: Sofa, label: { en: 'Two Seater Sofa', bg: 'Двуместен диван' }, price: 30 },
  { id: 'three_seater', icon: Sofa, label: { en: 'Three Seater Sofa', bg: 'Триместен диван' }, price: 45 },
  { id: 'four_seater', icon: Sofa, label: { en: 'Four Seater or Corner Sofa', bg: 'Четириместен или ъглов диван' }, price: 70 },
  { id: 'armchair', icon: Armchair, label: { en: 'Armchair', bg: 'Фотьойл' }, price: 20 },
  { id: 'dining_chair', icon: Utensils, label: { en: 'Dining Chair', bg: 'Стол за хранене' }, price: 8 },
  { id: 'cushions', icon: Package, label: { en: 'Cushions', bg: 'Възглавници' }, price: 5 },
  { id: 'curtains', icon: Blinds, label: { en: 'Curtains Pair', bg: 'Чифт завеси' }, price: 20 }
];

const mattressOptions = [
  { id: 'single', icon: Bed, label: { en: 'Single Mattress', bg: 'Единичен матрак' }, price: 25 },
  { id: 'double', icon: BedDouble, label: { en: 'Double Mattress', bg: 'Двоен матрак' }, price: 35 },
  { id: 'king', icon: BedDouble, label: { en: 'King Size Mattress', bg: 'Голям матрак' }, price: 40 }
];

export function ModernPropertyConfigDialog({ 
  propertyConfig, 
  language, 
  onSave, 
  children 
}: ModernPropertyConfigDialogProps) {
  const [config, setConfig] = useState({
    // Basic property info
    property_type: propertyConfig?.property_type || 'flat',
    property_condition: propertyConfig?.property_condition || 'well_maintained',
    property_status: propertyConfig?.property_status || 'furnished',
    oven_type: propertyConfig?.oven_type || 'single',
    
    // Room counts
    bedrooms: propertyConfig?.bedrooms || 1,
    bathrooms: propertyConfig?.bathrooms || 1,
    living_rooms: propertyConfig?.living_rooms || 1,
    wc: propertyConfig?.wc || 0,
    ensuite: propertyConfig?.ensuite || 0,
    
    // Additional features
    additional_features: propertyConfig?.additional_features || [],
    
    // Services
    blinds_cleaning: propertyConfig?.blinds_cleaning || [],
    extra_services: propertyConfig?.extra_services || [],
    carpet_cleaning: propertyConfig?.carpet_cleaning || [],
    upholstery_cleaning: propertyConfig?.upholstery_cleaning || [],
    mattress_cleaning: propertyConfig?.mattress_cleaning || []
  });
  
  const [open, setOpen] = useState(false);
  const langKey = language === 'english' ? 'en' : 'bg';

  const handleSave = () => {
    onSave(config);
    setOpen(false);
  };

  const updateBasicField = (field: string, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateCount = (field: string, increment: boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + (increment ? 1 : -1))
    }));
  };

  const toggleArrayItem = (arrayName: string, item: any) => {
    setConfig(prev => {
      const currentArray = prev[arrayName] || [];
      const existingIndex = currentArray.findIndex(existing => existing.id === item.id);
      
      if (existingIndex >= 0) {
        // Item exists, increment quantity or remove if qty would be 0
        const existingItem = currentArray[existingIndex];
        const newQty = (existingItem.quantity || 1) + 1;
        
        return {
          ...prev,
          [arrayName]: currentArray.map((existing, index) =>
            index === existingIndex ? { ...existing, quantity: newQty } : existing
          )
        };
      } else {
        // Item doesn't exist, add with qty 1
        return {
          ...prev,
          [arrayName]: [...currentArray, { ...item, quantity: 1 }]
        };
      }
    });
  };

  const decrementArrayItem = (arrayName: string, itemId: string) => {
    setConfig(prev => {
      const currentArray = prev[arrayName] || [];
      const existingIndex = currentArray.findIndex(item => item.id === itemId);
      
      if (existingIndex >= 0) {
        const existingItem = currentArray[existingIndex];
        const newQty = (existingItem.quantity || 1) - 1;
        
        if (newQty <= 0) {
          // Remove item if quantity becomes 0
          return {
            ...prev,
            [arrayName]: currentArray.filter((_, index) => index !== existingIndex)
          };
        } else {
          // Update quantity
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
    const currentArray = config[arrayName] || [];
    const item = currentArray.find(item => item.id === itemId);
    return item ? item.quantity || 0 : 0;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            {language === 'english' ? 'Property Configuration' : 'Конфигурация на имота'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">
              {language === 'english' ? 'Basic Info' : 'Основна информация'}
            </TabsTrigger>
            <TabsTrigger value="rooms">
              {language === 'english' ? 'Rooms' : 'Стаи'}
            </TabsTrigger>
            <TabsTrigger value="features">
              {language === 'english' ? 'Features' : 'Характеристики'}
            </TabsTrigger>
            <TabsTrigger value="services">
              {language === 'english' ? 'Services' : 'Услуги'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            {/* Property Type */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-primary">
                  {language === 'english' ? 'Property Type' : 'Тип имот'}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {propertyTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.id}
                        variant={config.property_type === type.id ? "default" : "outline"}
                        className="h-12 justify-start gap-2"
                        onClick={() => updateBasicField('property_type', type.id)}
                      >
                        <Icon className="w-4 h-4" />
                        {type.label[langKey]}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Property Condition */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-primary">
                  {language === 'english' ? 'Property Condition' : 'Състояние на имота'}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {propertyConditions.map(condition => (
                    <Button
                      key={condition.id}
                      variant={config.property_condition === condition.id ? "default" : "outline"}
                      className="h-10 text-xs"
                      onClick={() => updateBasicField('property_condition', condition.id)}
                    >
                      {condition.label[langKey]}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Property Status */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-primary">
                  {language === 'english' ? 'Property Status' : 'Статус на имота'}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {propertyStatuses.map(status => (
                    <Button
                      key={status.id}
                      variant={config.property_status === status.id ? "default" : "outline"}
                      className="h-10"
                      onClick={() => updateBasicField('property_status', status.id)}
                    >
                      {status.label[langKey]}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Oven Type */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-primary">
                  {language === 'english' ? 'Oven Size' : 'Размер на фурната'}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {ovenTypes.map(oven => (
                    <Button
                      key={oven.id}
                      variant={config.oven_type === oven.id ? "default" : "outline"}
                      className="h-10 text-xs"
                      onClick={() => updateBasicField('oven_type', oven.id)}
                    >
                      {oven.label[langKey]}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4">
            {/* Main Rooms */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-primary">
                  {language === 'english' ? 'Main Rooms' : 'Основни стаи'}
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Bedrooms */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bed className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">
                        {language === 'english' ? 'Bedrooms' : 'Спални'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCount('bedrooms', false)}
                        disabled={config.bedrooms <= 0}
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Badge variant="secondary" className="min-w-[2rem] justify-center">
                        {config.bedrooms}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCount('bedrooms', true)}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Bathrooms */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bath className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">
                        {language === 'english' ? 'Bathrooms' : 'Бани'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCount('bathrooms', false)}
                        disabled={config.bathrooms <= 0}
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Badge variant="secondary" className="min-w-[2rem] justify-center">
                        {config.bathrooms}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCount('bathrooms', true)}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Living Rooms */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">
                        {language === 'english' ? 'Living Rooms' : 'Дневни'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCount('living_rooms', false)}
                        disabled={config.living_rooms <= 0}
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Badge variant="secondary" className="min-w-[2rem] justify-center">
                        {config.living_rooms}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCount('living_rooms', true)}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* WCs */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bath className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">
                        {language === 'english' ? 'WC/Powder Rooms' : 'Тоалетни'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCount('wc', false)}
                        disabled={config.wc <= 0}
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Badge variant="secondary" className="min-w-[2rem] justify-center">
                        {config.wc}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCount('wc', true)}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* En-suites */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bath className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">
                        {language === 'english' ? 'En-suite Bathrooms' : 'Самостоятелни бани'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCount('ensuite', false)}
                        disabled={config.ensuite <= 0}
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Badge variant="secondary" className="min-w-[2rem] justify-center">
                        {config.ensuite}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCount('ensuite', true)}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Kitchen - Always 1 */}
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 col-span-2">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm text-muted-foreground">
                        {language === 'english' ? 'Kitchen (Always included)' : 'Кухня (Винаги включена)'}
                      </span>
                    </div>
                    <Badge variant="outline">1</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            {/* Additional Features */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-primary">
                  {language === 'english' ? 'Additional Features' : 'Допълнителни характеристики'}
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {additionalFeatures.map((feature) => {
                    const Icon = feature.icon;
                    const isSelected = config.additional_features.includes(feature.id);
                    
                    return (
                      <Button
                        key={feature.id}
                        variant={isSelected ? "default" : "outline"}
                        className="h-12 justify-start gap-2"
                        onClick={() => {
                          const newFeatures = isSelected
                            ? config.additional_features.filter(f => f !== feature.id)
                            : [...config.additional_features, feature.id];
                          updateBasicField('additional_features', newFeatures);
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        {feature.label[langKey]}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            {/* Blinds Cleaning */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-primary">
                  {language === 'english' ? 'Blinds/Shutters Cleaning' : 'Почистване на щори/капаци'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {blindsOptions.map((blind) => {
                    const quantity = getItemQuantity('blinds_cleaning', blind.id);
                    
                    return (
                      <div key={blind.id} className="border rounded-lg p-4 space-y-3">
                        <div className="text-center">
                          <Blinds className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <h4 className="font-medium text-sm">{blind.label[langKey]}</h4>
                          <p className="text-xs text-muted-foreground">{blind.size}</p>
                          <Badge variant="secondary" className="mt-1">£{blind.price}</Badge>
                        </div>
                        
                        <div className="flex items-center justify-center gap-2">
                          {quantity > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => decrementArrayItem('blinds_cleaning', blind.id)}
                              className="h-7 w-7 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                          )}
                          <Badge variant="secondary" className="min-w-[2rem] justify-center">
                            {quantity}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleArrayItem('blinds_cleaning', blind)}
                            className="h-7 w-7 p-0"
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

            {/* Extra Services */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-primary">
                  {language === 'english' ? 'Extra Services' : 'Допълнителни услуги'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {extraServices.map((service) => {
                    const Icon = service.icon;
                    const quantity = getItemQuantity('extra_services', service.id);
                    
                    return (
                      <div key={service.id} className="border rounded-lg p-4 space-y-3">
                        <div className="text-center">
                          <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <h4 className="font-medium text-sm">{service.label[langKey]}</h4>
                          <Badge variant="secondary" className="mt-1">£{service.price}</Badge>
                        </div>
                        
                        <div className="flex items-center justify-center gap-2">
                          {quantity > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => decrementArrayItem('extra_services', service.id)}
                              className="h-7 w-7 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                          )}
                          <Badge variant="secondary" className="min-w-[2rem] justify-center">
                            {quantity}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleArrayItem('extra_services', service)}
                            className="h-7 w-7 p-0"
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

            {/* Carpet Cleaning */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-primary">
                  {language === 'english' ? 'Carpet Cleaning' : 'Почистване на килими'}
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {carpetRooms.map((room) => {
                    const Icon = room.icon;
                    const quantity = getItemQuantity('carpet_cleaning', room.id);
                    
                    return (
                      <div key={room.id} className="border rounded-lg p-4 space-y-3">
                        <div className="text-center">
                          <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <h4 className="font-medium text-sm">{room.label[langKey]}</h4>
                          <Badge variant="secondary" className="mt-1">£{room.price}</Badge>
                        </div>
                        
                        <div className="flex items-center justify-center gap-2">
                          {quantity > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => decrementArrayItem('carpet_cleaning', room.id)}
                              className="h-7 w-7 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                          )}
                          <Badge variant="secondary" className="min-w-[2rem] justify-center">
                            {quantity}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleArrayItem('carpet_cleaning', room)}
                            className="h-7 w-7 p-0"
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

            {/* Upholstery Cleaning */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-primary">
                  {language === 'english' ? 'Upholstery Cleaning' : 'Почистване на тапицерия'}
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {upholsteryOptions.map((item) => {
                    const Icon = item.icon;
                    const quantity = getItemQuantity('upholstery_cleaning', item.id);
                    
                    return (
                      <div key={item.id} className="border rounded-lg p-4 space-y-3">
                        <div className="text-center">
                          <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <h4 className="font-medium text-xs">{item.label[langKey]}</h4>
                          <Badge variant="secondary" className="mt-1">£{item.price}</Badge>
                        </div>
                        
                        <div className="flex items-center justify-center gap-2">
                          {quantity > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => decrementArrayItem('upholstery_cleaning', item.id)}
                              className="h-7 w-7 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                          )}
                          <Badge variant="secondary" className="min-w-[2rem] justify-center">
                            {quantity}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleArrayItem('upholstery_cleaning', item)}
                            className="h-7 w-7 p-0"
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

            {/* Mattress Cleaning */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-primary">
                  {language === 'english' ? 'Mattress Cleaning' : 'Почистване на матраци'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mattressOptions.map((mattress) => {
                    const Icon = mattress.icon;
                    const quantity = getItemQuantity('mattress_cleaning', mattress.id);
                    
                    return (
                      <div key={mattress.id} className="border rounded-lg p-4 space-y-3">
                        <div className="text-center">
                          <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <h4 className="font-medium text-sm">{mattress.label[langKey]}</h4>
                          <Badge variant="secondary" className="mt-1">£{mattress.price}</Badge>
                        </div>
                        
                        <div className="flex items-center justify-center gap-2">
                          {quantity > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => decrementArrayItem('mattress_cleaning', mattress.id)}
                              className="h-7 w-7 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                          )}
                          <Badge variant="secondary" className="min-w-[2rem] justify-center">
                            {quantity}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleArrayItem('mattress_cleaning', mattress)}
                            className="h-7 w-7 p-0"
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
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {language === 'english' ? 'Cancel' : 'Отказ'}
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            {language === 'english' ? 'Save Configuration' : 'Запази конфигурацията'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}