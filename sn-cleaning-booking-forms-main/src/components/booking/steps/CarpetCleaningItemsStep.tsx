import React from 'react';
import { Button } from '@/components/ui/button';
import { CarpetCleaningData, CarpetCleaningItem } from '../CarpetCleaningForm';
import { Plus, Minus, Layers, Sofa, Bed, BedDouble, BedSingle, Tv, UtensilsCrossed, Armchair, CircleDot, Theater, TrendingUp, DoorOpen, SquareStack, Crown, type LucideIcon } from 'lucide-react';

interface CarpetCleaningItemsStepProps {
  data: CarpetCleaningData;
  onUpdate: (updates: Partial<CarpetCleaningData>) => void;
  onNext: () => void;
}

// Carpet items with pricing and icons - room-based naming
const carpetOptions: { id: string; name: string; size: 'small' | 'medium' | 'large'; description: string; price: number; icon: LucideIcon }[] = [
  { id: 'rug_small', name: 'Small Rug', size: 'small', description: 'Up to 4 sqm', price: 25, icon: SquareStack },
  { id: 'rug_medium', name: 'Medium Rug', size: 'medium', description: '4-8 sqm', price: 40, icon: SquareStack },
  { id: 'rug_large', name: 'Large Rug', size: 'large', description: '8+ sqm', price: 60, icon: SquareStack },
  { id: 'carpet_single_bedroom', name: 'Single Bedroom', size: 'small', description: 'Single bedroom carpet', price: 35, icon: BedSingle },
  { id: 'carpet_double_bedroom', name: 'Double Bedroom', size: 'medium', description: 'Double bedroom carpet', price: 45, icon: BedDouble },
  { id: 'carpet_master_bedroom', name: 'Master Bedroom', size: 'large', description: 'Master bedroom carpet', price: 55, icon: Crown },
  { id: 'carpet_lounge', name: 'Lounge', size: 'medium', description: 'Living room carpet', price: 50, icon: Tv },
  { id: 'carpet_dining_room', name: 'Dining Room', size: 'medium', description: 'Dining area carpet', price: 45, icon: UtensilsCrossed },
  { id: 'stairs', name: 'Staircase', size: 'medium', description: 'Standard staircase', price: 40, icon: TrendingUp },
  { id: 'hallway', name: 'Hallway', size: 'small', description: 'Entrance/corridor', price: 25, icon: DoorOpen },
];

// Upholstery items with pricing and icons
const upholsteryOptions: { id: string; name: string; size: 'small' | 'medium' | 'large'; description: string; price: number; icon: LucideIcon }[] = [
  { id: 'sofa_2seat', name: '2-Seater Sofa', size: 'small', description: 'Love seat', price: 45, icon: Sofa },
  { id: 'sofa_3seat', name: '3-Seater Sofa', size: 'medium', description: 'Standard sofa', price: 60, icon: Sofa },
  { id: 'sofa_corner', name: 'Corner Sofa', size: 'large', description: 'L-shaped sectional', price: 85, icon: Sofa },
  { id: 'armchair', name: 'Armchair', size: 'small', description: 'Single chair', price: 30, icon: Armchair },
  { id: 'dining_chair', name: 'Dining Chair', size: 'small', description: 'Fabric seat', price: 15, icon: UtensilsCrossed },
  { id: 'ottoman', name: 'Ottoman', size: 'small', description: 'Fabric ottoman', price: 20, icon: CircleDot },
  { id: 'curtains', name: 'Curtain Panel', size: 'medium', description: 'Per panel', price: 25, icon: Theater },
];

