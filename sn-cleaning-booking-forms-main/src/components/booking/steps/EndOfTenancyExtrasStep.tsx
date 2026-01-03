import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { EndOfTenancyBookingData } from '../EndOfTenancyBookingForm';
import { CarpetCleaningItem } from '../CarpetCleaningForm';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Minus, 
  Blinds, 
  Trash2, 
  Car, 
  Layers, 
  Sofa, 
  Bed, 
  BedDouble, 
  BedSingle, 
  Armchair, 
  Square, 
  PanelTop, 
  Tv, 
  UtensilsCrossed, 
  ChevronsUp, 
  DoorOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Crown,
  type LucideIcon 
} from 'lucide-react';

interface EndOfTenancyExtrasStepProps {
  data: EndOfTenancyBookingData;
  onUpdate: (updates: Partial<EndOfTenancyBookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Blinds options
const BLINDS_OPTIONS = [
  { id: 'small', label: 'Small Blinds / Shutters', description: 'Size around 60cm x 120cm for smaller windows, such as those in bathrooms or offices.', price: 6 },
  { id: 'medium', label: 'Medium Blinds / Shutters', description: 'Size around 100cm x 160cm for standard windows usually in bedrooms or kitchens.', price: 9 },
  { id: 'large', label: 'Large Blinds / Shutters', description: 'Size around 140cm x 220cm for large windows or sliding doors usually in living rooms or commercial areas.', price: 12 },
];

// Extra services
const EXTRA_SERVICES = [
  { id: 'balcony', name: 'Balcony Cleaning', price: 39, icon: Square },
  { id: 'waste', name: 'Household Waste Removal', price: 59, icon: Trash2 },
  { id: 'garage', name: 'Garage Cleaning', price: 59, icon: Car },
];

// Icon mapping for steam cleaning items
const ICON_MAP: Record<string, LucideIcon> = {
  'rug_small': Square,
  'rug_medium': Square,
  'rug_large': Square,
  'carpet_single_bedroom': BedSingle,
  'carpet_double_bedroom': BedDouble,
  'carpet_master_bedroom': Bed,
  'carpet_lounge': Tv,
  'carpet_dining_room': UtensilsCrossed,
  'stairs': ChevronsUp,
  'hallway': DoorOpen,
  'landing': DoorOpen,
  'carpet_additional': Square,
  'sofa_2seat': Sofa,
  'sofa_3seat': Sofa,
  'sofa_corner': Sofa,
  'armchair': Armchair,
  'dining_chair': Square,
  'cushions': Square,
  'curtains_half': PanelTop,
  'curtains_full': PanelTop,
  'headboard': Bed,
  'ottoman': Square,
  'mattress_single': BedSingle,
  'mattress_double': BedDouble,
  'mattress_king': Bed,
  'mattress_superking': Crown,
};

const BOTH_SIDES_MULTIPLIER = 1.5;

export const EndOfTenancyExtrasStep: React.FC<EndOfTenancyExtrasStepProps> = ({
  data,
  onUpdate,
  onNext,
  onBack
}) => {
  const [expandedSteamCleaning, setExpandedSteamCleaning] = useState<string[]>([]);
  const [bothSides, setBothSides] = useState<Record<string, boolean>>({});

  // Fetch steam cleaning items from database
  const { data: steamCleaningConfigs } = useQuery({
    queryKey: ['end-of-tenancy-steam-cleaning-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('end_of_tenancy_field_configs')
        .select('*')
        .in('category', ['carpet', 'upholstery', 'mattress'])
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Transform database configs into options format
  const carpetOptions = useMemo(() => {
    if (!steamCleaningConfigs) return [];
    return steamCleaningConfigs
      .filter(c => c.category === 'carpet')
      .map(c => ({
        id: c.option,
        name: c.label || c.option,
        size: 'medium' as const,
        price: c.value,
        icon: ICON_MAP[c.option] || Square,
      }));
  }, [steamCleaningConfigs]);

  const upholsteryOptions = useMemo(() => {
    if (!steamCleaningConfigs) return [];
    return steamCleaningConfigs
      .filter(c => c.category === 'upholstery')
      .map(c => ({
        id: c.option,
        name: c.label || c.option,
        size: 'medium' as const,
        price: c.value,
        icon: ICON_MAP[c.option] || Square,
      }));
  }, [steamCleaningConfigs]);

  const mattressOptions = useMemo(() => {
    if (!steamCleaningConfigs) return [];
    return steamCleaningConfigs
      .filter(c => c.category === 'mattress')
      .map(c => ({
        id: c.option,
        name: c.label || c.option,
        size: 'medium' as const,
        price: c.value,
        icon: ICON_MAP[c.option] || Square,
      }));
  }, [steamCleaningConfigs]);

  // Blinds handlers
  const updateBlindQuantity = (blindsId: string, delta: number) => {
    const current = data.blindsItems || [];
    const option = BLINDS_OPTIONS.find(b => b.id === blindsId);
    if (!option) return;

    const existingIndex = current.findIndex(b => b.type === blindsId);
    
    if (existingIndex >= 0) {
      const newQuantity = current[existingIndex].quantity + delta;
      if (newQuantity <= 0) {
        onUpdate({ blindsItems: current.filter((_, i) => i !== existingIndex) });
      } else {
        const updated = [...current];
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQuantity };
        onUpdate({ blindsItems: updated });
      }
    } else if (delta > 0) {
      onUpdate({ blindsItems: [...current, { type: blindsId, quantity: 1, price: option.price }] });
    }
  };

  const getBlindQuantity = (blindsId: string) => {
    return data.blindsItems?.find(b => b.type === blindsId)?.quantity || 0;
  };

  // Extra services handlers
  const updateExtraService = (serviceId: string, delta: number) => {
    const current = data.extraServices || [];
    const service = EXTRA_SERVICES.find(s => s.id === serviceId);
    if (!service) return;

    const existingIndex = current.findIndex(s => s.id === serviceId);
    
    if (existingIndex >= 0) {
      const newQuantity = current[existingIndex].quantity + delta;
      if (newQuantity <= 0) {
        onUpdate({ extraServices: current.filter((_, i) => i !== existingIndex) });
      } else {
        const updated = [...current];
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQuantity };
        onUpdate({ extraServices: updated });
      }
    } else if (delta > 0) {
      onUpdate({ extraServices: [...current, { id: serviceId, name: service.name, quantity: 1, price: service.price }] });
    }
  };

  const getExtraServiceQuantity = (serviceId: string) => {
    return data.extraServices?.find(s => s.id === serviceId)?.quantity || 0;
  };

  // Steam cleaning toggle
  const toggleSteamCleaningSection = (section: string) => {
    if (expandedSteamCleaning.includes(section)) {
      setExpandedSteamCleaning(expandedSteamCleaning.filter(s => s !== section));
    } else {
      setExpandedSteamCleaning([...expandedSteamCleaning, section]);
    }
  };

  const hasSteamCleaningItems = (section: string) => {
    switch (section) {
      case 'carpet':
        return data.carpetItems.length > 0;
      case 'upholstery':
        return data.upholsteryItems.length > 0;
      case 'mattress':
        return data.mattressItems.length > 0;
      default:
        return false;
    }
  };

  // Carpet handlers
  const getItemQuantity = (items: CarpetCleaningItem[], id: string) => {
    const item = items.find(i => i.id === id);
    return item?.quantity || 0;
  };

  const updateCarpetItem = (id: string, name: string, size: 'small' | 'medium' | 'large', price: number, delta: number) => {
    const items = [...data.carpetItems];
    const existingIndex = items.findIndex(i => i.id === id);
    
    if (existingIndex >= 0) {
      const newQuantity = items[existingIndex].quantity + delta;
      if (newQuantity <= 0) {
        items.splice(existingIndex, 1);
      } else {
        items[existingIndex] = { ...items[existingIndex], quantity: newQuantity };
      }
    } else if (delta > 0) {
      items.push({ id, name, type: 'carpet', size, quantity: 1, price });
    }
    
    onUpdate({ carpetItems: items, wantsSteamCleaning: items.length > 0 || data.upholsteryItems.length > 0 || data.mattressItems.length > 0 });
  };

  const updateUpholsteryItem = (id: string, name: string, size: 'small' | 'medium' | 'large', price: number, delta: number) => {
    const items = [...data.upholsteryItems];
    const existingIndex = items.findIndex(i => i.id === id);
    
    if (existingIndex >= 0) {
      const newQuantity = items[existingIndex].quantity + delta;
      if (newQuantity <= 0) {
        items.splice(existingIndex, 1);
      } else {
        items[existingIndex] = { ...items[existingIndex], quantity: newQuantity };
      }
    } else if (delta > 0) {
      items.push({ id, name, type: 'upholstery', size, quantity: 1, price });
    }
    
    onUpdate({ upholsteryItems: items, wantsSteamCleaning: data.carpetItems.length > 0 || items.length > 0 || data.mattressItems.length > 0 });
  };

  const updateMattressItem = (id: string, name: string, size: 'small' | 'medium' | 'large', basePrice: number, delta: number) => {
    const items = [...data.mattressItems];
    const existingIndex = items.findIndex(i => i.id === id);
    const isBothSides = bothSides[id] || false;
    const price = isBothSides ? Math.round(basePrice * BOTH_SIDES_MULTIPLIER) : basePrice;
    
    if (existingIndex >= 0) {
      const newQuantity = items[existingIndex].quantity + delta;
      if (newQuantity <= 0) {
        items.splice(existingIndex, 1);
        setBothSides(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } else {
        items[existingIndex] = { ...items[existingIndex], quantity: newQuantity, price };
      }
    } else if (delta > 0) {
      items.push({ id, name, type: 'mattress', size, quantity: 1, price, bothSides: isBothSides });
    }
    
    onUpdate({ mattressItems: items, wantsSteamCleaning: data.carpetItems.length > 0 || data.upholsteryItems.length > 0 || items.length > 0 });
  };

  const toggleMattressBothSides = (id: string, basePrice: number) => {
    const newBothSides = !bothSides[id];
    setBothSides(prev => ({ ...prev, [id]: newBothSides }));
    
    const items = [...data.mattressItems];
    const existingIndex = items.findIndex(i => i.id === id);
    
    if (existingIndex >= 0) {
      const newPrice = newBothSides ? Math.round(basePrice * BOTH_SIDES_MULTIPLIER) : basePrice;
      items[existingIndex] = { ...items[existingIndex], price: newPrice, bothSides: newBothSides };
      onUpdate({ mattressItems: items });
    }
  };

  const renderItemCard = (
    option: { id: string; name: string; size: 'small' | 'medium' | 'large'; price: number; originalPrice?: number; icon: LucideIcon },
    items: CarpetCleaningItem[],
    updateFn: (id: string, name: string, size: 'small' | 'medium' | 'large', price: number, delta: number) => void
  ) => {
    const quantity = getItemQuantity(items, option.id);
    const isSelected = quantity > 0;
    const IconComponent = option.icon;
    const hasDiscount = option.originalPrice && option.originalPrice > option.price;

    return (
      <button
        key={option.id}
        className={`group relative h-32 rounded-2xl border transition-all duration-300 ${
          isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
        }`}
        onClick={() => {
          if (quantity === 0) {
            updateFn(option.id, option.name, option.size, option.price, 1);
          }
        }}
      >
        {isSelected ? (
          <div className="flex flex-col items-center justify-center h-full p-3">
            <div className="p-2.5 rounded-full bg-primary/10 mb-2">
              <IconComponent className="h-7 w-7 text-primary" />
            </div>
            <span className="text-sm font-bold text-primary mb-2 text-center leading-tight">
              {option.name}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  updateFn(option.id, option.name, option.size, option.price, -1);
                }}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="w-8 text-center">
                <span className="text-xl font-bold text-primary">{quantity}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  updateFn(option.id, option.name, option.size, option.price, 1);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-3">
            <div className="p-2.5 rounded-full bg-muted mb-2 group-hover:bg-primary/10 transition-colors">
              <IconComponent className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm font-bold text-slate-700 group-hover:text-primary text-center leading-tight transition-colors">
              {option.name}
            </span>
            <div className="flex items-center gap-1 mt-1">
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">£{option.originalPrice}</span>
              )}
              <span className="text-base font-bold text-primary">£{option.price}</span>
            </div>
          </div>
        )}
      </button>
    );
  };

