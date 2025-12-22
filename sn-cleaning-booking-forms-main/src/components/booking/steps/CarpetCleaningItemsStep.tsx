import React from 'react';
import { Button } from '@/components/ui/button';
import { CarpetCleaningData, CarpetCleaningItem } from '../CarpetCleaningForm';
import { Plus, Minus, Layers, BedDouble, BedSingle, Tv, UtensilsCrossed, TrendingUp, DoorOpen, SquareStack, Crown, type LucideIcon } from 'lucide-react';

interface CarpetCleaningItemsStepProps {
  data: CarpetCleaningData;
  onUpdate: (updates: Partial<CarpetCleaningData>) => void;
  onNext: () => void;
}

// Carpet items with pricing and icons - room-based naming
const carpetOptions: { id: string; name: string; size: 'small' | 'medium' | 'large'; description: string; price: number; icon: LucideIcon }[] = [
  { id: 'rug_small', name: 'Small Rug', size: 'small', description: 'Up to 4 sqm', price: 29, icon: SquareStack },
  { id: 'rug_medium', name: 'Medium Rug', size: 'medium', description: '4-8 sqm', price: 39, icon: SquareStack },
  { id: 'rug_large', name: 'Large Rug', size: 'large', description: '8+ sqm', price: 59, icon: SquareStack },
  { id: 'carpet_single_bedroom', name: 'Single Bedroom', size: 'small', description: 'Single bedroom carpet', price: 39, icon: BedSingle },
  { id: 'carpet_double_bedroom', name: 'Double Bedroom', size: 'medium', description: 'Double bedroom carpet', price: 59, icon: BedDouble },
  { id: 'carpet_master_bedroom', name: 'Master Bedroom', size: 'large', description: 'Master bedroom carpet', price: 69, icon: Crown },
  { id: 'carpet_lounge', name: 'Lounge', size: 'medium', description: 'Living room carpet', price: 79, icon: Tv },
  { id: 'carpet_dining_room', name: 'Dining Room', size: 'medium', description: 'Dining area carpet', price: 59, icon: UtensilsCrossed },
  { id: 'stairs', name: 'Staircase', size: 'medium', description: 'Standard staircase', price: 49, icon: TrendingUp },
  { id: 'hallway', name: 'Hallway', size: 'small', description: 'Entrance/corridor', price: 19, icon: DoorOpen },
];

export const CarpetCleaningItemsStep: React.FC<CarpetCleaningItemsStepProps> = ({
  data,
  onUpdate,
  onNext
}) => {
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
      <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 mb-4">
        <div className="p-3 rounded-xl bg-white/80 shadow-sm">
          <Layers className="h-6 w-6 text-slate-700" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Carpet Cleaning</h2>
          <p className="text-sm text-slate-600">Rugs, room carpets, stairs & hallways</p>
        </div>
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