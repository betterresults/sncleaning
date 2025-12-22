import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { EndOfTenancyBookingData } from '../EndOfTenancyBookingForm';
import { Home, Building, Plus, Minus, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAirbnbFieldConfigsBatch } from '@/hooks/useAirbnbFieldConfigs';
import { useToast } from '@/hooks/use-toast';
import { CarpetCleaningItem } from '../CarpetCleaningForm';

interface EndOfTenancyPropertyStepProps {
  data: EndOfTenancyBookingData;
  onUpdate: (updates: Partial<EndOfTenancyBookingData>) => void;
  onNext: () => void;
  isAdminMode?: boolean;
}

// Carpet item pricing (reusing from CarpetCleaningItemsStep)
const CARPET_PRICES = {
  small: 35,
  medium: 45,
  large: 55,
};

const UPHOLSTERY_ITEMS = [
  { id: 'sofa-2-seater', name: '2-Seater Sofa', price: 50 },
  { id: 'sofa-3-seater', name: '3-Seater Sofa', price: 65 },
  { id: 'sofa-4-seater', name: '4-Seater Sofa', price: 80 },
  { id: 'armchair', name: 'Armchair', price: 35 },
  { id: 'dining-chair', name: 'Dining Chair', price: 15 },
  { id: 'ottoman', name: 'Ottoman/Footstool', price: 25 },
  { id: 'cushion', name: 'Cushion', price: 10 },
];

const MATTRESS_ITEMS = [
  { id: 'single', name: 'Single Mattress', price: 40, bothSidesPrice: 60 },
  { id: 'double', name: 'Double Mattress', price: 50, bothSidesPrice: 75 },
  { id: 'king', name: 'King Mattress', price: 60, bothSidesPrice: 90 },
  { id: 'super-king', name: 'Super King Mattress', price: 70, bothSidesPrice: 105 },
];

