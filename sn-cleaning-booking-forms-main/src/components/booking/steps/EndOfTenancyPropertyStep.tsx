import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EndOfTenancyBookingData } from '../EndOfTenancyBookingForm';
import { Home, Building, Users, Plus, Minus, CheckCircle, Info, Microwave, UtensilsCrossed, BookOpen, WashingMachine, Trees, Sofa, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EndOfTenancyPropertyStepProps {
  data: EndOfTenancyBookingData;
  onUpdate: (updates: Partial<EndOfTenancyBookingData>) => void;
  onNext: () => void;
  isAdminMode?: boolean;
}

const PROPERTY_TYPES = [
  { id: 'flat', label: 'Flat', icon: Building },
  { id: 'house', label: 'House', icon: Home },
  { id: 'house-share', label: 'House Share', icon: Users },
];

const PROPERTY_CONDITIONS = [
  { 
    id: 'well-maintained', 
    label: 'Well-Maintained',
    description: 'Property is in good condition, regularly maintained with minimal dust and grime buildup.'
  },
  { 
    id: 'moderate', 
    label: 'Moderate Condition',
    description: 'Average wear and tear, some areas may need extra attention but generally acceptable.'
  },
  { 
    id: 'heavily-used', 
    label: 'Heavily Used',
    description: 'Significant wear, visible marks, and accumulated dirt requiring more intensive cleaning.'
  },
  { 
    id: 'intensive', 
    label: 'Intensive Cleaning Required',
    description: 'Property has substantial cleaning needs, may include grease buildup, heavy staining, or neglect.'
  },
];

const FURNITURE_STATUS = [
  { id: 'furnished', label: 'Furnished' },
  { id: 'unfurnished', label: 'Unfurnished' },
  { id: 'part-furnished', label: 'Part Furnished' },
];

const ADDITIONAL_ROOMS = [
  { id: 'dining-room', label: 'Dining Room', icon: UtensilsCrossed },
  { id: 'study', label: 'Study Room', icon: BookOpen },
  { id: 'utility-room', label: 'Utility Room', icon: WashingMachine },
  { id: 'conservatory', label: 'Conservatory', icon: Trees },
  { id: 'additional-living', label: 'Additional Living Room', icon: Sofa },
  { id: 'basement', label: 'Basement', icon: ArrowDownToLine },
  { id: 'loft', label: 'Loft Room', icon: ArrowUpFromLine },
];

const HOUSE_SHARE_AREAS = [
  { id: 'bedroom', label: 'Bedroom' },
  { id: 'bathroom', label: 'Bathroom' },
  { id: 'kitchen-shared', label: 'Kitchen (Shared)' },
  { id: 'living-shared', label: 'Living Room (Shared)' },
];

const OVEN_OPTIONS = [
  { id: 'single', label: 'Single Oven' },
  { id: 'double', label: 'Double Oven' },
  { id: 'range', label: 'Range Cooker' },
];

export const EndOfTenancyPropertyStep: React.FC<EndOfTenancyPropertyStepProps> = ({
  data,
  onUpdate,
  onNext,
  isAdminMode = false
}) => {
  const { toast } = useToast();
  
  const isHouseShare = data.propertyType === 'house-share';
  
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
  
  const toggleAdditionalRoom = (roomId: string) => {
    const current = data.additionalRooms || [];
    if (current.includes(roomId)) {
      onUpdate({ additionalRooms: current.filter(r => r !== roomId) });
    } else {
      onUpdate({ additionalRooms: [...current, roomId] });
    }
  };
  
  const toggleHouseShareArea = (areaId: string) => {
    const current = data.houseShareAreas || [];
    if (current.includes(areaId)) {
      onUpdate({ houseShareAreas: current.filter(a => a !== areaId) });
    } else {
      onUpdate({ houseShareAreas: [...current, areaId] });
    }
  };
  
  // Validation - for house share, need areas; for others, need bedrooms/bathrooms
  const canContinue = data.propertyType && 
    data.propertyCondition && 
    data.furnitureStatus &&
    (isHouseShare ? (data.houseShareAreas && data.houseShareAreas.length > 0) : (data.bedrooms && data.bathrooms));
  
  const handleContinue = () => {
    if (!canContinue) {
      const missingFields: string[] = [];
      if (!data.propertyType) missingFields.push('property type');
      if (!data.propertyCondition) missingFields.push('property condition');
      if (!data.furnitureStatus) missingFields.push('furniture status');
      if (!isHouseShare && !data.bedrooms) missingFields.push('bedrooms');
      if (!isHouseShare && !data.bathrooms) missingFields.push('bathrooms');
      if (isHouseShare && (!data.houseShareAreas || data.houseShareAreas.length === 0)) missingFields.push('areas to clean');
      
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
    <TooltipProvider>
      <div className="space-y-6">
        {/* Property Type */}
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-slate-700 mb-4">Property Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {PROPERTY_TYPES.map((type) => {
              const isSelected = data.propertyType === type.id;
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  className={`group relative h-16 rounded-2xl border transition-all duration-300 justify-start gap-3 p-4 flex items-center ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                  }`}
                  onClick={() => {
                    if (isSelected) {
                      onUpdate({ propertyType: '' as any });
                    } else {
                      onUpdate({ 
                        propertyType: type.id as any,
                        // Reset relevant fields when switching type
                        ...(type.id === 'house-share' ? { bedrooms: '', bathrooms: '' } : { houseShareAreas: [] }),
                      });
                    }
                  }}
                >
                  <Icon className={`h-6 w-6 transition-all duration-500 ${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                  <span className={`text-base font-bold transition-colors ${isSelected ? 'text-primary' : 'text-slate-500 group-hover:text-primary'}`}>
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* House Share Areas (only show for house share) */}
        {isHouseShare && (
          <div>
            <h2 className="text-2xl font-bold text-slate-700 mb-4">Which areas need cleaning?</h2>
            <div className="grid grid-cols-2 gap-3">
              {HOUSE_SHARE_AREAS.map((area) => {
                const isSelected = data.houseShareAreas?.includes(area.id);
                return (
                  <button
                    key={area.id}
                    className={`h-14 rounded-2xl border transition-all duration-300 flex items-center justify-center gap-2 ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                    }`}
                    onClick={() => toggleHouseShareArea(area.id)}
                  >
                    {isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
                    <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-slate-500'}`}>
                      {area.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Property Size (hide for house share) */}
        {!isHouseShare && (
          <div className="relative z-[9]">
            <h2 className="text-2xl font-bold text-slate-700 mb-4">Size of the property</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              {/* Bedrooms */}
              <div>
                <div className="flex items-center justify-center">
                  <div className={`flex items-center rounded-2xl p-2 w-full transition-all duration-300 ${
                    data.bedrooms ? 'bg-primary/5 border-2 border-primary' : 'bg-card border-2 border-border'
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
                    data.bathrooms ? 'bg-primary/5 border-2 border-primary' : 'bg-card border-2 border-border'
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
                        {data.bathrooms ? `${data.bathrooms} Bathroom${data.bathrooms !== '1' ? 's' : ''}` : 'Bathrooms'}
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
        )}

        {/* Condition of the Property - always visible */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold text-slate-700">Condition Of The Property</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 hover:bg-muted rounded-full transition-colors">
                  <Info className="h-5 w-5 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p>Indicate the current state of the property to help us prepare the right cleaning approach.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PROPERTY_CONDITIONS.map((condition) => {
              const isSelected = data.propertyCondition === condition.id;
              return (
                <Tooltip key={condition.id}>
                  <TooltipTrigger asChild>
                    <button
                      className={`h-14 rounded-2xl border transition-all duration-300 flex items-center justify-center gap-2 ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                      }`}
                      onClick={() => onUpdate({ propertyCondition: isSelected ? '' : condition.id as any })}
                    >
                      {isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
                      <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-slate-500'}`}>
                        {condition.label}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p>{condition.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Furniture Status - always visible */}
        <div>
          <h2 className="text-2xl font-bold text-slate-700 mb-4">Property Status</h2>
          <div className="grid grid-cols-3 gap-3">
            {FURNITURE_STATUS.map((status) => {
              const isSelected = data.furnitureStatus === status.id;
              return (
                <button
                  key={status.id}
                  className={`h-14 rounded-2xl border transition-all duration-300 flex items-center justify-center ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                  }`}
                  onClick={() => onUpdate({ furnitureStatus: isSelected ? '' : status.id as any })}
                >
                  {isSelected && <CheckCircle className="h-4 w-4 text-primary mr-2" />}
                  <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-slate-500'}`}>
                    {status.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Kitchen/Living Room Layout (hide for house share) */}
        {!isHouseShare && (
          <div>
            <h2 className="text-2xl font-bold text-slate-700 mb-4">Kitchen & Living Room Layout</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`h-14 rounded-2xl border transition-all duration-300 flex items-center justify-center ${
                  data.kitchenLivingSeparate === true ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                }`}
                onClick={() => onUpdate({ kitchenLivingSeparate: data.kitchenLivingSeparate === true ? null : true })}
              >
                {data.kitchenLivingSeparate === true && <CheckCircle className="h-4 w-4 text-primary mr-2" />}
                <span className={`text-sm font-bold ${data.kitchenLivingSeparate === true ? 'text-primary' : 'text-slate-500'}`}>
                  Separate Rooms
                </span>
              </button>
              <button
                className={`h-14 rounded-2xl border transition-all duration-300 flex items-center justify-center ${
                  data.kitchenLivingSeparate === false ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                }`}
                onClick={() => onUpdate({ kitchenLivingSeparate: data.kitchenLivingSeparate === false ? null : false })}
              >
                {data.kitchenLivingSeparate === false && <CheckCircle className="h-4 w-4 text-primary mr-2" />}
                <span className={`text-sm font-bold ${data.kitchenLivingSeparate === false ? 'text-primary' : 'text-slate-500'}`}>
                  Open Plan
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Additional Rooms (hide for house share) */}
        {!isHouseShare && (
          <div>
            <h2 className="text-2xl font-bold text-slate-700 mb-4">Additional Rooms</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ADDITIONAL_ROOMS.map((room) => {
                const isSelected = data.additionalRooms?.includes(room.id);
                const Icon = room.icon;
                return (
                  <button
                    key={room.id}
                    className={`group relative h-32 rounded-2xl border transition-all duration-300 ${
                      isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
                    }`}
                    onClick={() => toggleAdditionalRoom(room.id)}
                  >
                    <div className="flex flex-col items-center justify-center h-full p-3">
                      <div className={`p-2.5 rounded-full mb-2 transition-colors ${
                        isSelected ? 'bg-primary/10' : 'bg-muted group-hover:bg-primary/10'
                      }`}>
                        <Icon className={`h-7 w-7 transition-colors ${
                          isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                        }`} />
                      </div>
                      <span className={`text-sm font-bold text-center leading-tight transition-colors ${
                        isSelected ? 'text-primary' : 'text-slate-700 group-hover:text-primary'
                      }`}>
                        {room.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Oven Cleaning - Switch Style (hide for house share) */}
        {!isHouseShare && (
          <div className="relative z-[5]">
            <div className="flex items-center justify-between mb-4 p-3 bg-muted/30 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Microwave className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-700">
                    Add professional oven cleaning
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Include professional oven cleaning service
                  </p>
                </div>
              </div>
              <Switch
                checked={!!data.ovenType}
                onCheckedChange={(checked) => {
                  onUpdate({ 
                    ovenType: checked ? 'single' : ''
                  });
                }}
                className={`w-16 h-7 ${!data.ovenType ? 'border-2 border-border' : ''}`}
              />
            </div>
            
            {data.ovenType && (
              <div className="grid grid-cols-3 gap-3">
                {OVEN_OPTIONS.map((oven) => {
                  const isSelected = data.ovenType === oven.id;
                  return (
                    <button
                      key={oven.id}
                      className={`group relative h-20 rounded-2xl border transition-all duration-300 ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                      onClick={() => onUpdate({ ovenType: oven.id })}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className={`text-base font-bold transition-colors ${
                          isSelected ? 'text-primary' : 'text-slate-500 group-hover:text-primary'
                        }`}>{oven.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-end pt-4">
          <Button
            size="lg"
            className="rounded-xl px-8 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};
