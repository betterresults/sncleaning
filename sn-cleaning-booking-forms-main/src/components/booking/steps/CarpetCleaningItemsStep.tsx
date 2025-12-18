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
      <div
        key={option.id}
        className={`relative rounded-2xl border transition-all duration-300 ${
          isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
        }`}
      >
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className={`font-bold ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                {option.name}
              </h4>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </div>
            <span className={`text-lg font-bold ${isSelected ? 'text-primary' : 'text-slate-600'}`}>
              £{option.price}
            </span>
          </div>
          
          <div className="flex items-center justify-center mt-3">
            {isSelected ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                  onClick={() => updateItemQuantity(type, option.id, option.name, option.size, option.price, -1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-bold text-primary w-8 text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                  onClick={() => updateItemQuantity(type, option.id, option.name, option.size, option.price, 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 rounded-lg bg-muted hover:bg-primary/10 text-slate-600 hover:text-primary"
                onClick={() => updateItemQuantity(type, option.id, option.name, option.size, option.price, 1)}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Carpet Cleaning Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-slate-700">Carpet Cleaning</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {carpetOptions.map(option => renderItemCard(option, 'carpet', data.carpetItems))}
        </div>
      </div>

      {/* Upholstery Cleaning Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Sofa className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-slate-700">Upholstery Cleaning</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {upholsteryOptions.map(option => renderItemCard(option, 'upholstery', data.upholsteryItems))}
        </div>
      </div>

      {/* Mattress Cleaning Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Bed className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-slate-700">Mattress Cleaning</h2>
        </div>
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
