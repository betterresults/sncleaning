import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { BookingData } from '../BookingForm';
import { Home, Building, Plus, Minus, CheckCircle, Droplets, Wrench, X, BookOpen, Zap, Bed } from 'lucide-react';
import { useAirbnbFieldConfigs } from '@/hooks/useAirbnbFieldConfigs';

interface PropertyStepProps {
  data: BookingData;
  onUpdate: (updates: Partial<BookingData>) => void;
  onNext: () => void;
}

const PropertyStep: React.FC<PropertyStepProps> = ({ data, onUpdate, onNext }) => {
  const { data: propertyTypeConfigs = [] } = useAirbnbFieldConfigs('Property Type', true);

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

  const incrementToilets = () => {
    const current = parseInt(data.toilets || '0');
    if (current >= 6) return;
    onUpdate({ toilets: current >= 5 ? '6+' : (current + 1).toString() });
  };

  const decrementToilets = () => {
    const current = data.toilets;
    if (!current || current === '0') return;
    if (current === '6+') {
      onUpdate({ toilets: '5' });
    } else {
      const num = parseInt(current);
      onUpdate({ toilets: num > 0 ? (num - 1).toString() : '0' });
    }
  };

  const roundToNearestHalf = (hours: number) => {
    return Math.round(hours * 2) / 2; // Round to nearest 0.5
  };

  const calculateRecommendedHours = () => {
    let totalHours = 0;
    
    // Property type base hours (from dynamic config if available)
    const selectedPropertyType = propertyTypeConfigs.find((cfg: any) => cfg.option === data.propertyType);
    if (selectedPropertyType && typeof selectedPropertyType.time === 'number') {
      totalHours += Math.max(0, selectedPropertyType.time) / 60; // time is in minutes
    } else {
      const propertyTypeHours = { flat: 2, house: 3 } as const;
      totalHours += (propertyTypeHours as any)[data.propertyType] || 0;
    }
    
    // Bedrooms
    const bedroomHours = { studio: 0.5, '1': 0.5, '2': 1, '3': 1.5, '4': 2, '5': 2.5, '6+': 3 };
    totalHours += bedroomHours[data.bedrooms as keyof typeof bedroomHours] || 0;
    
    // Bathrooms
    totalHours += parseInt(data.bathrooms || '0') * 0.5;
    
    // Additional rooms
    const additionalRoomsTotal = Object.values(data.additionalRooms || {}).reduce((sum, count) => sum + count, 0);
    totalHours += additionalRoomsTotal * 0.5;
    
    // Oven cleaning
    if (data.needsOvenCleaning) {
      const ovenHours = { single: 0.5, double: 1, range: 1.5, convection: 1 };
      totalHours += ovenHours[data.ovenType as keyof typeof ovenHours] || 0.5;
    }
    
    // Linen handling
    const linenHours = { 'customer-handles': 0, 'wash-hang': 0.5, 'wash-dry': 0.5, 'order-linens': 0 };
    totalHours += linenHours[data.linensHandling as keyof typeof linenHours] || 0;
    
    // Deep cleaning multiplier
    if (data.serviceType === 'deep' || data.alreadyCleaned === false) {
      totalHours *= 1.3;
    }
    
    return roundToNearestHalf(Math.max(totalHours, 2)); // Minimum 2 hours, rounded to nearest 0.5
  };

  const recommendedHours = calculateRecommendedHours();
  
  const canContinue = data.propertyType && data.bedrooms && data.bathrooms && data.serviceType && 
    (!data.cleaningProducts.equipment || data.equipmentArrangement !== null);

  // Auto-select cleaning products for deep cleaning or uncleaned properties
  React.useEffect(() => {
    if (data.serviceType === 'deep' || data.alreadyCleaned === false) {
      if (data.cleaningProducts.needed !== true) {
        onUpdate({ cleaningProducts: { ...data.cleaningProducts, needed: true } });
      }
    }
  }, [data.serviceType, data.alreadyCleaned, data.cleaningProducts.needed, onUpdate]);

  // Update recommended hours in booking data
  React.useEffect(() => {
    if (data.propertyType && data.bedrooms && data.bathrooms && data.serviceType && !data.estimatedHours) {
      onUpdate({ estimatedHours: roundToNearestHalf(recommendedHours) });
    }
  }, [recommendedHours, data.propertyType, data.bedrooms, data.bathrooms, data.serviceType, data.estimatedHours, onUpdate]);

  return (
    <div className="space-y-4">
      <div className="p-2 rounded-2xl border border-border shadow-[0_16px_48px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.06)] bg-white transition-shadow duration-300">
        <h2 className="text-2xl font-bold text-[#185166] mb-4">
          Property Details
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {(propertyTypeConfigs && propertyTypeConfigs.length > 0 ? propertyTypeConfigs : [
            { option: 'flat', label: 'Flat' },
            { option: 'house', label: 'House' },
          ]).map((opt: any) => {
            const isSelected = data.propertyType === opt.option;
            const isHouse = opt.option === 'house';
            return (
              <button
                key={opt.option}
                className={`group relative h-16 rounded-2xl border-2 transition-all duration-500 hover:scale-105 justify-start gap-3 p-4 flex items-center ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-xl'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
                }`}
                onClick={() => onUpdate({ propertyType: isSelected ? '' : opt.option })}
              >
                {isHouse ? (
                  <Home className={`h-6 w-6 transition-all duration-500 ${
                    isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                  }`} />
                ) : (
                  <Building className={`h-6 w-6 transition-all duration-500 ${
                    isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                  }`} />
                )}
                <span className={`text-base font-medium transition-colors ${
                  isSelected ? 'text-primary' : 'text-slate-600 group-hover:text-primary'
                }`}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Size of the property */}
      <div className="p-2 rounded-2xl border border-border shadow-[0_16px_48px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.06)] bg-white transition-shadow duration-300">
        <h2 className="text-xl font-bold text-[#185166] mb-4">
          Size of the property
        </h2>
        
        {/* Bedrooms and Bathrooms side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          {/* Bedrooms */}
          <div>
            <div className="flex items-center justify-center">
              <div className="flex items-center bg-card border border-border rounded-2xl p-2 w-full">
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
                <div className="text-lg font-semibold text-slate-600">
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
              <div className="flex items-center bg-card border border-border rounded-2xl p-2 w-full">
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
                  <div className="text-lg font-semibold text-slate-600">
                    {data.bathrooms ? `${data.bathrooms} Bathroom${data.bathrooms !== '1' && data.bathrooms !== '6+' && parseInt(data.bathrooms) > 1 ? 's' : data.bathrooms === '6+' ? 's' : ''}` : 'Bathrooms'}
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

      {/* Additional Rooms - only show if 2+ bedrooms */}
      {data.bedrooms && !['studio', '1'].includes(data.bedrooms) && (
        <div className="p-4 rounded-2xl border border-border shadow-[0_12px_32px_rgba(0,0,0,0.18)] bg-white hover:shadow-[0_16px_48px_rgba(0,0,0,0.2)] transition-shadow duration-300">
          <h2 className="text-xl font-bold text-[#185166] mb-4">
            Additional rooms
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            {[
              { type: 'toilets', label: 'Toilets', icon: '🚽' },
              { type: 'studyRooms', label: 'Study Room', icon: '📚' },
              { type: 'utilityRooms', label: 'Utility Room', icon: '🔧' },
              { type: 'otherRooms', label: 'Other Room', icon: '🏠' },
            ].map((room) => (
              <button
                key={room.type}
                className={`group relative ${data.additionalRooms[room.type as keyof typeof data.additionalRooms] > 0 ? 'h-32' : 'h-24'} rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                  data.additionalRooms[room.type as keyof typeof data.additionalRooms] > 0
                    ? 'border-primary bg-primary/5 shadow-xl'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
                }`}
                onClick={() => {
                  const currentCount = data.additionalRooms[room.type as keyof typeof data.additionalRooms];
                  if (currentCount === 0) {
                    onUpdate({
                      additionalRooms: {
                        ...data.additionalRooms,
                        [room.type]: 1
                      }
                    });
                  }
                }}
              >
                {data.additionalRooms[room.type as keyof typeof data.additionalRooms] === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-2xl mb-2">{room.icon}</div>
                    <span className="text-sm font-medium text-slate-600 group-hover:text-primary">
                      {room.label}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-2">
                    <div className="text-xl mb-1">{room.icon}</div>
                    <span className="text-xs font-bold text-primary mb-2">
                      {room.label}
                    </span>
                    <div className="flex items-center w-full">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentCount = data.additionalRooms[room.type as keyof typeof data.additionalRooms];
                          if (currentCount > 0) {
                            onUpdate({
                              additionalRooms: {
                                ...data.additionalRooms,
                                [room.type]: currentCount - 1
                              }
                            });
                          }
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <div className="flex-1 text-center mx-1">
                        <div className="text-lg font-bold text-primary">
                          {data.additionalRooms[room.type as keyof typeof data.additionalRooms]}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentCount = data.additionalRooms[room.type as keyof typeof data.additionalRooms];
                          if (currentCount < 6) {
                            onUpdate({
                              additionalRooms: {
                                ...data.additionalRooms,
                                [room.type]: currentCount + 1
                              }
                            });
                          }
                        }}
                        disabled={data.additionalRooms[room.type as keyof typeof data.additionalRooms] >= 6}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Property Features */}
      <div className="p-2 rounded-2xl border border-border shadow-[0_16px_48px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.06)] bg-white transition-shadow duration-300">
        <h2 className="text-xl font-bold text-[#185166] mb-4">
          Property Features
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Separate Kitchen & Living Room combined */}
          <button
            className={`group relative h-24 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
              (data.propertyFeatures.separateKitchen || data.propertyFeatures.livingRoom)
                ? 'border-primary bg-primary/5 shadow-xl'
                : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
            }`}
            onClick={() => {
              const newValue = !(data.propertyFeatures.separateKitchen || data.propertyFeatures.livingRoom);
              onUpdate({
                propertyFeatures: {
                  ...data.propertyFeatures,
                  separateKitchen: newValue,
                  livingRoom: newValue
                }
              });
            }}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-2xl mb-2">🍳 🛋️</div>
              <span className={`text-sm font-medium transition-colors ${
                (data.propertyFeatures.separateKitchen || data.propertyFeatures.livingRoom) ? 'text-primary' : 'text-slate-600 group-hover:text-primary'
              }`}>Separate Kitchen & Living Room</span>
            </div>
          </button>

          {/* Dining Room */}
          <button
            className={`group relative h-24 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
              data.propertyFeatures.diningRoom
                ? 'border-primary bg-primary/5 shadow-xl'
                : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
            }`}
            onClick={() => {
              onUpdate({
                propertyFeatures: {
                  ...data.propertyFeatures,
                  diningRoom: !data.propertyFeatures.diningRoom
                }
              });
            }}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-2xl mb-2">🍽️</div>
              <span className={`text-sm font-medium transition-colors ${
                data.propertyFeatures.diningRoom ? 'text-primary' : 'text-slate-600 group-hover:text-primary'
              }`}>Dining Room</span>
            </div>
          </button>

          {/* Number of Floors with counter */}
          <button
            className={`group relative ${data.numberOfFloors > 0 ? 'h-32' : 'h-24'} rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
              data.numberOfFloors > 0
                ? 'border-primary bg-primary/5 shadow-xl'
                : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
            }`}
            onClick={() => {
              if (data.numberOfFloors === 0) {
                onUpdate({ numberOfFloors: 1 });
              }
            }}
          >
            {data.numberOfFloors > 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-2">
                <div className="text-xl mb-1">🏢</div>
                <span className="text-xs font-bold text-primary mb-2">
                  Number of Floors
                </span>
                <div className="flex items-center w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (data.numberOfFloors > 0) {
                        onUpdate({ numberOfFloors: data.numberOfFloors - 1 });
                      }
                    }}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div className="flex-1 text-center mx-1">
                    <div className="text-lg font-bold text-primary">
                      {data.numberOfFloors}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (data.numberOfFloors < 10) {
                        onUpdate({ numberOfFloors: data.numberOfFloors + 1 });
                      }
                    }}
                    disabled={data.numberOfFloors >= 10}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-2xl mb-2">🏢</div>
                <span className={`text-sm font-medium transition-colors ${
                  data.numberOfFloors > 0 ? 'text-primary' : 'text-slate-600 group-hover:text-primary'
                }`}>Number of Floors</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Service Type */}
      <div className="p-2 rounded-2xl border border-border shadow-[0_16px_48px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.06)] bg-white transition-shadow duration-300">
        <h2 className="text-xl font-bold text-[#185166] mb-4">
          Choose your service
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { value: 'checkin-checkout', label: 'Check-in/Check-out', emoji: '🏠' },
            { value: 'midstay', label: 'Mid-stay', emoji: '🛏️' },
            { value: 'light', label: 'Light Cleaning', emoji: '✨' },
            { value: 'deep', label: 'Deep Cleaning', emoji: '🧽' },
          ].map((service) => (
            <button
              key={service.value}
              className={`group relative h-24 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                data.serviceType === service.value
                  ? 'border-primary bg-primary/5 shadow-xl'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
              }`}
              onClick={() => onUpdate({ serviceType: data.serviceType === service.value ? '' : service.value as any })}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-2xl mb-2">{service.emoji}</div>
                <span className={`text-sm font-medium transition-colors ${
                  data.serviceType === service.value ? 'text-primary' : 'text-slate-600 group-hover:text-primary'
                }`}>{service.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Property Already Cleaned */}
      {data.serviceType === 'checkin-checkout' && (
        <div className="p-2 rounded-2xl border border-border shadow-[0_16px_48px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.06)] bg-white transition-shadow duration-300">
          <h2 className="text-xl font-bold text-[#185166] mb-4">
            Has the property been cleaned to Airbnb standard already?
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              className={`group relative h-16 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                data.alreadyCleaned === false
                  ? 'border-primary bg-primary/5 shadow-xl'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
              }`}
              onClick={() => onUpdate({ alreadyCleaned: data.alreadyCleaned === false ? null : false })}
            >
              <div className="flex items-center justify-center h-full">
                <span className={`text-base font-medium transition-colors ${
                  data.alreadyCleaned === false ? 'text-primary' : 'text-slate-600 group-hover:text-primary'
                }`}>No</span>
              </div>
            </button>
            <button
              className={`group relative h-16 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                data.alreadyCleaned === true
                  ? 'border-primary bg-primary/5 shadow-xl'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
              }`}
              onClick={() => onUpdate({ alreadyCleaned: data.alreadyCleaned === true ? null : true })}
            >
              <div className="flex items-center justify-center h-full">
                <span className={`text-base font-medium transition-colors ${
                  data.alreadyCleaned === true ? 'text-primary' : 'text-slate-600 group-hover:text-primary'
                }`}>Yes</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Oven Cleaning - show if deep cleaning or not cleaned to Airbnb standard */}
      {(data.serviceType === 'deep' || data.alreadyCleaned === false) && (
         <div className="p-2 rounded-2xl border border-border shadow-[0_16px_48px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.06)] bg-white transition-shadow duration-300">
          <h2 className="text-xl font-bold text-[#185166] mb-4">
            Do you require oven cleaning?
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              className={`group relative h-16 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                data.needsOvenCleaning === false
                  ? 'border-primary bg-primary/5 shadow-xl'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
              }`}
              onClick={() => onUpdate({ needsOvenCleaning: data.needsOvenCleaning === false ? null : false })}
            >
              <div className="flex items-center justify-center h-full">
                <span className={`text-base font-medium transition-colors ${
                  data.needsOvenCleaning === false ? 'text-primary' : 'text-slate-600 group-hover:text-primary'
                }`}>No</span>
              </div>
            </button>
            <button
              className={`group relative h-16 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                data.needsOvenCleaning === true
                  ? 'border-primary bg-primary/5 shadow-xl'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
              }`}
              onClick={() => onUpdate({ needsOvenCleaning: data.needsOvenCleaning === true ? null : true })}
            >
              <div className="flex items-center justify-center h-full">
                <span className={`text-base font-medium transition-colors ${
                  data.needsOvenCleaning === true ? 'text-primary' : 'text-slate-600 group-hover:text-primary'
                }`}>Yes</span>
              </div>
            </button>
          </div>

          {/* Oven Type Selection */}
          {data.needsOvenCleaning === true && (
            <div>
              <h2 className="text-xl font-bold text-[#185166] mb-4">
                Select oven type
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { value: 'single', label: 'Single Oven', emoji: '🔥' },
                  { value: 'double', label: 'Double Oven', emoji: '🔥🔥' },
                  { value: 'range', label: 'Range Oven', emoji: '🍳' },
                  { value: 'convection', label: 'Convection', emoji: '🌪️' },
                ].map((oven) => (
                  <button
                    key={oven.value}
                    className={`group relative h-20 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                      data.ovenType === oven.value
                        ? 'border-primary bg-primary/5 shadow-xl'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
                    }`}
                    onClick={() => onUpdate({ ovenType: data.ovenType === oven.value ? '' : oven.value as any })}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-lg mb-1">{oven.emoji}</div>
                      <span className={`text-sm font-medium transition-colors ${
                        data.ovenType === oven.value ? 'text-primary' : 'text-slate-600 group-hover:text-primary'
                      }`}>{oven.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cleaning Supplies */}
       <div className="p-2 rounded-2xl border border-border shadow-[0_16px_48px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.06)] bg-white transition-shadow duration-300">
        <h2 className="text-xl font-bold text-[#185166] mb-4">
          Cleaning supplies
        </h2>
        
        {/* Message for deep cleaning or uncleaned properties */}
        {(data.serviceType === 'deep' || data.alreadyCleaned === false) && (
          <div className="mb-4 p-4 bg-muted/20 border border-muted-foreground/20 rounded-2xl">
            <p className="text-muted-foreground font-semibold">
              {data.serviceType === 'deep' ? 'For deep cleaning, we provide cleaning products by default. You can still choose equipment options below.' : 'For properties not cleaned to Airbnb standard, we provide cleaning products by default. You can still choose equipment options below.'}
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-4">
          <button
             className={`group relative h-24 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
               data.cleaningProducts.needed === false && data.cleaningProducts.equipment === false
                 ? 'border-primary bg-primary/5 shadow-xl'
                 : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
             }`}
             onClick={() => {
               if (data.cleaningProducts.needed === false && data.cleaningProducts.equipment === false) {
                 // Currently selected "No", unselect it (back to null)
                 onUpdate({ cleaningProducts: { needed: null, equipment: null } });
               } else {
                 // Select "No" and deselect others
                 onUpdate({ cleaningProducts: { needed: false, equipment: false } });
               }
             }}
             disabled={data.serviceType === 'deep' || data.alreadyCleaned === false}
           >
             <div className="flex flex-col items-center justify-center h-full relative">
               <X className="h-8 w-8 text-green-500 mb-1" />
               {(data.serviceType === 'deep' || data.alreadyCleaned === false) && (
                 <div className="absolute inset-0 bg-muted/80 rounded-2xl flex items-center justify-center">
                   <span className="text-xs text-muted-foreground font-semibold">Not available</span>
                 </div>
               )}
             </div>
           </button>
          <button
             className={`group relative h-24 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
               data.cleaningProducts.needed === true
                 ? 'border-primary bg-primary/5 shadow-xl'
                 : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
             }`}
             onClick={() => {
               const isCurrentlySelected = data.cleaningProducts.needed === true;
               if (isCurrentlySelected) {
                 // Deselect products but keep equipment if selected
                 onUpdate({ 
                   cleaningProducts: { 
                     needed: false, 
                     equipment: data.cleaningProducts.equipment 
                   } 
                 });
               } else {
                 // Select products
                 onUpdate({ 
                   cleaningProducts: { 
                     needed: true, 
                     equipment: data.cleaningProducts.equipment 
                   } 
                 });
               }
             }}
             disabled={false}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <Droplets className="h-8 w-8 text-blue-500" />
            </div>
          </button>
          <button
             className={`group relative h-24 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
               data.cleaningProducts.equipment === true
                 ? 'border-primary bg-primary/5 shadow-xl'
                 : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
             }`}
             onClick={() => {
               const isCurrentlySelected = data.cleaningProducts.equipment === true;
               if (isCurrentlySelected) {
                 // Deselect equipment but keep products if selected
                 onUpdate({ 
                   cleaningProducts: { 
                     needed: data.cleaningProducts.needed,
                     equipment: false
                   } 
                 });
               } else {
                 // Select equipment
                 onUpdate({ 
                   cleaningProducts: { 
                     needed: data.cleaningProducts.needed,
                     equipment: true
                   } 
                 });
               }
             }}
            
          >
            <div className="flex flex-col items-center justify-center h-full">
              <Wrench className="h-8 w-8 text-gray-600" />
            </div>
          </button>
        </div>
      </div>

      {/* Equipment Arrangement */}
      {data.cleaningProducts.equipment && (
        <div className="p-2 rounded-2xl border border-border shadow-[0_16px_48px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.06)] bg-white transition-shadow duration-300">
          <h2 className="text-xl font-bold text-[#185166] mb-4">
            Equipment arrangement
          </h2>
          
          {/* Explanation */}
          <div className="mb-4 p-4 bg-muted/20 border border-muted-foreground/20 rounded-2xl">
            <p className="text-muted-foreground font-semibold">
              For Airbnb turnovers and regular bookings, we supply and keep equipment on site for ongoing service. For one-time cleaning only, we deliver equipment with a delivery charge.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              className={`group relative h-16 rounded-2xl border-2 transition-all duration-500 hover:scale-105 justify-start gap-3 p-4 flex items-center ${
                data.equipmentArrangement === 'ongoing'
                  ? 'border-primary bg-primary/5 shadow-xl'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
              }`}
              onClick={() => onUpdate({ equipmentArrangement: 'ongoing' })}
            >
              <CheckCircle className={`h-6 w-6 transition-all duration-500 ${
                data.equipmentArrangement === 'ongoing' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
              }`} />
              <span className={`text-base font-medium transition-colors ${
                data.equipmentArrangement === 'ongoing' ? 'text-primary' : 'text-slate-600 group-hover:text-primary'
              }`}>Ongoing</span>
            </button>
            
            <button
              className={`group relative h-16 rounded-2xl border-2 transition-all duration-500 hover:scale-105 justify-start gap-3 p-4 flex items-center ${
                data.equipmentArrangement === 'oneoff'
                  ? 'border-primary bg-primary/5 shadow-xl'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
              }`}
              onClick={() => onUpdate({ equipmentArrangement: 'oneoff' })}
            >
              <Zap className={`h-6 w-6 transition-all duration-500 ${
                data.equipmentArrangement === 'oneoff' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
              }`} />
              <span className={`text-base font-medium transition-colors ${
                data.equipmentArrangement === 'oneoff' ? 'text-primary' : 'text-slate-600 group-hover:text-primary'
              }`}>One-time</span>
            </button>
          </div>

          {data.equipmentArrangement === 'ongoing' && (
            <div className="mt-6 flex items-center justify-between p-4 bg-card rounded-lg border">
              <span className="text-sm font-medium">Dedicated space to store equipment on site</span>
              <Switch
                checked={!!data.equipmentStorageConfirmed}
                onCheckedChange={(checked) => onUpdate({ equipmentStorageConfirmed: checked })}
              />
            </div>
          )}
        </div>
      )}

      {/* Recommended Hours Section */}
      {canContinue && (
        <div className="bg-muted/10 border border-border rounded-lg p-4">
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Recommended Booking Time</h4>
              <p className="text-sm text-muted-foreground">
                Based on your property details and service type, we recommend this duration. You can adjust based on your specific needs.
              </p>
              
              {(data.serviceType === 'deep' || data.alreadyCleaned === false) && (
                <div className="text-amber-600 text-sm font-medium mt-2 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>Deep cleaning required - 30% extra time has been added</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center ml-6">
              <div className="flex items-center bg-card border border-border rounded-2xl p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary"
                  onClick={() => {
                    console.log('Minus button clicked, current hours:', data.estimatedHours || recommendedHours);
                    const currentHours = data.estimatedHours || recommendedHours;
                    const newHours = roundToNearestHalf(Math.max(currentHours - 0.5, 2));
                    console.log('Setting new hours to:', newHours);
                    onUpdate({ estimatedHours: newHours });
                  }}
                  disabled={(data.estimatedHours || recommendedHours) <= 2}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center mx-4">
                  <div className="text-lg font-semibold text-slate-600">
                    {(roundToNearestHalf(data.estimatedHours || recommendedHours) % 1 === 0 
                      ? roundToNearestHalf(data.estimatedHours || recommendedHours).toString() 
                      : roundToNearestHalf(data.estimatedHours || recommendedHours).toFixed(1))} hours
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary"
                  onClick={() => {
                    console.log('Plus button clicked, current hours:', data.estimatedHours || recommendedHours);
                    const currentHours = data.estimatedHours || recommendedHours;
                    const newHours = roundToNearestHalf(Math.min(currentHours + 0.5, 12));
                    console.log('Setting new hours to:', newHours);
                    onUpdate({ estimatedHours: newHours });
                  }}
                  disabled={(data.estimatedHours || recommendedHours) >= 12}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="block lg:hidden space-y-3">
            {/* Title */}
            <h4 className="text-sm font-semibold text-slate-700">Recommended Booking Time</h4>
            
            {/* Description */}
            <p className="text-sm text-muted-foreground">
              Based on your property details and service type, we recommend this duration. You can adjust based on your specific needs.
            </p>
            
            {/* Deep cleaning notification */}
            {(data.serviceType === 'deep' || data.alreadyCleaned === false) && (
              <div className="text-amber-600 text-sm font-medium flex items-center gap-1">
                <span>⚠️</span>
                <span>Deep cleaning required - 30% extra time has been added</span>
              </div>
            )}
            
            {/* Hour selector - full width */}
            <div className="flex items-center bg-card border border-border rounded-2xl p-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-12 w-12 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary"
                onClick={() => {
                  console.log('Minus button clicked, current hours:', data.estimatedHours || recommendedHours);
                  const currentHours = data.estimatedHours || recommendedHours;
                  const newHours = roundToNearestHalf(Math.max(currentHours - 0.5, 2));
                  console.log('Setting new hours to:', newHours);
                  onUpdate({ estimatedHours: newHours });
                }}
                disabled={(data.estimatedHours || recommendedHours) <= 2}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <div className="flex-1 text-center">
                <div className="text-lg font-semibold text-slate-600">
                  {(roundToNearestHalf(data.estimatedHours || recommendedHours) % 1 === 0 
                    ? roundToNearestHalf(data.estimatedHours || recommendedHours).toString() 
                    : roundToNearestHalf(data.estimatedHours || recommendedHours).toFixed(1))} hours
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-12 w-12 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary"
                onClick={() => {
                  console.log('Plus button clicked, current hours:', data.estimatedHours || recommendedHours);
                  const currentHours = data.estimatedHours || recommendedHours;
                  const newHours = roundToNearestHalf(Math.min(currentHours + 0.5, 12));
                  console.log('Setting new hours to:', newHours);
                  onUpdate({ estimatedHours: newHours });
                }}
                disabled={(data.estimatedHours || recommendedHours) >= 12}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end pt-6">
        <Button
          variant="default"
          size="lg"
          onClick={onNext}
          disabled={!canContinue}
          className="px-12"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export { PropertyStep };