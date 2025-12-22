import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EndOfTenancyBookingData } from '../EndOfTenancyBookingForm';
import { Home, Building, Users, Plus, Minus, CheckCircle, AlertCircle, ChefHat } from 'lucide-react';
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
  { id: 'well-maintained', label: 'Well-Maintained', description: 'Property is in good condition with no significant issues' },
  { id: 'moderate', label: 'Moderate Condition', description: 'Regular use with some areas needing extra attention' },
  { id: 'heavily-used', label: 'Heavily Used', description: 'Several areas need significant cleaning effort' },
  { id: 'intensive', label: 'Intensive Cleaning Required', description: 'Requires thorough and extensive cleaning service' },
];

const FURNITURE_STATUS = [
  { id: 'furnished', label: 'Furnished' },
  { id: 'unfurnished', label: 'Unfurnished' },
  { id: 'part-furnished', label: 'Part Furnished' },
];

const ADDITIONAL_ROOMS = [
  { id: 'dining-room', label: 'Dining Room' },
  { id: 'study', label: 'Study Room' },
  { id: 'utility-room', label: 'Utility Room' },
  { id: 'conservatory', label: 'Conservatory' },
  { id: 'additional-living', label: 'Additional Living Room' },
  { id: 'basement', label: 'Basement' },
  { id: 'loft', label: 'Loft Room' },
];

const HOUSE_SHARE_AREAS = [
  { id: 'bedroom', label: 'Bedroom' },
  { id: 'bathroom', label: 'Bathroom' },
  { id: 'kitchen-shared', label: 'Kitchen (Shared)' },
  { id: 'living-shared', label: 'Living Room (Shared)' },
];