// Mattress items with pricing and icons
const mattressOptions: { id: string; name: string; size: 'small' | 'medium' | 'large'; description: string; price: number; icon: LucideIcon }[] = [
  { id: 'mattress_single', name: 'Single Mattress', size: 'small', description: '90x190cm', price: 35, icon: BedSingle },
  { id: 'mattress_double', name: 'Double Mattress', size: 'medium', description: '135x190cm', price: 45, icon: BedDouble },
  { id: 'mattress_king', name: 'King Mattress', size: 'large', description: '150x200cm', price: 55, icon: Bed },
  { id: 'mattress_superking', name: 'Super King', size: 'large', description: '180x200cm', price: 65, icon: Crown },
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
    type: 'carpet' | 'upholstery' | 'mattress',
    id: string,
    name: string,
    size: 'small' | 'medium' | 'large',
    price: number,
    delta: number
  ) => {
    const key = type === 'carpet' ? 'carpetItems' : type === 'upholstery' ? 'upholsteryItems' : 'mattressItems';
    const items = [...data[key]];
    const existingIndex = items.findIndex(i => i.id === id);
    
    if (existingIndex >= 0) {
      const newQuantity = items[existingIndex].quantity + delta;
      if (newQuantity <= 0) {
        items.splice(existingIndex, 1);
      } else {
        items[existingIndex] = { ...items[existingIndex], quantity: newQuantity };
      }
    } else if (delta > 0) {
      items.push({ id, name, type, size, quantity: 1, price });
    }
    
    onUpdate({ [key]: items });
  };

  const getTotalItemCount = () => {
    const carpetCount = data.carpetItems.reduce((sum, item) => sum + item.quantity, 0);
    const upholsteryCount = data.upholsteryItems.reduce((sum, item) => sum + item.quantity, 0);
    const mattressCount = data.mattressItems.reduce((sum, item) => sum + item.quantity, 0);
    return carpetCount + upholsteryCount + mattressCount;
  };

  const canContinue = getTotalItemCount() > 0;

  const renderItemCard = (
    option: { id: string; name: string; size: 'small' | 'medium' | 'large'; description: string; price: number; icon: LucideIcon },
    type: 'carpet' | 'upholstery' | 'mattress',
    items: CarpetCleaningItem[]
  ) => {
    const quantity = getItemQuantity(items, option.id);
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
            updateItemQuantity(type, option.id, option.name, option.size, option.price, 1);
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
                  updateItemQuantity(type, option.id, option.name, option.size, option.price, -1);
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
                  updateItemQuantity(type, option.id, option.name, option.size, option.price, 1);
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

  const renderSectionHeader = (title: string, icon: LucideIcon, description: string, color: string) => {
    const IconComponent = icon;
    return (
      <div className={`flex items-center gap-4 p-4 rounded-xl ${color} mb-4`}>
        <div className="p-3 rounded-xl bg-white/80 shadow-sm">
          <IconComponent className="h-6 w-6 text-slate-700" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Carpet Cleaning Section */}
      <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
        {renderSectionHeader('Carpet Cleaning', Layers, 'Rugs, room carpets, stairs & hallways', 'bg-gradient-to-r from-amber-50 to-orange-50')}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {carpetOptions.map(option => renderItemCard(option, 'carpet', data.carpetItems))}
        </div>
      </div>

      {/* Upholstery Cleaning Section */}
      <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
        {renderSectionHeader('Upholstery Cleaning', Sofa, 'Sofas, chairs, ottomans & curtains', 'bg-gradient-to-r from-blue-50 to-indigo-50')}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {upholsteryOptions.map(option => renderItemCard(option, 'upholstery', data.upholsteryItems))}
        </div>
      </div>

      {/* Mattress Cleaning Section */}
      <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
        {renderSectionHeader('Mattress Cleaning', Bed, 'Deep clean & sanitize mattresses', 'bg-gradient-to-r from-purple-50 to-pink-50')}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {mattressOptions.map(option => renderItemCard(option, 'mattress', data.mattressItems))}
        </div>
      </div>

      {/* Continue Button */}
      <div className="pt-4">
        <Button
          onClick={onNext}
          disabled={!canContinue}
          className="w-full h-14 text-lg font-semibold rounded-xl"
        >
          Continue to Schedule
        </Button>
        {!canContinue && (
          <p className="text-center text-sm text-muted-foreground mt-2">
            Please select at least one item to continue
          </p>
        )}
      </div>
    </div>
  );
};
