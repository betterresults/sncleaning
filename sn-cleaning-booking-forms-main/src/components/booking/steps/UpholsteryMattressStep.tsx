import React from 'react';
import { Button } from '@/components/ui/button';
import { CarpetCleaningData, CarpetCleaningItem } from '../CarpetCleaningForm';
import { Plus, Minus, Sofa, Bed, BedDouble, BedSingle, UtensilsCrossed, Armchair, CircleDot, Theater, Crown, ArrowLeft, type LucideIcon } from 'lucide-react';

interface UpholsteryMattressStepProps {
  data: CarpetCleaningData;
  onUpdate: (updates: Partial<CarpetCleaningData>) => void;
  onNext: () => void;
  onBack: () => void;
}

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

export const UpholsteryMattressStep: React.FC<UpholsteryMattressStepProps> = ({
  data,
  onUpdate,
  onNext,
  onBack
}) => {
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

  const renderItemCard = (
    option: { id: string; name: string; size: 'small' | 'medium' | 'large'; description: string; price: number; icon: LucideIcon },
    type: 'upholstery' | 'mattress',
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
      {/* Upholstery Cleaning Section */}
      {renderSectionHeader('Upholstery Cleaning', Sofa, 'Sofas, chairs, ottomans & curtains', 'bg-gradient-to-r from-blue-50 to-indigo-50')}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {upholsteryOptions.map(option => renderItemCard(option, 'upholstery', data.upholsteryItems))}
      </div>

      {/* Mattress Cleaning Section */}
      <div className="mt-8">
        {renderSectionHeader('Mattress Cleaning', Bed, 'Deep clean & sanitize mattresses', 'bg-gradient-to-r from-purple-50 to-pink-50')}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {mattressOptions.map(option => renderItemCard(option, 'mattress', data.mattressItems))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-14 text-lg font-semibold rounded-xl"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
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