const OVEN_OPTIONS = [
  { id: '', label: 'No Oven Cleaning' },
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
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  
  const isHouseShare = data.propertyType === 'house-share';
  const isFlatOrHouse = data.propertyType === 'flat' || data.propertyType === 'house';
  
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
  
  // Validation
  const validationErrors = {
    propertyType: !data.propertyType,
    bedrooms: isFlatOrHouse && !data.bedrooms,
    bathrooms: isFlatOrHouse && !data.bathrooms,
    propertyCondition: !data.propertyCondition,
    furnitureStatus: !data.furnitureStatus,
    houseShareAreas: isHouseShare && (!data.houseShareAreas || data.houseShareAreas.length === 0),
  };
  
  const canContinue = !validationErrors.propertyType && 
    !validationErrors.propertyCondition && 
    !validationErrors.furnitureStatus &&
    (!isFlatOrHouse || (!validationErrors.bedrooms && !validationErrors.bathrooms)) &&
    (!isHouseShare || !validationErrors.houseShareAreas);
  
  const handleContinue = () => {
    if (!canContinue) {
      setShowValidationErrors(true);
      
      const missingFields: string[] = [];
      if (validationErrors.propertyType) missingFields.push('property type');
      if (validationErrors.propertyCondition) missingFields.push('property condition');
      if (validationErrors.furnitureStatus) missingFields.push('furniture status');
      if (validationErrors.bedrooms) missingFields.push('bedrooms');
      if (validationErrors.bathrooms) missingFields.push('bathrooms');
      if (validationErrors.houseShareAreas) missingFields.push('areas to clean');
      
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
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-700">Please Provide Details About The Property</h2>

      {/* Property Type */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-slate-700">Property Type <span className="text-destructive">*</span></h3>
          {showValidationErrors && validationErrors.propertyType && (
            <span className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Required
            </span>
          )}
        </div>
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${showValidationErrors && validationErrors.propertyType ? 'ring-2 ring-destructive ring-offset-2 rounded-2xl' : ''}`}>
          {PROPERTY_TYPES.map((type) => {
            const isSelected = data.propertyType === type.id;
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                className={`group relative h-16 rounded-2xl border transition-all duration-300 flex items-center justify-center gap-2 ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                }`}
                onClick={() => {
                  onUpdate({ 
                    propertyType: type.id as any,
                    // Reset related fields when changing property type
                    bedrooms: '',
                    bathrooms: '',
                    houseShareAreas: [],
                  });
                }}
              >
                <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-slate-500 group-hover:text-primary'}`}>
                  {type.label}
                </span>
                {isSelected && <CheckCircle className="h-4 w-4 text-primary absolute top-2 right-2" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* House Share Areas (only show for house share) */}
      {isHouseShare && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-slate-700">Which areas need cleaning? <span className="text-destructive">*</span></h3>
            {showValidationErrors && validationErrors.houseShareAreas && (
              <span className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                Select at least one area
              </span>
            )}
          </div>
          <div className={`grid grid-cols-2 gap-3 ${showValidationErrors && validationErrors.houseShareAreas ? 'ring-2 ring-destructive ring-offset-2 rounded-2xl p-2' : ''}`}>
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

      {/* Property Condition */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold text-slate-700">Condition Of The Property <span className="text-destructive">*</span></h3>
          {showValidationErrors && validationErrors.propertyCondition && (
            <span className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Required
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Indicate the current state of the property. 'Well-Maintained' means the property is in good condition with no significant issues. 'Moderate Condition' shows signs of regular use with some areas needing extra attention. 'Heavily Used' indicates that the property has several areas that need significant cleaning effort. 'Intensive Cleaning Required' points to a property that requires a thorough and extensive cleaning service due to prolonged usage or buildup.
        </p>
        <div className={`grid grid-cols-2 gap-3 ${showValidationErrors && validationErrors.propertyCondition ? 'ring-2 ring-destructive ring-offset-2 rounded-2xl p-2' : ''}`}>
          {PROPERTY_CONDITIONS.map((condition) => {
            const isSelected = data.propertyCondition === condition.id;
            return (
              <button
                key={condition.id}
                className={`h-14 rounded-2xl border transition-all duration-300 flex items-center justify-center ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                }`}
                onClick={() => onUpdate({ propertyCondition: condition.id as any })}
              >
                {isSelected && <CheckCircle className="h-4 w-4 text-primary mr-2" />}
                <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-slate-500'}`}>
                  {condition.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Furniture Status */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-slate-700">Property Status <span className="text-destructive">*</span></h3>
          {showValidationErrors && validationErrors.furnitureStatus && (
            <span className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Required
            </span>
          )}
        </div>
        <div className={`grid grid-cols-3 gap-3 ${showValidationErrors && validationErrors.furnitureStatus ? 'ring-2 ring-destructive ring-offset-2 rounded-2xl p-2' : ''}`}>
          {FURNITURE_STATUS.map((status) => {
            const isSelected = data.furnitureStatus === status.id;
            return (
              <button
                key={status.id}
                className={`h-14 rounded-2xl border transition-all duration-300 flex items-center justify-center ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                }`}
                onClick={() => onUpdate({ furnitureStatus: status.id as any })}
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

      {/* Property Size (for flat/house only) */}
      {isFlatOrHouse && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-slate-700">Size Of The Property <span className="text-destructive">*</span></h3>
            {showValidationErrors && (validationErrors.bedrooms || validationErrors.bathrooms) && (
              <span className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                Required
              </span>
            )}
          </div>
          
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${showValidationErrors && (validationErrors.bedrooms || validationErrors.bathrooms) ? 'ring-2 ring-destructive ring-offset-2 rounded-2xl p-2' : ''}`}>
            {/* Bedrooms */}
            <div className={`flex items-center rounded-2xl p-2 transition-all duration-300 ${
              data.bedrooms ? 'bg-primary/5 border border-primary' : 'bg-card border border-border'
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
                <div className={`text-base font-bold ${data.bedrooms ? 'text-primary' : 'text-slate-400'}`}>
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

            {/* Bathrooms */}
            <div className={`flex items-center rounded-2xl p-2 transition-all duration-300 ${
              data.bathrooms ? 'bg-primary/5 border border-primary' : 'bg-card border border-border'
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
                <div className={`text-base font-bold ${data.bathrooms ? 'text-primary' : 'text-slate-400'}`}>
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
      )}

      {/* Kitchen/Living Room Layout */}
      {isFlatOrHouse && (
        <div>
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Kitchen & Living Room Layout</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              className={`h-14 rounded-2xl border transition-all duration-300 flex items-center justify-center ${
                data.kitchenLivingSeparate === true ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
              }`}
              onClick={() => onUpdate({ kitchenLivingSeparate: true })}
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
              onClick={() => onUpdate({ kitchenLivingSeparate: false })}
            >
              {data.kitchenLivingSeparate === false && <CheckCircle className="h-4 w-4 text-primary mr-2" />}
              <span className={`text-sm font-bold ${data.kitchenLivingSeparate === false ? 'text-primary' : 'text-slate-500'}`}>
                Open Plan
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Additional Rooms */}
      {isFlatOrHouse && (
        <div>
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Additional Rooms</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ADDITIONAL_ROOMS.map((room) => {
              const isSelected = data.additionalRooms?.includes(room.id);
              return (
                <button
                  key={room.id}
                  className={`h-14 rounded-2xl border transition-all duration-300 flex items-center justify-center ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                  }`}
                  onClick={() => toggleAdditionalRoom(room.id)}
                >
                  {isSelected && <CheckCircle className="h-4 w-4 text-primary mr-2" />}
                  <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-slate-500'}`}>
                    {room.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Oven Size */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ChefHat className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-slate-700">Oven Size</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {OVEN_OPTIONS.map((oven) => {
            const isSelected = data.ovenType === oven.id;
            return (
              <button
                key={oven.id}
                className={`h-14 rounded-2xl border transition-all duration-300 flex items-center justify-center ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                }`}
                onClick={() => onUpdate({ ovenType: oven.id })}
              >
                {isSelected && <CheckCircle className="h-4 w-4 text-primary mr-2" />}
                <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-slate-500'}`}>
                  {oven.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Continue Button */}
      <div className="pt-4">
        <Button
          onClick={handleContinue}
          className="w-full h-14 text-lg font-semibold rounded-xl"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
