import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CarpetCleaningData, CarpetCleaningItem } from '../CarpetCleaningForm';
import { Plus, Minus, Sofa, Bed, BedDouble, BedSingle, Armchair, Square, PanelTop, type LucideIcon } from 'lucide-react';

interface UpholsteryMattressStepProps {
  data: CarpetCleaningData;
  onUpdate: (updates: Partial<CarpetCleaningData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Upholstery items with pricing and icons
const upholsteryOptions: { id: string; name: string; size: 'small' | 'medium' | 'large'; description: string; price: number; icon: LucideIcon }[] = [
  { id: 'sofa_2seat', name: '2-Seater Sofa', size: 'small', description: 'Love seat', price: 59, icon: Sofa },
  { id: 'sofa_3seat', name: '3-Seater Sofa', size: 'medium', description: 'Standard sofa', price: 89, icon: Sofa },
  { id: 'sofa_corner', name: 'Corner Sofa', size: 'large', description: 'L-shaped sectional', price: 109, icon: Sofa },
  { id: 'armchair', name: 'Armchair', size: 'small', description: 'Single chair', price: 39, icon: Armchair },
  { id: 'dining_chair', name: 'Dining Chair', size: 'small', description: 'Fabric seat', price: 15, icon: Square },
  { id: 'ottoman', name: 'Ottoman', size: 'small', description: 'Fabric ottoman', price: 29, icon: Square },
  { id: 'headboard', name: 'Headboard', size: 'medium', description: 'Upholstered headboard', price: 45, icon: PanelTop },
  { id: 'curtains_half', name: 'Curtains Set (Half)', size: 'small', description: 'Half-length curtains', price: 35, icon: PanelTop },
  { id: 'curtains_full', name: 'Curtains Set (Full)', size: 'medium', description: 'Full-length curtains', price: 49, icon: PanelTop },
];

// Mattress items with pricing and icons (base price is for one side)
const mattressOptions: { id: string; name: string; size: 'small' | 'medium' | 'large'; description: string; price: number; icon: LucideIcon }[] = [
  { id: 'mattress_single', name: 'Single Mattress', size: 'small', description: '90x190cm', price: 35, icon: BedSingle },
  { id: 'mattress_double', name: 'Double Mattress', size: 'medium', description: '135x190cm', price: 45, icon: BedDouble },
  { id: 'mattress_king', name: 'King Mattress', size: 'large', description: '150x200cm', price: 55, icon: Bed },
  { id: 'mattress_superking', name: 'Super King', size: 'large', description: '180x200cm', price: 65, icon: Bed },
];

// Price multiplier for both sides
const BOTH_SIDES_MULTIPLIER = 1.5;

export const UpholsteryMattressStep: React.FC<UpholsteryMattressStepProps> = ({
  data,
  onUpdate,
  onNext,
  onBack
}) => {
  // Track which mattresses have "both sides" enabled
  const [bothSides, setBothSides] = useState<Record<string, boolean>>({});

  const getItemQuantity = (items: CarpetCleaningItem[], id: string) => {
    const item = items.find(i => i.id === id);
    return item?.quantity || 0;
  };

  const updateItemQuantity = (
    type: 'upholstery' | 'mattress',
    id: string,
    name: string,
    size: 'small' | 'medium' | 'large',
    price: number,
    delta: number
  ) => {
    const key = type === 'upholstery' ? 'upholsteryItems' : 'mattressItems';
    const items = [...data[key]];
    const existingIndex = items.findIndex(i => i.id === id);
    
    // For mattresses, apply both sides multiplier if enabled
    const finalPrice = type === 'mattress' && bothSides[id] 
      ? Math.round(price * BOTH_SIDES_MULTIPLIER) 
      : price;
    
    if (existingIndex >= 0) {
      const newQuantity = items[existingIndex].quantity + delta;
      if (newQuantity <= 0) {
        items.splice(existingIndex, 1);
        // Clear both sides state when removing
        if (type === 'mattress') {
          setBothSides(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }
      } else {
        items[existingIndex] = { ...items[existingIndex], quantity: newQuantity, price: finalPrice };
      }
    } else if (delta > 0) {
      items.push({ id, name, type, size, quantity: 1, price: finalPrice });
    }
    
    onUpdate({ [key]: items });
  };

  const toggleBothSides = (id: string, basePrice: number, name: string, size: 'small' | 'medium' | 'large') => {
    const newBothSides = !bothSides[id];
    setBothSides(prev => ({ ...prev, [id]: newBothSides }));
    
    // Update the price in the data
    const items = [...data.mattressItems];
    const existingIndex = items.findIndex(i => i.id === id);
    
    if (existingIndex >= 0) {
      const newPrice = newBothSides 
        ? Math.round(basePrice * BOTH_SIDES_MULTIPLIER) 
        : basePrice;
      items[existingIndex] = { ...items[existingIndex], price: newPrice };
      onUpdate({ mattressItems: items });
    }
  };

  const renderUpholsteryCard = (
    option: { id: string; name: string; size: 'small' | 'medium' | 'large'; description: string; price: number; icon: LucideIcon },
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
            updateItemQuantity('upholstery', option.id, option.name, option.size, option.price, 1);
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
                  updateItemQuantity('upholstery', option.id, option.name, option.size, option.price, -1);
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
                  updateItemQuantity('upholstery', option.id, option.name, option.size, option.price, 1);
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

  const renderMattressCard = (
    option: { id: string; name: string; size: 'small' | 'medium' | 'large'; description: string; price: number; icon: LucideIcon },
    items: CarpetCleaningItem[]
  ) => {
    const quantity = getItemQuantity(items, option.id);
    const isSelected = quantity > 0;
    const IconComponent = option.icon;
    const isBothSides = bothSides[option.id] || false;
    const displayPrice = isBothSides ? Math.round(option.price * BOTH_SIDES_MULTIPLIER) : option.price;

    return (
      <button
        key={option.id}
        className={`group relative h-48 rounded-2xl border transition-all duration-300 ${
          isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
        }`}
        onClick={() => {
          if (quantity === 0) {
            updateItemQuantity('mattress', option.id, option.name, option.size, option.price, 1);
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
            
            {/* Both Sides Toggle */}
            <div 
              className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg bg-primary/5"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-muted-foreground">Both sides</span>
              <Switch
                checked={isBothSides}
                onCheckedChange={() => toggleBothSides(option.id, option.price, option.name, option.size)}
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
                  updateItemQuantity('mattress', option.id, option.name, option.size, displayPrice, -1);
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
                  updateItemQuantity('mattress', option.id, option.name, option.size, displayPrice, 1);
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
            <span className="text-lg font-bold text-primary mt-2">£{option.price}</span>
          </div>
        )}
      </button>
    );
  };

  const renderSectionHeader = (title: string, icon: LucideIcon, color: string) => {
    const IconComponent = icon;
    return (
      <div className={`flex items-center gap-4 p-4 rounded-xl ${color} mb-4`}>
        <div className="p-3 rounded-xl bg-white shadow-sm">
          <IconComponent className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Upholstery Cleaning Section */}
      {renderSectionHeader('Upholstery Cleaning', Sofa, 'bg-gradient-to-r from-slate-50 to-slate-100')}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {upholsteryOptions.map(option => renderUpholsteryCard(option, data.upholsteryItems))}
      </div>

      {/* Mattress Cleaning Section */}
      <div className="mt-8">
        {renderSectionHeader('Mattress Cleaning', Bed, 'bg-gradient-to-r from-slate-50 to-slate-100')}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {mattressOptions.map(option => renderMattressCard(option, data.mattressItems))}
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
