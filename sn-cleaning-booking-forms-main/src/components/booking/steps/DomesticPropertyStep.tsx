import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { DomesticBookingData } from '../DomesticBookingForm';
import { Home, Building, Plus, Minus, CheckCircle, Droplets, Wrench, AlertCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAirbnbFieldConfigsBatch } from '@/hooks/useAirbnbFieldConfigs';
import { useDomesticHardcodedCalculations } from '@/hooks/useDomesticHardcodedCalculations';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
interface DomesticPropertyStepProps {
  data: DomesticBookingData;
  onUpdate: (updates: Partial<DomesticBookingData>) => void;
  onNext: () => void;
  isAdminMode?: boolean;
}
export const DomesticPropertyStep: React.FC<DomesticPropertyStepProps> = ({
  data,
  onUpdate,
  onNext,
  isAdminMode = false
}) => {
  // Fetch all dynamic configurations from database
  const {
    data: allConfigs,
    isLoading: isLoadingConfigs
  } = useAirbnbFieldConfigsBatch(['Property Type', 'Bedrooms', 'Bathrooms', 'Additional Rooms', 'Property Features', 'Domestic Service Frequency', 'Oven Cleaning', 'Cleaning Supplies', 'Equipment Arrangement'], true);
  const propertyTypeConfigs = allConfigs?.['Property Type'] || [];
  const bedroomConfigs = allConfigs?.['Bedrooms'] || [];
  const bathroomConfigs = allConfigs?.['Bathrooms'] || [];
  const additionalRoomsConfigs = allConfigs?.['Additional Rooms'] || [];
  const propertyFeatureConfigs = allConfigs?.['Property Features'] || [];
  const serviceFrequencyConfigs = allConfigs?.['Domestic Service Frequency'] || [];
  const ovenCleaningConfigs = allConfigs?.['Oven Cleaning'] || [];
  const cleaningSuppliesConfigs = allConfigs?.['Cleaning Supplies'] || [];
  const equipmentArrangementConfigs = allConfigs?.['Equipment Arrangement'] || [];
  const getBedroomLabel = (value: string) => {
    if (value === 'studio') return 'Studio';
    if (value === '6+') return '6+ Bedrooms';
    return `${value} Bedroom${parseInt(value) > 1 ? 's' : ''}`;
  };
  const incrementBedrooms = () => {
    const current = data.bedrooms;
    if (!current) {
      onUpdate({
        bedrooms: 'studio'
      });
    } else if (current === 'studio') {
      onUpdate({
        bedrooms: '1'
      });
    } else if (current === '6+') {
      return;
    } else {
      const num = parseInt(current);
      onUpdate({
        bedrooms: num >= 5 ? '6+' : (num + 1).toString()
      });
    }
  };
  const decrementBedrooms = () => {
    const current = data.bedrooms;
    if (!current || current === '1') {
      onUpdate({
        bedrooms: 'studio'
      });
    } else if (current === 'studio') {
      return;
    } else if (current === '6+') {
      onUpdate({
        bedrooms: '5'
      });
    } else {
      const num = parseInt(current);
      onUpdate({
        bedrooms: num > 1 ? (num - 1).toString() : 'studio'
      });
    }
  };
  const incrementBathrooms = () => {
    const current = parseInt(data.bathrooms || '0');
    if (current >= 6) return;
    onUpdate({
      bathrooms: current >= 5 ? '6+' : (current + 1).toString()
    });
  };
  const decrementBathrooms = () => {
    const current = data.bathrooms;
    if (!current || current === '1') return;
    if (current === '6+') {
      onUpdate({
        bathrooms: '5'
      });
    } else {
      const num = parseInt(current);
      onUpdate({
        bathrooms: num > 1 ? (num - 1).toString() : '1'
      });
    }
  };
  const calculations = useDomesticHardcodedCalculations(data);
  const recommendedHours = calculations.baseTime;
  const [searchParams] = useSearchParams();
  const showDebug = searchParams.get('debug') === '1';
  const { toast } = useToast();
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  
  // Individual field validation
  const validationErrors = {
    propertyType: !data.propertyType,
    bedrooms: !data.bedrooms,
    bathrooms: !data.bathrooms,
    serviceFrequency: !data.serviceFrequency,
    equipmentArrangement: data.cleaningProducts.includes('equipment') && data.equipmentArrangement === null,
    equipmentStorageConfirmed: data.cleaningProducts.includes('equipment') && data.equipmentArrangement === 'ongoing' && !data.equipmentStorageConfirmed
  };
  
  const canContinue = !validationErrors.propertyType && !validationErrors.bedrooms && !validationErrors.bathrooms && !validationErrors.serviceFrequency && !validationErrors.equipmentArrangement && !validationErrors.equipmentStorageConfirmed;
  
  const [hasInitialized, setHasInitialized] = React.useState(false);
  React.useEffect(() => {
    if (recommendedHours > 0 && !hasInitialized) {
      if (data.estimatedHours === null || data.estimatedHours === 0) {
        onUpdate({
          estimatedHours: recommendedHours
        });
        setHasInitialized(true);
      } else if (data.estimatedHours !== recommendedHours) {
        setHasInitialized(true);
      }
    }
  }, [recommendedHours]);
  
  const handleContinue = () => {
    if (!canContinue) {
      setShowValidationErrors(true);
      
      // Build error message
      const missingFields: string[] = [];
      if (validationErrors.propertyType) missingFields.push('property type');
      if (validationErrors.bedrooms) missingFields.push('bedrooms');
      if (validationErrors.bathrooms) missingFields.push('bathrooms');
      if (validationErrors.serviceFrequency) missingFields.push('cleaning frequency');
      if (validationErrors.equipmentArrangement) missingFields.push('equipment arrangement');
      if (validationErrors.equipmentStorageConfirmed) missingFields.push('equipment storage confirmation');
      
      toast({
        title: "Please complete all required fields",
        description: `Missing: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      
      // Scroll to first missing field
      if (validationErrors.propertyType) {
        document.getElementById('property-type-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (validationErrors.bedrooms || validationErrors.bathrooms) {
        document.getElementById('property-size-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (validationErrors.serviceFrequency) {
        document.getElementById('frequency-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    if (data.estimatedHours === null && recommendedHours > 0) {
      onUpdate({
        estimatedHours: recommendedHours
      });
    }
    onNext();
  };
  return <div className="space-y-6">
      {isLoadingConfigs && <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-muted rounded-2xl"></div>
              <div className="h-16 bg-muted rounded-2xl"></div>
            </div>
          </div>
        </div>}

      {/* Property Type */}
      <div className="relative z-10" id="property-type-section">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold text-slate-700">Property Details</h2>
          {showValidationErrors && validationErrors.propertyType && (
            <span className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Required
            </span>
          )}
        </div>
        <div className={`grid grid-cols-2 gap-4 ${showValidationErrors && validationErrors.propertyType ? 'ring-2 ring-destructive ring-offset-2 rounded-2xl' : ''}`}>
          {(propertyTypeConfigs.length > 0 ? propertyTypeConfigs : [{
          option: 'flat',
          label: 'Flat'
        }, {
          option: 'house',
          label: 'House'
        }]).map((opt: any) => {
          const isSelected = data.propertyType === opt.option;
          const isHouse = opt.option === 'house';
          return <button key={opt.option} className={`group relative h-16 rounded-2xl border transition-all duration-300 justify-start gap-3 p-4 flex items-center ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`} onClick={() => onUpdate({
            propertyType: isSelected ? '' : opt.option
          })}>
                {isHouse ? <Home className={`h-6 w-6 transition-all duration-500 ${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} /> : <Building className={`h-6 w-6 transition-all duration-500 ${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />}
                <span className={`text-base font-bold transition-colors ${isSelected ? 'text-primary' : 'text-slate-500 group-hover:text-primary'}`}>{opt.label}</span>
              </button>;
        })}
        </div>
      </div>

      {/* Property Size */}
      <div className="relative z-[9]" id="property-size-section">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold text-slate-700">Size of the property</h2>
          {showValidationErrors && (validationErrors.bedrooms || validationErrors.bathrooms) && (
            <span className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {validationErrors.bedrooms && validationErrors.bathrooms ? 'Select bedrooms and bathrooms' : validationErrors.bedrooms ? 'Select bedrooms' : 'Select bathrooms'}
            </span>
          )}
        </div>
        
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-2 ${showValidationErrors && (validationErrors.bedrooms || validationErrors.bathrooms) ? 'ring-2 ring-destructive ring-offset-2 rounded-2xl p-2' : ''}`}>
          {/* Bedrooms */}
          <div>
            <div className="flex items-center justify-center">
              <div className={`flex items-center rounded-2xl p-2 w-full transition-all duration-300 ${data.bedrooms ? 'bg-primary/5 border border-primary' : showValidationErrors && validationErrors.bedrooms ? 'bg-destructive/5 border border-destructive' : 'bg-card border border-border'}`}>
                <Button variant="ghost" size="sm" className="h-12 w-12 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary" onClick={decrementBedrooms} disabled={!data.bedrooms || data.bedrooms === 'studio'}>
                  <Minus className="h-5 w-5" />
                </Button>
                <div className="flex-1 text-center">
                  <div className={`text-base font-bold transition-colors ${data.bedrooms ? 'text-primary' : 'text-slate-400'}`}>
                    {data.bedrooms ? getBedroomLabel(data.bedrooms) : 'Bedrooms'}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-12 w-12 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary" onClick={incrementBedrooms} disabled={data.bedrooms === '6+'}>
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bathrooms */}
          <div>
            <div className="flex items-center justify-center">
              <div className={`flex items-center rounded-2xl p-2 w-full transition-all duration-300 ${data.bathrooms ? 'bg-primary/5 border border-primary' : showValidationErrors && validationErrors.bathrooms ? 'bg-destructive/5 border border-destructive' : 'bg-card border border-border'}`}>
                <Button variant="ghost" size="sm" className="h-12 w-12 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary" onClick={decrementBathrooms} disabled={!data.bathrooms || data.bathrooms === '1'}>
                  <Minus className="h-5 w-5" />
                </Button>
                <div className="flex-1 text-center">
                  <div className={`text-base font-bold transition-colors ${data.bathrooms ? 'text-primary' : 'text-slate-400'}`}>
                    {data.bathrooms ? `${data.bathrooms} Bathroom${data.bathrooms !== '1' && data.bathrooms !== '6+' && parseInt(data.bathrooms) > 1 ? 's' : data.bathrooms === '6+' ? 's' : ''}` : 'Bathrooms'}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-12 w-12 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary" onClick={incrementBathrooms} disabled={data.bathrooms === '6+'}>
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Rooms */}
      {data.bedrooms && !['studio', '1'].includes(data.bedrooms) && additionalRoomsConfigs.length > 0 && <div>
          <h2 className="text-2xl font-bold text-slate-700 mb-4">Additional rooms</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            {additionalRoomsConfigs.map((room: any) => {
          const currentCount = data.additionalRooms[room.option as keyof typeof data.additionalRooms] || 0;
          const maxValue = room.max_value || 6;
          const IconComponent = (LucideIcons as any)[room.icon];
          return <button key={room.option} className={`group relative ${currentCount > 0 ? 'h-32' : 'h-24'} rounded-2xl border transition-all duration-300 ${currentCount > 0 ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`} onClick={() => {
            if (currentCount === 0) {
              onUpdate({
                additionalRooms: {
                  ...data.additionalRooms,
                  [room.option]: 1
                }
              });
            }
          }}>
                  {currentCount === 0 ? <div className="flex flex-col items-center justify-center h-full">
                      {IconComponent && <IconComponent className="h-6 w-6 mb-2 text-muted-foreground group-hover:text-primary transition-all duration-500" />}
                      <span className="text-base font-bold text-slate-500 group-hover:text-primary">
                        {room.label}
                      </span>
                    </div> : <div className="flex flex-col items-center justify-center h-full p-2">
                      {IconComponent && <IconComponent className="h-5 w-5 mb-1 text-primary" />}
                      <span className="text-xs font-bold text-primary mb-2">
                        {room.label}
                      </span>
                      <div className="flex items-center w-full">
                        <Button variant="ghost" size="sm" className="h-6 w-6 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary" onClick={e => {
                  e.stopPropagation();
                  if (currentCount > 0) {
                    onUpdate({
                      additionalRooms: {
                        ...data.additionalRooms,
                        [room.option]: currentCount - 1
                      }
                    });
                  }
                }}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="flex-1 text-center mx-1">
                          <div className="text-lg font-bold text-primary">
                            {currentCount}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary" onClick={e => {
                  e.stopPropagation();
                  if (currentCount < maxValue) {
                    onUpdate({
                      additionalRooms: {
                        ...data.additionalRooms,
                        [room.option]: currentCount + 1
                      }
                    });
                  }
                }} disabled={currentCount >= maxValue}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>}
                </button>;
        })}
          </div>
        </div>}

      {/* Service Frequency */}
      <div id="frequency-section">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold text-slate-700">How often do you need cleaning?</h2>
          {showValidationErrors && validationErrors.serviceFrequency && (
            <span className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Required
            </span>
          )}
        </div>
        
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${showValidationErrors && validationErrors.serviceFrequency ? 'ring-2 ring-destructive ring-offset-2 rounded-2xl p-2' : ''}`}>
          {(serviceFrequencyConfigs.length > 0 ? serviceFrequencyConfigs : [{
          option: 'weekly',
          label: 'Weekly'
        }, {
          option: 'biweekly',
          label: 'Bi-Weekly'
        }, {
          option: 'monthly',
          label: 'Monthly'
        }, {
          option: 'onetime',
          label: 'One-time'
        }]).map((opt: any) => {
          const isSelected = data.serviceFrequency === opt.option;
          return <button key={opt.option} className={`group relative h-20 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`} onClick={() => onUpdate({
            serviceFrequency: isSelected ? '' : opt.option,
            daysPerWeek: opt.option === 'weekly' ? data.daysPerWeek || 1 : 1,
            wantsFirstDeepClean: opt.option === 'onetime' ? false : data.wantsFirstDeepClean
          })}>
                {isSelected && <CheckCircle className="h-5 w-5 text-primary mb-1" />}
                <span className={`text-base font-bold transition-colors ${isSelected ? 'text-primary' : 'text-slate-500 group-hover:text-primary'}`}>{opt.label}</span>
              </button>;
        })}
        </div>

        {/* Days per week selector - only show when weekly is selected */}
        {data.serviceFrequency === 'weekly' && <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border">
            <h3 className="text-lg font-semibold text-slate-700 mb-3">How many days a week?</h3>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(days => {
            const isSelected = data.daysPerWeek === days;
            return <button key={days} className={`h-12 rounded-xl border transition-all duration-300 flex items-center justify-center ${isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'}`} onClick={() => onUpdate({
              daysPerWeek: days
            })}>
                    <span className={`text-lg font-bold ${isSelected ? 'text-primary' : 'text-slate-500'}`}>{days}</span>
                  </button>;
          })}
            </div>
            
          </div>}
      </div>

      {/* Estimated Cleaning Time - Show as soon as hours are calculated (same as summary) */}
      {(calculations.totalHours ?? 0) > 0 && <div className="relative z-[3]">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-700">Estimated Cleaning Time</h2>
              <p className="text-xs text-muted-foreground mt-1">This is calculated based on your property size. You know your home best, so feel free to adjust the hours if needed.</p>
            </div>
            <div className="flex items-center bg-card border border-border rounded-2xl p-2 w-full sm:w-auto sm:max-w-[280px]">
              <Button variant="ghost" size="sm" className="h-11 w-11 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex-shrink-0" onClick={() => {
            const current = data.estimatedHours ?? recommendedHours;
            const newValue = Math.max(2, current - 0.5);
            onUpdate({
              estimatedHours: newValue
            });
          }} disabled={(data.estimatedHours ?? recommendedHours) <= 2}>
                <Minus className="h-5 w-5" />
              </Button>
              <div className="flex-1 text-center min-w-[90px]">
                <div className="text-lg font-bold text-slate-600" style={{
              paddingLeft: '7px',
              paddingRight: '7px'
            }}>
                  {data.estimatedHours ?? recommendedHours}h
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-11 w-11 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary" onClick={() => {
            const current = data.estimatedHours ?? recommendedHours;
            const newValue = current + 0.5;
            onUpdate({
              estimatedHours: newValue
            });
          }}>
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>}

      {/* First Deep Clean Option - only show for recurring bookings, after hours selection */}
      {data.serviceFrequency && data.serviceFrequency !== 'onetime' && (calculations.totalHours ?? 0) > 0 && (
        <div className="p-4 bg-muted/30 rounded-xl border border-border">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg mt-0.5">
              <LucideIcons.Sparkles className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-700">Start with a Deep Clean?</h3>
              <p className="text-sm text-slate-600 mt-1 mb-3">
                A deep clean can take longer and ensures your home is thoroughly cleaned before regular maintenance begins.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={`p-3 rounded-xl border transition-all duration-300 text-center ${
                    data.wantsFirstDeepClean
                      ? 'border-amber-500 bg-amber-100'
                      : 'border-border bg-white hover:border-amber-300'
                  }`}
                  onClick={() => {
                    // When enabling, set default extra hours if not already set
                    const defaultExtra = calculations.defaultDeepCleanExtraHours || Math.round((calculations.totalHours || 0) * 0.5 * 2) / 2;
                    onUpdate({ 
                      wantsFirstDeepClean: true,
                      firstDeepCleanExtraHours: data.firstDeepCleanExtraHours || defaultExtra
                    });
                  }}
                >
                  <span className={`text-sm font-bold ${data.wantsFirstDeepClean ? 'text-amber-700' : 'text-slate-600'}`}>
                    Yes, deep clean first
                  </span>
                </button>
                <button
                  className={`p-3 rounded-xl border transition-all duration-300 text-center ${
                    !data.wantsFirstDeepClean
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-white hover:border-primary/30'
                  }`}
                  onClick={() => onUpdate({ wantsFirstDeepClean: false, firstDeepCleanExtraHours: 0 })}
                >
                  <span className={`text-sm font-bold ${!data.wantsFirstDeepClean ? 'text-primary' : 'text-slate-600'}`}>
                    No, regular clean
                  </span>
                </button>
              </div>
              
              {/* Extra Hours Adjustment - Only show when deep clean is selected */}
              {data.wantsFirstDeepClean && (
                <div className="mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-base font-bold text-slate-700">Extra Time for First Clean</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        First clean will be {calculations.firstDeepCleanHours}h (regular {calculations.totalHours}h + extra time)
                      </p>
                    </div>
                    <div className="flex items-center bg-card border border-border rounded-2xl p-2 w-full sm:w-auto sm:max-w-[280px]">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-11 w-11 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 flex-shrink-0" 
                        onClick={() => {
                          const newValue = Math.max(0, (data.firstDeepCleanExtraHours || 0) - 0.5);
                          onUpdate({ firstDeepCleanExtraHours: newValue });
                        }}
                        disabled={(data.firstDeepCleanExtraHours || 0) <= 0}
                      >
                        <Minus className="h-5 w-5" />
                      </Button>
                      <div className="flex-1 text-center min-w-[90px]">
                        <div className="text-lg font-bold text-slate-600" style={{ paddingLeft: '7px', paddingRight: '7px' }}>
                          +{data.firstDeepCleanExtraHours || 0}h
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-11 w-11 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700" 
                        onClick={() => {
                          const newValue = (data.firstDeepCleanExtraHours || 0) + 0.5;
                          onUpdate({ firstDeepCleanExtraHours: newValue });
                        }}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Admin-only: Same cost as regular cleaning checkbox */}
              {data.wantsFirstDeepClean && isAdminMode && (
                <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={data.adminDeepCleanSameCost || false}
                      onCheckedChange={(checked) => onUpdate({ adminDeepCleanSameCost: checked === true })}
                    />
                    <div>
                      <span className="text-sm font-semibold text-amber-800">Same cost as regular cleaning</span>
                      <p className="text-xs text-amber-600 mt-0.5">No additional charge for deep clean (use recurring rate)</p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Oven Cleaning - With Switch Toggle */}
      {ovenCleaningConfigs.length > 0 && <div className="relative z-[5]">
          <div className="flex items-center justify-between mb-4 p-3 bg-muted/30 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <LucideIcons.Microwave className="h-6 w-6 text-primary" />
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
            <Switch checked={data.hasOvenCleaning} onCheckedChange={checked => {
          onUpdate({
            hasOvenCleaning: checked,
            ovenType: checked ? data.ovenType : ''
          });
        }} className={`w-16 h-7 ${!data.hasOvenCleaning ? 'border-2 border-border' : ''}`} />
          </div>
          
          {data.hasOvenCleaning && <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ovenCleaningConfigs.filter((oven: any) => oven.option !== 'not-required').map((oven: any) => {
            const isSelected = data.ovenType === oven.option;
            const IconComponent = (LucideIcons as any)[oven.icon];
            return <button key={oven.option} className={`group relative h-20 rounded-2xl border transition-all duration-300 ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`} onClick={() => onUpdate({
              ovenType: isSelected ? '' : oven.option as any
            })}>
                      <div className="flex flex-col items-center justify-center h-full">
                        {IconComponent && <IconComponent className={`h-6 w-6 mb-1 transition-all duration-500 ${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />}
                        <span className={`text-base font-bold transition-colors ${isSelected ? 'text-primary' : 'text-slate-500 group-hover:text-primary'}`}>{oven.label}</span>
                      </div>
                    </button>;
          })}
              </div>

              {/* Oven cleaning scope - only show for recurring bookings */}
              {data.serviceFrequency && data.serviceFrequency !== 'onetime' && data.ovenType && <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border">
                  <h3 className="text-base font-semibold text-slate-700 mb-3">Apply oven cleaning to:</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className={`p-3 rounded-xl border-2 transition-all duration-300 text-left ${data.ovenCleaningScope === 'this-booking' ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'}`} onClick={() => onUpdate({
              ovenCleaningScope: 'this-booking'
            })}>
                      <span className={`text-sm font-semibold ${data.ovenCleaningScope === 'this-booking' ? 'text-primary' : 'text-slate-600'}`}>This booking only</span>
                      <p className="text-xs text-muted-foreground mt-1">One-time add-on</p>
                    </button>
                    <button className={`p-3 rounded-xl border-2 transition-all duration-300 text-left ${data.ovenCleaningScope === 'all-bookings' ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'}`} onClick={() => onUpdate({
              ovenCleaningScope: 'all-bookings'
            })}>
                      <span className={`text-sm font-semibold ${data.ovenCleaningScope === 'all-bookings' ? 'text-primary' : 'text-slate-600'}`}>All future bookings</span>
                      <p className="text-xs text-muted-foreground mt-1">Recurring add-on</p>
                    </button>
                  </div>
                </div>}
            </>}
        </div>}

      {/* Cleaning Supplies */}
      {cleaningSuppliesConfigs.length > 0 && <div className="relative z-[4]">
          <h2 className="text-2xl font-bold text-slate-700 mb-2">
            Cleaning supplies
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            We recommend choosing our professional cleaning products as they significantly improve cleaning quality and effectiveness compared to regular store-bought products.
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            {cleaningSuppliesConfigs.map((supply: any) => {
          const isSelected = data.cleaningProducts.includes(supply.option);
          const IconComponent = (LucideIcons as any)[supply.icon];
          return <button key={supply.option} className={`group relative h-24 rounded-2xl border transition-all duration-300 ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`} onClick={() => {
            if (supply.option === 'no') {
              onUpdate({
                cleaningProducts: ['no'],
                equipmentArrangement: null,
                equipmentStorageConfirmed: false
              });
            } else if (supply.option === 'equipment') {
              onUpdate({
                cleaningProducts: ['products', 'equipment']
              });
            } else {
              onUpdate({
                cleaningProducts: [supply.option],
                equipmentArrangement: null,
                equipmentStorageConfirmed: false
              });
            }
          }}>
                  <div className="flex flex-col items-center justify-center h-full">
                    {IconComponent && <IconComponent className={`h-6 w-6 mb-2 transition-all duration-500 ${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />}
                    <span className={`text-sm font-semibold transition-colors text-center px-2 ${isSelected ? 'text-primary' : 'text-slate-700 group-hover:text-primary'}`}>{supply.label}</span>
                  </div>
                </button>;
        })}
          </div>
        </div>}

      {/* Equipment Arrangement - Only show if equipment is selected */}
      {data.cleaningProducts.includes('equipment') && <div>
          <h2 className="text-2xl font-bold text-slate-700 mb-4">Equipment arrangement</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(equipmentArrangementConfigs.length > 0 ? equipmentArrangementConfigs : [{
          option: 'oneoff',
          label: 'One-off delivery'
        }, {
          option: 'ongoing',
          label: 'Leave at property'
        }]).map((opt: any) => {
          const isSelected = data.equipmentArrangement === opt.option;
          return <button key={opt.option} className={`group relative h-20 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`} onClick={() => onUpdate({
            equipmentArrangement: opt.option
          })}>
                  {isSelected && <CheckCircle className="h-5 w-5 text-primary mb-1" />}
                  <span className={`text-base font-bold transition-colors text-center px-2 ${isSelected ? 'text-primary' : 'text-slate-500 group-hover:text-primary'}`}>{opt.label}</span>
                </button>;
        })}
          </div>

          {data.equipmentArrangement === 'ongoing' && <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={data.equipmentStorageConfirmed} onChange={e => onUpdate({
            equipmentStorageConfirmed: e.target.checked
          })} className="mt-1 rounded border-amber-300" />
                <span className="text-sm text-amber-800">
                  I confirm I have adequate storage space for the cleaning equipment at my property
                </span>
              </label>
            </div>}
        </div>}


      {/* Debug info */}
      {showDebug && <div className="p-4 rounded-2xl shadow-lg bg-gray-100">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({
          baseTime: calculations.baseTime,
          totalHours: calculations.totalHours,
          hourlyRate: calculations.hourlyRate,
          serviceFrequency: data.serviceFrequency
        }, null, 2)}
          </pre>
        </div>}

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button size="lg" onClick={handleContinue} className="px-8 py-3 text-lg font-semibold rounded-2xl transition-all">
          Continue
        </Button>
      </div>
    </div>;
};