export const EndOfTenancyPropertyStep: React.FC<EndOfTenancyPropertyStepProps> = ({
  data,
  onUpdate,
  onNext,
  isAdminMode = false
}) => {
  const { toast } = useToast();
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  
  // Fetch configurations
  const {
    data: allConfigs,
    isLoading: isLoadingConfigs
  } = useAirbnbFieldConfigsBatch(['Property Type', 'Bedrooms', 'Bathrooms', 'Oven Cleaning'], true);
  
  const propertyTypeConfigs = allConfigs?.['Property Type'] || [];
  const ovenCleaningConfigs = allConfigs?.['Oven Cleaning'] || [];
  
  const getBedroomLabel = (value: string) => {
    if (value === 'studio') return 'Studio';
    if (value === '6+') return '6+ Bedrooms';
    return `${value} Bedroom${parseInt(value) > 1 ? 's' : ''}`;
  };
  
  const incrementBedrooms = () => {
    const current = data.bedrooms;
    if (!current) {
      onUpdate({ bedrooms: 'studio' });
    } else if (current === 'studio') {
      onUpdate({ bedrooms: '1' });
    } else if (current === '6+') {
      return;
    } else {
      const num = parseInt(current);
      onUpdate({ bedrooms: num >= 5 ? '6+' : (num + 1).toString() });
    }
  };
  
  const decrementBedrooms = () => {
    const current = data.bedrooms;
    if (!current || current === '1') {
      onUpdate({ bedrooms: 'studio' });
    } else if (current === 'studio') {
      return;
    } else if (current === '6+') {
      onUpdate({ bedrooms: '5' });
    } else {
      const num = parseInt(current);
      onUpdate({ bedrooms: num > 1 ? (num - 1).toString() : 'studio' });
    }
  };
  
  const incrementBathrooms = () => {
    const current = parseInt(data.bathrooms || '0');
    if (current >= 6) return;
    onUpdate({ bathrooms: current >= 5 ? '6+' : (current + 1).toString() });
  };
  
  const decrementBathrooms = () => {
    const current = data.bathrooms;
    if (!current || current === '1') return;
    if (current === '6+') {
      onUpdate({ bathrooms: '5' });
    } else {
      const num = parseInt(current);
      onUpdate({ bathrooms: num > 1 ? (num - 1).toString() : '1' });
    }
  };
  
  // Steam cleaning add-ons handlers
  const addCarpetItem = (size: 'small' | 'medium' | 'large') => {
    const newItem: CarpetCleaningItem = {
      id: `carpet-${size}-${Date.now()}`,
      name: `${size.charAt(0).toUpperCase() + size.slice(1)} Carpet/Rug`,
      type: 'carpet',
      size,
      quantity: 1,
      price: CARPET_PRICES[size],
    };
    onUpdate({
      carpetItems: [...data.carpetItems, newItem],
      wantsSteamCleaning: true,
    });
  };
  
  const removeCarpetItem = (id: string) => {
    const updatedItems = data.carpetItems.filter(item => item.id !== id);
    onUpdate({
      carpetItems: updatedItems,
      wantsSteamCleaning: updatedItems.length > 0 || data.upholsteryItems.length > 0 || data.mattressItems.length > 0,
    });
  };
  
  const addUpholsteryItem = (item: typeof UPHOLSTERY_ITEMS[0]) => {
    const existingItem = data.upholsteryItems.find(u => u.name === item.name);
    if (existingItem) {
      onUpdate({
        upholsteryItems: data.upholsteryItems.map(u => 
          u.id === existingItem.id ? { ...u, quantity: u.quantity + 1 } : u
        ),
      });
    } else {
      const newItem: CarpetCleaningItem = {
        id: `upholstery-${item.id}-${Date.now()}`,
        name: item.name,
        type: 'upholstery',
        quantity: 1,
        price: item.price,
      };
      onUpdate({
        upholsteryItems: [...data.upholsteryItems, newItem],
        wantsSteamCleaning: true,
      });
    }
  };
  
  const removeUpholsteryItem = (id: string) => {
    const updatedItems = data.upholsteryItems.filter(item => item.id !== id);
    onUpdate({
      upholsteryItems: updatedItems,
      wantsSteamCleaning: data.carpetItems.length > 0 || updatedItems.length > 0 || data.mattressItems.length > 0,
    });
  };
  
  const addMattressItem = (item: typeof MATTRESS_ITEMS[0], bothSides: boolean) => {
    const newItem: CarpetCleaningItem = {
      id: `mattress-${item.id}-${bothSides ? 'both' : 'one'}-${Date.now()}`,
      name: item.name + (bothSides ? ' (Both Sides)' : ' (One Side)'),
      type: 'mattress',
      quantity: 1,
      price: bothSides ? item.bothSidesPrice : item.price,
      bothSides,
    };
    onUpdate({
      mattressItems: [...data.mattressItems, newItem],
      wantsSteamCleaning: true,
    });
  };
  
  const removeMattressItem = (id: string) => {
    const updatedItems = data.mattressItems.filter(item => item.id !== id);
    onUpdate({
      mattressItems: updatedItems,
      wantsSteamCleaning: data.carpetItems.length > 0 || data.upholsteryItems.length > 0 || updatedItems.length > 0,
    });
  };
  
  // Calculate steam cleaning total
  const steamCleaningTotal = 
    data.carpetItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) +
    data.upholsteryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) +
    data.mattressItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Validation
  const validationErrors = {
    propertyType: !data.propertyType,
    bedrooms: !data.bedrooms,
    bathrooms: !data.bathrooms,
  };
  
  const canContinue = !validationErrors.propertyType && !validationErrors.bedrooms && !validationErrors.bathrooms;
  
  const handleContinue = () => {
    if (!canContinue) {
      setShowValidationErrors(true);
      
      const missingFields: string[] = [];
      if (validationErrors.propertyType) missingFields.push('property type');
      if (validationErrors.bedrooms) missingFields.push('bedrooms');
      if (validationErrors.bathrooms) missingFields.push('bathrooms');
      
      toast({
        title: "Please complete all required fields",
        description: `Missing: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    onNext();
  };
  
  return (
    <div className="space-y-6">
      {isLoadingConfigs && (
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-muted rounded-2xl"></div>
              <div className="h-16 bg-muted rounded-2xl"></div>
            </div>
          </div>
        </div>
      )}

      {/* Property Type */}
      <div className="relative z-10" id="property-type-section">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold text-slate-700">Property Details</h2>
          {showValidationErrors && validationErrors.propertyType && (
            <span className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Required
            </span>
          )}
        </div>
        <div className={`grid grid-cols-2 gap-4 ${showValidationErrors && validationErrors.propertyType ? 'ring-2 ring-destructive ring-offset-2 rounded-2xl' : ''}`}>
          {(propertyTypeConfigs.length > 0 ? propertyTypeConfigs : [
            { option: 'flat', label: 'Flat' },
            { option: 'house', label: 'House' }
          ]).map((opt: any) => {
            const isSelected = data.propertyType === opt.option;
            const isHouse = opt.option === 'house';
            return (
              <button
                key={opt.option}
                className={`group relative h-16 rounded-2xl border transition-all duration-300 justify-start gap-3 p-4 flex items-center ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                }`}
                onClick={() => onUpdate({ propertyType: isSelected ? '' : opt.option })}
              >
                {isHouse ? (
                  <Home className={`h-6 w-6 transition-all duration-500 ${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                ) : (
                  <Building className={`h-6 w-6 transition-all duration-500 ${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                )}
                <span className={`text-base font-bold transition-colors ${isSelected ? 'text-primary' : 'text-slate-500 group-hover:text-primary'}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Property Size */}
      <div className="relative z-[9]" id="property-size-section">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold text-slate-700">Size of the property</h2>
          {showValidationErrors && (validationErrors.bedrooms || validationErrors.bathrooms) && (
            <span className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {validationErrors.bedrooms && validationErrors.bathrooms ? 'Select bedrooms and bathrooms' : validationErrors.bedrooms ? 'Select bedrooms' : 'Select bathrooms'}
            </span>
          )}
        </div>
        
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-2 ${showValidationErrors && (validationErrors.bedrooms || validationErrors.bathrooms) ? 'ring-2 ring-destructive ring-offset-2 rounded-2xl p-2' : ''}`}>
          {/* Bedrooms */}
          <div>
            <div className="flex items-center justify-center">
              <div className={`flex items-center rounded-2xl p-2 w-full transition-all duration-300 ${
                data.bedrooms ? 'bg-primary/5 border border-primary' : showValidationErrors && validationErrors.bedrooms ? 'bg-destructive/5 border border-destructive' : 'bg-card border border-border'
              }`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-12 w-12 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary"
                  onClick={decrementBedrooms}
                  disabled={!data.bedrooms || data.bedrooms === 'studio'}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <div className="flex-1 text-center">
                  <div className={`text-base font-bold transition-colors ${data.bedrooms ? 'text-primary' : 'text-slate-400'}`}>
                    {data.bedrooms ? getBedroomLabel(data.bedrooms) : 'Bedrooms'}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-12 w-12 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary"
                  onClick={incrementBedrooms}
                  disabled={data.bedrooms === '6+'}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bathrooms */}
          <div>
            <div className="flex items-center justify-center">
              <div className={`flex items-center rounded-2xl p-2 w-full transition-all duration-300 ${
                data.bathrooms ? 'bg-primary/5 border border-primary' : showValidationErrors && validationErrors.bathrooms ? 'bg-destructive/5 border border-destructive' : 'bg-card border border-border'
              }`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-12 w-12 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary"
                  onClick={decrementBathrooms}
                  disabled={!data.bathrooms || data.bathrooms === '1'}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <div className="flex-1 text-center">
                  <div className={`text-base font-bold transition-colors ${data.bathrooms ? 'text-primary' : 'text-slate-400'}`}>
                    {data.bathrooms ? `${data.bathrooms} Bathroom${data.bathrooms !== '1' && data.bathrooms !== '6+' && parseInt(data.bathrooms) > 1 ? 's' : data.bathrooms === '6+' ? 's' : ''}` : 'Bathrooms'}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-12 w-12 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary"
                  onClick={incrementBathrooms}
                  disabled={data.bathrooms === '6+'}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Oven Cleaning */}
      <div>
        <h2 className="text-2xl font-bold text-slate-700 mb-4">Add Oven Cleaning?</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            className={`group relative h-20 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center ${
              !data.hasOvenCleaning ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
            }`}
            onClick={() => onUpdate({ hasOvenCleaning: false, ovenType: '' })}
          >
            {!data.hasOvenCleaning && <CheckCircle className="h-5 w-5 text-primary mb-1" />}
            <span className={`text-base font-bold transition-colors ${!data.hasOvenCleaning ? 'text-primary' : 'text-slate-500 group-hover:text-primary'}`}>
              No Oven
            </span>
          </button>
          {(ovenCleaningConfigs.length > 0 ? ovenCleaningConfigs : [
            { option: 'single', label: 'Single Oven', value: 45 },
            { option: 'double', label: 'Double Oven', value: 65 },
            { option: 'range', label: 'Range Cooker', value: 85 },
          ]).map((opt: any) => {
            const isSelected = data.hasOvenCleaning && data.ovenType === opt.option;
            return (
              <button
                key={opt.option}
                className={`group relative h-20 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                }`}
                onClick={() => onUpdate({ hasOvenCleaning: true, ovenType: opt.option })}
              >
                {isSelected && <CheckCircle className="h-5 w-5 text-primary mb-1" />}
                <span className={`text-base font-bold transition-colors ${isSelected ? 'text-primary' : 'text-slate-500 group-hover:text-primary'}`}>
                  {opt.label}
                </span>
                <span className="text-xs text-muted-foreground">+£{opt.value}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Steam Cleaning Add-ons */}
      <div className="border-t border-border pt-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-slate-700">Add Steam Cleaning?</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          Need professional carpet, upholstery, or mattress cleaning? Add these services to your end of tenancy clean.
        </p>

        {/* Carpet Cleaning */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Carpets & Rugs</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <button
              className="h-20 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center"
              onClick={() => addCarpetItem('small')}
            >
              <Plus className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-sm font-medium text-slate-600">Small</span>
              <span className="text-xs text-muted-foreground">£{CARPET_PRICES.small}</span>
            </button>
            <button
              className="h-20 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center"
              onClick={() => addCarpetItem('medium')}
            >
              <Plus className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-sm font-medium text-slate-600">Medium</span>
              <span className="text-xs text-muted-foreground">£{CARPET_PRICES.medium}</span>
            </button>
            <button
              className="h-20 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center"
              onClick={() => addCarpetItem('large')}
            >
              <Plus className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-sm font-medium text-slate-600">Large</span>
              <span className="text-xs text-muted-foreground">£{CARPET_PRICES.large}</span>
            </button>
          </div>
          {data.carpetItems.length > 0 && (
            <div className="space-y-2">
              {data.carpetItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/20">
                  <span className="font-medium text-slate-700">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-primary font-semibold">£{item.price}</span>
                    <button
                      onClick={() => removeCarpetItem(item.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upholstery Cleaning */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Upholstery</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            {UPHOLSTERY_ITEMS.slice(0, 4).map(item => (
              <button
                key={item.id}
                className="h-16 rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center px-2"
                onClick={() => addUpholsteryItem(item)}
              >
                <Plus className="h-4 w-4 text-muted-foreground mb-1" />
                <span className="text-xs font-medium text-slate-600 text-center">{item.name}</span>
                <span className="text-xs text-muted-foreground">£{item.price}</span>
              </button>
            ))}
          </div>
          {data.upholsteryItems.length > 0 && (
            <div className="space-y-2">
              {data.upholsteryItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/20">
                  <span className="font-medium text-slate-700">{item.name} x{item.quantity}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-primary font-semibold">£{item.price * item.quantity}</span>
                    <button
                      onClick={() => removeUpholsteryItem(item.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mattress Cleaning */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Mattresses</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            {MATTRESS_ITEMS.map(item => (
              <button
                key={item.id}
                className="h-20 rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center px-2"
                onClick={() => addMattressItem(item, false)}
              >
                <Plus className="h-4 w-4 text-muted-foreground mb-1" />
                <span className="text-xs font-medium text-slate-600 text-center">{item.name}</span>
                <span className="text-xs text-muted-foreground">£{item.price} / £{item.bothSidesPrice}</span>
              </button>
            ))}
          </div>
          {data.mattressItems.length > 0 && (
            <div className="space-y-2">
              {data.mattressItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/20">
                  <span className="font-medium text-slate-700">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-primary font-semibold">£{item.price}</span>
                    <button
                      onClick={() => removeMattressItem(item.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Steam Cleaning Total */}
        {steamCleaningTotal > 0 && (
          <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Steam Cleaning Total</span>
              <span className="text-xl font-bold text-primary">£{steamCleaningTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="pt-4">
        <Button
          onClick={handleContinue}
          className="w-full h-14 text-lg font-semibold rounded-2xl"
          size="lg"
        >
          Continue to Schedule
        </Button>
      </div>
    </div>
  );
};