  const renderMattressCard = (option: { id: string; name: string; size: 'small' | 'medium' | 'large'; price: number; originalPrice?: number; icon: LucideIcon }) => {
    const quantity = getItemQuantity(data.mattressItems, option.id);
    const isSelected = quantity > 0;
    const IconComponent = option.icon;
    const isBothSides = bothSides[option.id] || false;
    const displayPrice = isBothSides ? Math.round(option.price * BOTH_SIDES_MULTIPLIER) : option.price;
    const hasDiscount = option.originalPrice && option.originalPrice > option.price;
    const displayOriginalPrice = option.originalPrice && isBothSides 
      ? Math.round(option.originalPrice * BOTH_SIDES_MULTIPLIER) 
      : option.originalPrice;

    return (
      <button
        key={option.id}
        className={`group relative h-48 rounded-2xl border transition-all duration-300 ${
          isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
        }`}
        onClick={() => {
          if (quantity === 0) {
            updateMattressItem(option.id, option.name, option.size, option.price, 1);
          }
        }}
      >
        {isSelected ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="p-3 rounded-full bg-primary/10 mb-2">
              <IconComponent className="h-7 w-7 text-primary" />
            </div>
            <span className="text-sm font-bold text-primary mb-2 text-center leading-tight">
              {option.name}
            </span>
            
            <div 
              className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg bg-primary/5"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-muted-foreground">Both sides</span>
              <Switch
                checked={isBothSides}
                onCheckedChange={() => toggleMattressBothSides(option.id, option.price)}
                className="scale-90"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  updateMattressItem(option.id, option.name, option.size, option.price, -1);
                }}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="w-8 text-center">
                <span className="text-xl font-bold text-primary">{quantity}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  updateMattressItem(option.id, option.name, option.size, option.price, 1);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="p-3 rounded-full bg-muted mb-3 group-hover:bg-primary/10 transition-colors">
              <IconComponent className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm font-bold text-slate-700 group-hover:text-primary text-center leading-tight transition-colors">
              {option.name}
            </span>
            <div className="flex items-center gap-1 mt-2">
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">£{option.originalPrice}</span>
              )}
              <span className="text-lg font-bold text-primary">£{option.price}</span>
            </div>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-8">
      {/* Blinds/Shutters Cleaning */}
      <div>
        <h2 className="text-xl font-bold text-slate-700 mb-4">Add Blinds / Shutters Cleaning If Required</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {BLINDS_OPTIONS.map((option) => {
            const quantity = getBlindQuantity(option.id);
            const isSelected = quantity > 0;
            return (
              <button
                key={option.id}
                className={`group relative rounded-2xl border transition-all duration-300 ${
                  isSelected ? 'border-primary bg-primary/5 shadow-md h-40' : 'border-border bg-card hover:border-primary/50 hover:shadow-sm h-32'
                }`}
                onClick={() => {
                  if (quantity === 0) {
                    updateBlindQuantity(option.id, 1);
                  }
                }}
              >
                {isSelected ? (
                  <div className="flex flex-col items-center justify-center h-full p-4">
                    <div className="p-2.5 rounded-full bg-primary/10 mb-2">
                      <Blinds className="h-7 w-7 text-primary" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 mb-1 text-center leading-tight">
                      {option.label}
                    </span>
                    <div className="w-full border-t border-border my-2"></div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateBlindQuantity(option.id, -1);
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="w-10 text-center px-2 py-1 bg-white rounded-lg border border-border">
                        <span className="text-xl font-bold text-primary">{quantity}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateBlindQuantity(option.id, 1);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-3">
                    <div className="p-2.5 rounded-full bg-muted mb-2 group-hover:bg-primary/10 transition-colors">
                      <Blinds className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-primary text-center leading-tight transition-colors">
                      {option.label}
                    </span>
                    <span className="text-base font-bold text-primary mt-1">£{option.price}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Extra Services */}
      <div>
        <h2 className="text-xl font-bold text-slate-700 mb-4">Add Any Extras If Required</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {EXTRA_SERVICES.map((service) => {
            const quantity = getExtraServiceQuantity(service.id);
            const isSelected = quantity > 0;
            const Icon = service.icon;
            const getServiceDescription = () => {
              if (service.id === 'waste' && quantity > 0) {
                return `Up to ${quantity * 10} bin bags`;
              }
              return null;
            };
            const description = getServiceDescription();
            return (
              <button
                key={service.id}
                className={`group relative rounded-2xl border transition-all duration-300 ${
                  isSelected ? 'border-primary bg-primary/5 shadow-md h-44' : 'border-border bg-card hover:border-primary/50 hover:shadow-sm h-32'
                }`}
                onClick={() => {
                  if (quantity === 0) {
                    updateExtraService(service.id, 1);
                  }
                }}
              >
                {isSelected ? (
                  <div className="flex flex-col items-center justify-center h-full p-4">
                    <div className="p-2.5 rounded-full bg-primary/10 mb-2">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 mb-1 text-center leading-tight">
                      {service.name}
                    </span>
                    {description && (
                      <span className="text-xs text-muted-foreground mb-2">{description}</span>
                    )}
                    <div className="w-full border-t border-border my-2"></div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateExtraService(service.id, -1);
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="w-10 text-center px-2 py-1 bg-white rounded-lg border border-border">
                        <span className="text-xl font-bold text-primary">{quantity}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateExtraService(service.id, 1);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-3">
                    <div className="p-2.5 rounded-full bg-muted mb-2 group-hover:bg-primary/10 transition-colors">
                      <Icon className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-primary text-center leading-tight transition-colors">
                      {service.name}
                    </span>
                    <span className="text-base font-bold text-primary mt-1">£{service.price}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Steam Cleaning */}
      <div>
        <h2 className="text-xl font-bold text-slate-700 mb-4">Do You Need Professional Steam Cleaning?</h2>
        <div className="space-y-4">
          {/* Carpet Cleaning Box */}
          <div>
            <div
              className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 cursor-pointer ${
                hasSteamCleaningItems('carpet') || expandedSteamCleaning.includes('carpet') 
                  ? 'border-primary' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => toggleSteamCleaningSection('carpet')}
            >
              <div 
                className={`p-4 flex items-center justify-between ${
                  hasSteamCleaningItems('carpet') ? 'bg-primary/5' : 'bg-card'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${hasSteamCleaningItems('carpet') ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Layers className={`h-6 w-6 ${hasSteamCleaningItems('carpet') ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <span className={`font-bold ${hasSteamCleaningItems('carpet') ? 'text-primary' : 'text-slate-700'}`}>
                    Carpet Cleaning
                  </span>
                  {hasSteamCleaningItems('carpet') && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
                {expandedSteamCleaning.includes('carpet') ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
            {/* Expanded Carpet Items - directly under the box */}
            {expandedSteamCleaning.includes('carpet') && (
              <div className="mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Select Carpet Items
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {carpetOptions.map(option => renderItemCard(option, data.carpetItems, updateCarpetItem))}
                </div>
              </div>
            )}
          </div>

          {/* Upholstery Cleaning Box */}
          <div>
            <div
              className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 cursor-pointer ${
                hasSteamCleaningItems('upholstery') || expandedSteamCleaning.includes('upholstery') 
                  ? 'border-primary' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => toggleSteamCleaningSection('upholstery')}
            >
              <div 
                className={`p-4 flex items-center justify-between ${
                  hasSteamCleaningItems('upholstery') ? 'bg-primary/5' : 'bg-card'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${hasSteamCleaningItems('upholstery') ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Sofa className={`h-6 w-6 ${hasSteamCleaningItems('upholstery') ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <span className={`font-bold ${hasSteamCleaningItems('upholstery') ? 'text-primary' : 'text-slate-700'}`}>
                    Upholstery Cleaning
                  </span>
                  {hasSteamCleaningItems('upholstery') && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
                {expandedSteamCleaning.includes('upholstery') ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
            {/* Expanded Upholstery Items - directly under the box */}
            {expandedSteamCleaning.includes('upholstery') && (
              <div className="mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Sofa className="h-5 w-5 text-primary" />
                  Select Upholstery Items
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {upholsteryOptions.map(option => renderItemCard(option, data.upholsteryItems, updateUpholsteryItem))}
                </div>
              </div>
            )}
          </div>

          {/* Mattress Cleaning Box */}
          <div>
            <div
              className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 cursor-pointer ${
                hasSteamCleaningItems('mattress') || expandedSteamCleaning.includes('mattress') 
                  ? 'border-primary' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => toggleSteamCleaningSection('mattress')}
            >
              <div 
                className={`p-4 flex items-center justify-between ${
                  hasSteamCleaningItems('mattress') ? 'bg-primary/5' : 'bg-card'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${hasSteamCleaningItems('mattress') ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Bed className={`h-6 w-6 ${hasSteamCleaningItems('mattress') ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <span className={`font-bold ${hasSteamCleaningItems('mattress') ? 'text-primary' : 'text-slate-700'}`}>
                    Mattress Cleaning
                  </span>
                  {hasSteamCleaningItems('mattress') && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
                {expandedSteamCleaning.includes('mattress') ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
            {/* Expanded Mattress Items - directly under the box */}
            {expandedSteamCleaning.includes('mattress') && (
              <div className="mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Bed className="h-5 w-5 text-primary" />
                  Select Mattress Items
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {mattressOptions.map(option => renderMattressCard(option))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-14 text-lg font-semibold rounded-xl"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 h-14 text-lg font-semibold rounded-xl"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
