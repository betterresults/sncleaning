import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { CarpetCleaningData, CarpetCleaningItem } from '../CarpetCleaningForm';
import { Plus, Minus, Layers, BedDouble, BedSingle, Bed, Tv, UtensilsCrossed, ChevronsUp, DoorOpen, Square, Crown, type LucideIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CarpetCleaningItemsStepProps {
  data: CarpetCleaningData;
  onUpdate: (updates: Partial<CarpetCleaningData>) => void;
  onNext: () => void;
}

// Icon mapping for carpet items
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
};

export const CarpetCleaningItemsStep: React.FC<CarpetCleaningItemsStepProps> = ({
  data,
  onUpdate,
  onNext
}) => {
  // Fetch carpet items from database
  const { data: carpetConfigs } = useQuery({
    queryKey: ['carpet-cleaning-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('end_of_tenancy_field_configs')
        .select('*')
        .eq('category', 'carpet')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Transform database configs into options format
  const carpetOptions = useMemo(() => {
    if (!carpetConfigs) return [];
    return carpetConfigs.map(c => ({
      id: c.option,
      name: c.label || c.option,
      size: 'medium' as const,
      description: '',
      price: c.value,
      icon: ICON_MAP[c.option] || Square,
    }));
  }, [carpetConfigs]);

  const getItemQuantity = (items: CarpetCleaningItem[], id: string) => {
    const item = items.find(i => i.id === id);
    return item?.quantity || 0;
  };

  const updateItemQuantity = (
    id: string,
    name: string,
    size: 'small' | 'medium' | 'large',
    price: number,
    delta: number
  ) => {
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
    
    onUpdate({ carpetItems: items });
  };

  const renderItemCard = (
    option: { id: string; name: string; size: 'small' | 'medium' | 'large'; description: string; price: number; icon: LucideIcon }
  ) => {
    const quantity = getItemQuantity(data.carpetItems, option.id);
    const isSelected = quantity > 0;
    const IconComponent = option.icon;

    return (
      <button
        key={option.id}
        className={`group relative h-32 rounded-2xl border transition-all duration-300 ${
          isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
        }`}
        onClick={() => {
          if (quantity === 0) {
            updateItemQuantity(option.id, option.name, option.size, option.price, 1);
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
                  updateItemQuantity(option.id, option.name, option.size, option.price, -1);
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
                  updateItemQuantity(option.id, option.name, option.size, option.price, 1);
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
            <span className="text-base font-bold text-primary mt-1">£{option.price}</span>
          </div>
        )}
      </button>
    );
  };

  const renderSectionHeader = () => {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 mb-4">
        <div className="p-3 rounded-xl bg-white shadow-sm">
          <Layers className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Carpet Cleaning</h2>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      {renderSectionHeader()}
      
      {/* Carpet Items Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {carpetOptions.map(option => renderItemCard(option))}
      </div>

      {/* Continue Button */}
      <div className="pt-4">
        <Button
          onClick={onNext}
          className="w-full h-14 text-lg font-semibold rounded-xl"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};