import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

interface PropertyConfig {
  bedrooms: number;
  bathrooms: number;
  living_rooms: number;
  additional_rooms?: Array<{ type: string; count: number }>;
}

interface MobilePropertyConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyConfig: PropertyConfig;
  language: 'english' | 'bulgarian';
  onSave: (config: PropertyConfig) => void;
}

export function MobilePropertyConfig({ 
  open, 
  onOpenChange, 
  propertyConfig, 
  language, 
  onSave 
}: MobilePropertyConfigProps) {
  const [config, setConfig] = useState({
    bedrooms: propertyConfig?.bedrooms || 1,
    bathrooms: propertyConfig?.bathrooms || 1,
    living_rooms: propertyConfig?.living_rooms || 1,
    additional_rooms: propertyConfig?.additional_rooms || [],
  });

  const handleSave = () => {
    onSave(config);
    onOpenChange(false);
  };

  const updateCount = (field: 'bedrooms' | 'bathrooms' | 'living_rooms', increment: boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + (increment ? 1 : -1))
    }));
  };

  const CounterRow = ({ 
    label, 
    value, 
    onIncrement, 
    onDecrement 
  }: { 
    label: string; 
    value: number; 
    onIncrement: () => void; 
    onDecrement: () => void; 
  }) => (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onDecrement}
          disabled={value <= 0}
          className="h-8 w-8 p-0"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center font-medium">{value}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onIncrement}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {language === 'english' ? 'Property Configuration' : 'Конфигурация на имота'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <CounterRow
            label={language === 'english' ? 'Bedrooms' : 'Спални'}
            value={config.bedrooms}
            onIncrement={() => updateCount('bedrooms', true)}
            onDecrement={() => updateCount('bedrooms', false)}
          />
          
          <CounterRow
            label={language === 'english' ? 'Bathrooms' : 'Бани'}
            value={config.bathrooms}
            onIncrement={() => updateCount('bathrooms', true)}
            onDecrement={() => updateCount('bathrooms', false)}
          />
          
          <CounterRow
            label={language === 'english' ? 'Living Rooms' : 'Дневни'}
            value={config.living_rooms}
            onIncrement={() => updateCount('living_rooms', true)}
            onDecrement={() => updateCount('living_rooms', false)}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            {language === 'english' ? 'Cancel' : 'Отказ'}
          </Button>
          <Button 
            onClick={handleSave}
            className="flex-1"
          >
            {language === 'english' ? 'Save' : 'Запази'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}