import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { BookingData } from '../AirbnbBookingForm';
import { Home, Building, Plus, Minus, CheckCircle, Droplets, Wrench, X, BookOpen, Zap, Bed } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAirbnbFieldConfigs } from '@/hooks/useAirbnbFieldConfigs';
import { useAirbnbHardcodedCalculations } from '@/hooks/useAirbnbHardcodedCalculations';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface PropertyStepProps {
  data: BookingData;
  onUpdate: (updates: Partial<BookingData>) => void;
  onNext: () => void;
}

const PropertyStep: React.FC<PropertyStepProps> = ({ data, onUpdate, onNext }) => {
  // Fetch all dynamic configurations from database
  const { data: propertyTypeConfigs = [], isLoading: isLoadingPropertyTypes } = useAirbnbFieldConfigs('Property Type', true);
  const { data: bedroomConfigs = [], isLoading: isLoadingBedrooms } = useAirbnbFieldConfigs('Bedrooms', true);
  const { data: bathroomConfigs = [], isLoading: isLoadingBathrooms } = useAirbnbFieldConfigs('Bathrooms', true);
  const { data: additionalRoomsConfigs = [], isLoading: isLoadingAdditionalRooms } = useAirbnbFieldConfigs('Additional Rooms', true);
  const { data: propertyFeatureConfigs = [], isLoading: isLoadingFeatures } = useAirbnbFieldConfigs('Property Features', true);
  const { data: serviceTypeConfigs = [], isLoading: isLoadingServiceTypes } = useAirbnbFieldConfigs('Service Type', true);
  const { data: cleaningHistoryConfigs = [], isLoading: isLoadingHistory } = useAirbnbFieldConfigs('Cleaning History', true);
  const { data: ovenCleaningConfigs = [], isLoading: isLoadingOvenCleaning } = useAirbnbFieldConfigs('Oven Cleaning', true);
  const { data: cleaningSuppliesConfigs = [], isLoading: isLoadingSupplies } = useAirbnbFieldConfigs('Cleaning Supplies', true);
  const { data: equipmentArrangementConfigs = [], isLoading: isLoadingEquipment } = useAirbnbFieldConfigs('Equipment Arrangement', true);

  const isLoadingConfigs = isLoadingPropertyTypes || isLoadingBedrooms || isLoadingBathrooms || 
    isLoadingAdditionalRooms || isLoadingFeatures || isLoadingServiceTypes || isLoadingHistory || 
    isLoadingOvenCleaning || isLoadingSupplies || isLoadingEquipment;

  // Helper function to render icon (Lucide or emoji)
  const renderIcon = (iconName: string | null, className: string = "h-6 w-6") => {
    if (!iconName) return null;
    
    // Check if it's an emoji (single character or emoji pattern)
    if (iconName.length <= 2 || /\p{Emoji}/u.test(iconName)) {
      return <span className="text-2xl">{iconName}</span>;
    }
    
    // Otherwise treat as Lucide icon name
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) return null;
    return <IconComponent className={className} />;
  };

  // Build a public URL from Supabase storage path
  const getIconUrl = (storagePath?: string | null): string | null => {
    if (!storagePath) return null;
    if (storagePath.startsWith('http')) return storagePath;
    const [bucket, ...parts] = storagePath.split('/');
    if (!bucket || parts.length === 0) return null;
    const path = parts.join('/');
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || null;
  };

  // Prefer uploaded icon from storage; fallback to Lucide/emoji name
  const renderFeatureIcon = (feature: any, className: string = "h-6 w-6") => {
    const url = getIconUrl(feature?.icon_storage_path);
    const size = feature?.icon_size || 24;
    if (url) {
      return (
        <img
          src={url}
          alt={feature?.label || 'feature icon'}
          width={size}
          height={size}
          className={className}
          loading="lazy"
        />
      );
    }
    return renderIcon(feature?.icon, className);
  };
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

  // Use hardcoded calculations - ONLY for display, don't update bookingData.estimatedHours here
  const calculations = useAirbnbHardcodedCalculations(data);
  const recommendedHours = calculations.baseTime;
  const [searchParams] = useSearchParams();
  const showDebug = searchParams.get('debug') === '1';
  
  const canContinue = data.propertyType && data.bedrooms && data.bathrooms && data.serviceType && 
    (data.cleaningProducts !== 'equipment' || 
     (data.equipmentArrangement !== null && 
      (data.equipmentArrangement !== 'ongoing' || data.equipmentStorageConfirmed)));

  // Reset alreadyCleaned when serviceType is not checkin-checkout
  React.useEffect(() => {
    if (data.serviceType && data.serviceType !== 'checkin-checkout' && data.alreadyCleaned !== null && data.alreadyCleaned !== undefined) {
      onUpdate({ alreadyCleaned: null });
    }
  }, [data.serviceType]);

  // Auto-select cleaning products for deep cleaning or uncleaned properties
  React.useEffect(() => {
    if (data.serviceType === 'deep' || data.alreadyCleaned === false) {
      if (data.cleaningProducts === 'no' || !data.cleaningProducts) {
        onUpdate({ cleaningProducts: 'products' });
      }
    }
  }, [data.serviceType, data.alreadyCleaned, data.cleaningProducts]);

  // Reset estimatedHours to null when key property fields change (so it recalculates)
  React.useEffect(() => {
    // Only reset if user has manually changed estimatedHours AND core fields changed
    if (data.estimatedHours !== null) {
      onUpdate({ estimatedHours: null });
    }
  }, [data.propertyType, data.bedrooms, data.bathrooms, data.serviceType]);

  // Update estimatedHours when recommendedHours (baseTime) changes
  React.useEffect(() => {
    if (recommendedHours > 0 && data.estimatedHours === null) {
      onUpdate({ estimatedHours: recommendedHours });
    }
  }, [recommendedHours, data.estimatedHours]);

  return (
    <div className="space-y-6">
      {isLoadingConfigs && (
        <div className="p-2 rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.18)] bg-white transition-shadow duration-300">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-muted rounded-2xl"></div>
              <div className="h-16 bg-muted rounded-2xl"></div>
            </div>
          </div>
        </div>
      )}
      <div className="relative z-10 p-2 rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.18)] bg-white transition-shadow duration-300">
        <h2 className="text-2xl font-bold text-slate-700 mb-4">
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
                <span className={`text-sm font-semibold transition-colors ${
                  isSelected ? 'text-primary' : 'text-slate-700 group-hover:text-primary'
                }`}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Size of the property */}
      <div className="relative z-[9] p-2 rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.18)] bg-white transition-shadow duration-300">
        <h2 className="text-2xl font-bold text-slate-700 mb-4">
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
                <div className="text-sm font-semibold text-slate-700">
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
                  <div className="text-sm font-semibold text-slate-700">
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

      {/* Additional Rooms - Dynamic Icons */}
      {data.bedrooms && !['studio', '1'].includes(data.bedrooms) && additionalRoomsConfigs.length > 0 && (
        <div className="p-4 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] bg-white hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)] transition-shadow duration-300">
          <h2 className="text-2xl font-bold text-slate-700 mb-4">
            Additional rooms
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            {additionalRoomsConfigs.map((room: any) => {
              const currentCount = data.additionalRooms[room.option as keyof typeof data.additionalRooms] || 0;
              const maxValue = room.max_value || 6;
              const IconComponent = (LucideIcons as any)[room.icon];
              
              return (
                <button
                  key={room.option}
                  className={`group relative ${currentCount > 0 ? 'h-32' : 'h-24'} rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                    currentCount > 0
                      ? 'border-primary bg-primary/5 shadow-xl'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
                  }`}
                  onClick={() => {
                    if (currentCount === 0) {
                      onUpdate({
                        additionalRooms: {
                          ...data.additionalRooms,
                          [room.option]: 1
                        }
                      });
                    }
                  }}
                >
                  {currentCount === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      {IconComponent && (
                        <IconComponent className="h-6 w-6 mb-2 text-muted-foreground group-hover:text-primary transition-all duration-500" />
                      )}
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-primary">
                        {room.label}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-2">
                      {IconComponent && (
                        <IconComponent className="h-5 w-5 mb-1 text-primary" />
                      )}
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
                            if (currentCount > 0) {
                              onUpdate({
                                additionalRooms: {
                                  ...data.additionalRooms,
                                  [room.option]: currentCount - 1
                                }
                              });
                            }
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="flex-1 text-center mx-1">
                          <div className="text-lg font-bold text-primary">
                            {currentCount}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentCount < maxValue) {
                              onUpdate({
                                additionalRooms: {
                                  ...data.additionalRooms,
                                  [room.option]: currentCount + 1
                                }
                              });
                            }
                          }}
                          disabled={currentCount >= maxValue}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Property Features */}
      <div className="relative z-[8] p-2 rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.18)] bg-white transition-shadow duration-300">
        <h2 className="text-2xl font-bold text-slate-700 mb-4">
          Property Features
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {propertyFeatureConfigs.filter((feat: any) => feat.option !== 'numberOfFloors').map((feature: any) => {
            const isSelected = feature.option === 'separateKitchenLivingRoom' 
              ? (data.propertyFeatures.separateKitchen || data.propertyFeatures.livingRoom)
              : data.propertyFeatures[feature.option as keyof typeof data.propertyFeatures];
            
            return (
              <button
                key={feature.option}
                className={`group relative h-24 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-xl'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
                }`}
                onClick={() => {
                  if (feature.option === 'separateKitchenLivingRoom') {
                    const newValue = !(data.propertyFeatures.separateKitchen || data.propertyFeatures.livingRoom);
                    onUpdate({
                      propertyFeatures: {
                        ...data.propertyFeatures,
                        separateKitchen: newValue,
                        livingRoom: newValue
                      }
                    });
                  } else {
                    onUpdate({
                      propertyFeatures: {
                        ...data.propertyFeatures,
                        [feature.option]: !data.propertyFeatures[feature.option as keyof typeof data.propertyFeatures]
                      }
                    });
                  }
                }}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className={`mb-2 transition-all duration-500 ${
                    isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                  }`}>
                    {renderFeatureIcon(feature, `h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`)}
                  </div>
                  <span className={`text-sm font-semibold transition-colors ${
                    isSelected ? 'text-primary' : 'text-slate-700 group-hover:text-primary'
                  }`}>{feature.label}</span>
                </div>
              </button>
            );
          })}

          {/* Number of Floors - Dynamic from Database */}
          {propertyFeatureConfigs.find((feat: any) => feat.option === 'numberOfFloors') && (() => {
            const floorsConfig = propertyFeatureConfigs.find((feat: any) => feat.option === 'numberOfFloors');
            const IconComponent = (LucideIcons as any)[floorsConfig.icon];
            const maxFloors = floorsConfig.max_value || 10;
            
            return (
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
                    {IconComponent && <IconComponent className="h-5 w-5 text-primary mb-1" />}
                    <span className="text-xs font-bold text-primary mb-2">
                      {floorsConfig.label}
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
                          if (data.numberOfFloors < maxFloors) {
                            onUpdate({ numberOfFloors: data.numberOfFloors + 1 });
                          }
                        }}
                        disabled={data.numberOfFloors >= maxFloors}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    {IconComponent && <IconComponent className="h-6 w-6 mb-2 text-muted-foreground group-hover:text-primary transition-all duration-500" />}
                    <span className={`text-sm font-semibold transition-colors ${
                      data.numberOfFloors > 0 ? 'text-primary' : 'text-slate-700 group-hover:text-primary'
                    }`}>{floorsConfig.label}</span>
                  </div>
                )}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Service Type - Dynamic */}
      <div className="relative z-[7] p-2 rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.18)] bg-white transition-shadow duration-300">
        <h2 className="text-2xl font-bold text-slate-700 mb-4">
          Choose your service
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {serviceTypeConfigs.map((service: any) => (
            <button
              key={service.option}
              className={`group relative h-24 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                data.serviceType === service.option
                  ? 'border-primary bg-primary/5 shadow-xl'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
              }`}
              onClick={() => onUpdate({ serviceType: data.serviceType === service.option ? '' : service.option as any })}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div className="mb-2">
                  {renderIcon(service.icon, `transition-all duration-500 ${
                    data.serviceType === service.option ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                  }`)}
                </div>
                <span className={`text-sm font-semibold transition-colors ${
                  data.serviceType === service.option ? 'text-primary' : 'text-slate-700 group-hover:text-primary'
                }`}>{service.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Property Already Cleaned - Dynamic */}
      {data.serviceType === 'checkin-checkout' && cleaningHistoryConfigs.length > 0 && (
        <div className="relative z-[6] p-2 rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.18)] bg-white transition-shadow duration-300">
          <h2 className="text-2xl font-bold text-slate-700 mb-4">
            Has the property been cleaned to Airbnb standard already?
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {cleaningHistoryConfigs.map((option: any) => {
              const isSelected = (option.option === 'yes' && data.alreadyCleaned === true) || 
                               (option.option === 'no' && data.alreadyCleaned === false);
              const IconComponent = (LucideIcons as any)[option.icon];
              
              return (
                <button
                  key={option.option}
                  className={`group relative h-16 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-xl'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
                  }`}
                  onClick={() => onUpdate({ 
                    alreadyCleaned: isSelected ? null : (option.option === 'yes' ? true : false)
                  })}
                >
                  <div className="flex items-center justify-center gap-2 h-full">
                    {IconComponent && (
                      <IconComponent className={`h-5 w-5 transition-all duration-500 ${
                        isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                      }`} />
                    )}
                    <span className={`text-sm font-semibold transition-colors ${
                      isSelected ? 'text-primary' : 'text-slate-700 group-hover:text-primary'
                    }`}>{option.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Oven Cleaning - Combined */}
      {(data.serviceType === 'deep' || data.alreadyCleaned === false) && ovenCleaningConfigs.length > 0 && (
        <div className="relative z-[5] p-2 rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.18)] bg-white transition-shadow duration-300">
          <h2 className="text-2xl font-bold text-slate-700 mb-4">
            Do you require oven cleaning?
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {ovenCleaningConfigs.map((oven: any) => {
              const isSelected = data.ovenType === oven.option;
              const IconComponent = (LucideIcons as any)[oven.icon];
              
              return (
                <button
                  key={oven.option}
                  className={`group relative h-20 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-xl'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
                  }`}
                  onClick={() => onUpdate({ ovenType: isSelected ? '' : oven.option as any })}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    {IconComponent && (
                      <IconComponent className={`h-6 w-6 mb-1 transition-all duration-500 ${
                        isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                      }`} />
                    )}
                    <span className={`text-sm font-semibold transition-colors ${
                      isSelected ? 'text-primary' : 'text-slate-700 group-hover:text-primary'
                    }`}>{oven.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Cleaning Supplies - Dynamic */}
      {cleaningSuppliesConfigs.length > 0 && (
        <div className="relative z-[4] p-2 rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.18)] bg-white transition-shadow duration-300">
          <h2 className="text-2xl font-bold text-slate-700 mb-4">
            Cleaning supplies
          </h2>
          
          <div className="grid grid-cols-3 gap-4">
            {cleaningSuppliesConfigs.map((supply: any) => {
              const isSelected = data.cleaningProducts === supply.option;
              const isDisabled = (supply.option === 'no') && (data.serviceType === 'deep' || data.alreadyCleaned === false);
              
              return (
                <button
                  key={supply.option}
                  className={`group relative h-24 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-xl'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
                  }`}
                  onClick={() => onUpdate({ 
                    cleaningProducts: isSelected ? '' : supply.option 
                  })}
                  disabled={isDisabled}
                >
                  <div className="flex flex-col items-center justify-center h-full relative">
                    <div className={`mb-2 transition-all duration-500 ${
                      isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                    }`}>
                      {renderIcon(supply.icon, 'h-8 w-8')}
                    </div>
                    <span className={`text-sm font-semibold transition-colors ${
                      isSelected ? 'text-primary' : 'text-slate-700 group-hover:text-primary'
                    }`}>{supply.label}</span>
                    {isDisabled && (
                      <div className="absolute inset-0 bg-muted/80 rounded-2xl flex items-center justify-center">
                        <span className="text-xs text-muted-foreground font-semibold">Not available</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Equipment Arrangement - Dynamic */}
      {data.cleaningProducts === 'equipment' && equipmentArrangementConfigs.length > 0 && (
        <div className="relative z-[3] p-2 rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.18)] bg-white transition-shadow duration-300">
          <h2 className="text-2xl font-bold text-slate-700 mb-2">
            Equipment arrangement
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Choose whether you need equipment on an ongoing basis (stored at the property) or as a one-time delivery for this booking.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            {equipmentArrangementConfigs.map((arrangement: any) => {
              const isSelected = data.equipmentArrangement === arrangement.option;
              
              return (
                <button
                  key={arrangement.option}
                  className={`group relative h-16 rounded-2xl border-2 transition-all duration-500 hover:scale-105 justify-start gap-3 p-4 flex items-center ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-xl'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
                  }`}
                  onClick={() => onUpdate({ equipmentArrangement: arrangement.option })}
                >
                  <div className={`transition-all duration-500 ${
                    isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                  }`}>
                    {renderIcon(arrangement.icon, 'h-6 w-6')}
                  </div>
                  <span className={`text-sm font-semibold transition-colors ${
                    isSelected ? 'text-primary' : 'text-slate-700 group-hover:text-primary'
                  }`}>{arrangement.label}</span>
                </button>
              );
            })}
          </div>

          {data.equipmentArrangement === 'ongoing' && (
            <div className="mt-6 p-4 bg-card rounded-lg border space-y-2">
              <p className="text-sm text-muted-foreground">
                For ongoing equipment, please confirm there is a dedicated space at the property to store vacuum, mop and supplies between visits.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Dedicated space to store equipment on site</span>
                <Switch
                  checked={!!data.equipmentStorageConfirmed}
                  onCheckedChange={(checked) => onUpdate({ equipmentStorageConfirmed: checked })}
                />
              </div>
              {!data.equipmentStorageConfirmed && (
                <p className="text-xs text-destructive">Please confirm there is a dedicated storage space to continue.</p>
              )}
            </div>
          )}

          {data.equipmentArrangement === 'oneoff' && (
            <div className="mt-6 p-4 bg-card rounded-lg border">
              <p className="text-sm text-muted-foreground">
                We will bring equipment for this visit. A one-time delivery and collection fee will be added. No storage is required.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recommended Hours - Show after basic selections are made */}
      {data.propertyType && data.bedrooms && data.bathrooms && data.serviceType && (
        <div className="relative z-[4] p-4 rounded-2xl border-2 border-primary/30 shadow-[0_12px_32px_rgba(0,0,0,0.2)] bg-gradient-to-br from-white to-primary/5 transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.25)] hover:border-primary/50">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-700">Estimated Cleaning Time</h2>
              <p className="text-xs text-muted-foreground mt-1">This is an estimate based on your selections. You can adjust it.</p>
            </div>
            <div className="flex items-center bg-card border border-border rounded-2xl p-2 w-full sm:w-auto sm:max-w-[280px]">
              <Button
                variant="ghost"
                size="sm"
              className="h-11 w-11 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex-shrink-0"
              onClick={() => {
                  const current = (data.estimatedHours ?? recommendedHours);
                  const newValue = Math.max(0, current - 0.5);
                  onUpdate({ estimatedHours: newValue });
                }}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <div className="flex-1 text-center min-w-[90px]">
                <div className="text-lg font-bold text-slate-600" style={{ paddingLeft: '7px', paddingRight: '7px' }}>
                  {(data.estimatedHours ?? recommendedHours)}h
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-11 w-11 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary"
              onClick={() => {
                  const current = (data.estimatedHours ?? recommendedHours);
                  const newValue = Math.max(0, current + 0.5);
                  onUpdate({ estimatedHours: newValue });
                }}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Debug Panel - visible only with ?debug=1 */}
      {showDebug && (
        <div className="mt-4 p-3 rounded-md border border-dashed text-xs font-mono overflow-x-auto bg-white">
          <details open>
            <summary className="cursor-pointer font-semibold">Booking Calculations Debug</summary>
            <pre className="whitespace-pre-wrap">{JSON.stringify(calculations, null, 2)}</pre>
          </details>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end pt-6">
        <Button
          variant="default"
          size="lg"
          onClick={onNext}
          disabled={!canContinue}
          className="px-12 bg-[#185166] hover:bg-[#185166]/90 text-white"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export { PropertyStep };