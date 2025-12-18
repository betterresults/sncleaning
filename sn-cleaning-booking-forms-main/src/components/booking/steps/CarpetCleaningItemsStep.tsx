import React from 'react';
import { Button } from '@/components/ui/button';
import { CarpetCleaningData, CarpetCleaningItem } from '../CarpetCleaningForm';
import { Plus, Minus, Layers, Sofa, Bed } from 'lucide-react';

interface CarpetCleaningItemsStepProps {
  data: CarpetCleaningData;
  onUpdate: (updates: Partial<CarpetCleaningData>) => void;
  onNext: () => void;
}

// Carpet items with pricing
const carpetOptions = [
  { id: 'rug_small', name: 'Small Rug', size: 'small' as const, description: 'Up to 4 sqm', price: 25 },
  { id: 'rug_medium', name: 'Medium Rug', size: 'medium' as const, description: '4-8 sqm', price: 40 },
  { id: 'rug_large', name: 'Large Rug', size: 'large' as const, description: '8+ sqm', price: 60 },
  { id: 'carpet_room_small', name: 'Room Carpet (Small)', size: 'small' as const, description: 'Bedroom/small room', price: 35 },
  { id: 'carpet_room_medium', name: 'Room Carpet (Medium)', size: 'medium' as const, description: 'Living room', price: 50 },
  { id: 'carpet_room_large', name: 'Room Carpet (Large)', size: 'large' as const, description: 'Open plan/large room', price: 75 },
  { id: 'stairs', name: 'Staircase', size: 'medium' as const, description: 'Standard staircase', price: 40 },
  { id: 'hallway', name: 'Hallway', size: 'small' as const, description: 'Entrance/corridor', price: 25 },
];

// Upholstery items with pricing
const upholsteryOptions = [
  { id: 'sofa_2seat', name: '2-Seater Sofa', size: 'small' as const, description: 'Love seat', price: 45 },
  { id: 'sofa_3seat', name: '3-Seater Sofa', size: 'medium' as const, description: 'Standard sofa', price: 60 },
  { id: 'sofa_corner', name: 'Corner/L-Shaped Sofa', size: 'large' as const, description: 'Large sectional', price: 85 },
  { id: 'armchair', name: 'Armchair', size: 'small' as const, description: 'Single chair', price: 30 },
  { id: 'dining_chair', name: 'Dining Chair', size: 'small' as const, description: 'Fabric seat', price: 15 },
  { id: 'ottoman', name: 'Ottoman/Footstool', size: 'small' as const, description: 'Fabric ottoman', price: 20 },
  { id: 'curtains', name: 'Curtains (per panel)', size: 'medium' as const, description: 'Standard panel', price: 25 },
];

// Mattress items with pricing
const mattressOptions = [
  { id: 'mattress_single', name: 'Single Mattress', size: 'small' as const, description: '90x190cm', price: 35 },
  { id: 'mattress_double', name: 'Double Mattress', size: 'medium' as const, description: '135x190cm', price: 45 },
  { id: 'mattress_king', name: 'King Mattress', size: 'large' as const, description: '150x200cm', price: 55 },
  { id: 'mattress_superking', name: 'Super King Mattress', size: 'large' as const, description: '180x200cm', price: 65 },
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
    option: { id: string; name: string; size: 'small' | 'medium' | 'large'; description: string; price: number },
    type: 'carpet' | 'upholstery' | 'mattress',
    items: CarpetCleaningItem[]
  ) => {
    const quantity = getItemQuantity(items, option.id);
    const isSelected = quantity > 0;

    return (
      <button
        key={option.id}
        className={`group relative ${isSelected ? 'h-32' : 'h-24'} rounded-2xl border transition-all duration-300 ${
          isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
        }`}
        onClick={() => {
          if (quantity === 0) {
            updateItemQuantity(type, option.id, option.name, option.size, option.price, 1);
          }
        }}
      >
        {isSelected ? (
          <div className="flex flex-col items-center justify-center h-full p-2">
            <span className="text-xs font-bold text-primary mb-1 text-center leading-tight">
              {option.name}
            </span>
            <span className="text-[10px] text-muted-foreground mb-1">£{option.price}</span>
            <div className="flex items-center w-full">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  updateItemQuantity(type, option.id, option.name, option.size, option.price, -1);
                }}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <div className="flex-1 text-center mx-1">
                <div className="text-lg font-bold text-primary">
                  {quantity}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  updateItemQuantity(type, option.id, option.name, option.size, option.price, 1);
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-2">
            <span className="text-xs font-bold text-slate-500 group-hover:text-primary text-center leading-tight">
              {option.name}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1">{option.description}</span>
            <span className="text-sm font-bold text-slate-600 group-hover:text-primary mt-1">£{option.price}</span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Carpet Cleaning Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-700 mb-4">Carpet Cleaning</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {carpetOptions.map(option => renderItemCard(option, 'carpet', data.carpetItems))}
        </div>
      </div>

      {/* Upholstery Cleaning Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-700 mb-4">Upholstery Cleaning</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {upholsteryOptions.map(option => renderItemCard(option, 'upholstery', data.upholsteryItems))}
        </div>
      </div>

      {/* Mattress Cleaning Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-700 mb-4">Mattress Cleaning</h2>
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
