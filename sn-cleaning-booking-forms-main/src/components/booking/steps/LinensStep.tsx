import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { BookingData } from '../BookingForm';
import { Truck, Shirt, Plus, Minus, Package, Info } from 'lucide-react';
import { useAirbnbFieldConfigs } from '@/hooks/useAirbnbFieldConfigs';
import { useLinenProducts } from '@/hooks/useLinenProducts';

interface LinensStepProps {
  data: BookingData;
  onUpdate: (updates: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const LinensStep: React.FC<LinensStepProps> = ({ data, onUpdate, onNext, onBack }) => {
  const [showInfo, setShowInfo] = React.useState<string | null>(null);
  
  // Fetch dynamic configs from Supabase
  const { data: linenHandlingConfigs = [] } = useAirbnbFieldConfigs('Linen Handling', true);
  const { data: ironingConfigs = [] } = useAirbnbFieldConfigs('Ironing', true);
  const { products: linenProductsFromDB = [] } = useLinenProducts();
  
  // Fallback to hardcoded options if no configs exist
  const linensOptions = linenHandlingConfigs.length > 0 
    ? linenHandlingConfigs.map((config: any) => ({
        value: config.option,
        label: config.label,
        icon: config.option.includes('customer') ? Truck : 
              config.option.includes('wash') ? Shirt : Package
      }))
    : [
        { value: 'customer-handles', label: 'I will provide my own', icon: Truck },
        { value: 'wash-hang', label: 'Wash and hang dry', icon: Shirt },
        { value: 'wash-dry', label: 'Wash and tumble dry', icon: Shirt },
        { value: 'order-linens', label: 'Order linens from us', icon: Package }
      ];

  const getRecommendedExtraHours = () => {
    // If ironing is selected, it includes washing time (1.5 hours total)
    if (data.needsIroning) {
      return 1.5; // 1.5 hours total for washing + ironing
    }
    // If only washing (no ironing), add 0.5 hours
    if (data.linensHandling === 'wash-hang' || data.linensHandling === 'wash-dry') {
      return 0.5; // 30 minutes for washing only
    }
    return 0;
  };

  const roundToNearestHalf = (hours: number) => {
    return Math.round(hours * 2) / 2;
  };

  // Auto-adjust extra hours based on linen handling selection (only when initially set)
  React.useEffect(() => {
    const recommendedHours = getRecommendedExtraHours();
    // Only auto-adjust if extraHours is not set yet (undefined/0) or when switching linen handling options
    if ((!data.extraHours || data.extraHours === 0) && recommendedHours > 0) {
      onUpdate({ extraHours: recommendedHours });
    }
  }, [data.linensHandling, data.needsIroning, onUpdate]);

  // Clear linen packages when switching away from "order linens from us"
  const handleLinenSelection = (value: string) => {
    const updates: Partial<BookingData> = { linensHandling: value as any };
    
    // Clear linen packages if switching away from order-linens
    if (value !== 'order-linens' && data.linensHandling === 'order-linens') {
      updates.linenPackages = {};
    }
    
    onUpdate(updates);
  };

  // Use dynamic linen products or fallback to hardcoded
  const linenPackages = linenProductsFromDB.length > 0
    ? linenProductsFromDB.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        includes: product.items_included ? product.items_included.split(',').map((i: string) => i.trim()) : [],
        description: product.description || product.name,
        icon: product.type === 'bed_linen' ? '🛏️' : 
              product.type === 'bath_linen' ? '🛁' : 
              product.type === 'accessories' ? '👘' : '🧽'
      }))
    : [
        {
          id: 'single',
          name: 'Single bed linen set',
          price: 19.95,
          includes: [
            '1 x White Single Duvet Cover',
            '1 x White Single Fitted Sheet',
            '2 x White Pillowcases',
            '1 x White Bath Towel (500gsm)',
            '1 x White Hand Towel (500gsm)'
          ],
          description: 'White single duvet cover, fitted sheet, 2 pillowcases, bath towel and hand towel',
          icon: '🛏️'
        },
        {
          id: 'double',
          name: 'Double bed linen set',
          price: 23.95,
          includes: [
            '1 x White Double Duvet Cover',
            '1 x White Double Fitted Sheet',
            '4 x White Pillowcases',
            '2 x White Bath Towels (500gsm)',
            '2 x White Hand Towels (500gsm)'
          ],
          description: 'White double duvet cover, fitted sheet, 4 pillowcases, 2 bath towels and 2 hand towels',
          icon: '🛏️'
        },
        {
          id: 'king',
          name: 'King bed linen set',
          price: 25.75,
          includes: [
            '1 x White King Duvet Cover',
            '1 x White King Fitted Sheet',
            '4 x White Pillowcases',
            '2 x White Bath Towels (500gsm)',
            '2 x White Hand Towels (500gsm)'
          ],
          description: 'White king duvet cover, fitted sheet, 4 pillowcases, 2 bath towels and 2 hand towels',
          icon: '🛏️'
        },
        {
          id: 'superking',
          name: 'Super king bed linen set',
          price: 26.75,
          includes: [
            '1 x White Super King Duvet Cover',
            '1 x White Super King Fitted Sheet',
            '4 x White Pillowcases',
            '2 x White Bath Towels (500gsm)',
            '2 x White Hand Towels (500gsm)'
          ],
          description: 'White super king duvet cover, fitted sheet, 4 pillowcases, 2 bath towels and 2 hand towels',
          icon: '🛏️'
        },
        {
          id: 'bathmat',
          name: 'Bath mat',
          price: 2.80,
          includes: ['1 x Bath Mat'],
          description: 'White bath mat',
          icon: '🛁'
        },
        {
          id: 'bathsheet',
          name: 'Bath sheet',
          price: 3.10,
          includes: ['1 x Bath Sheet'],
          description: 'White bath sheet',
          icon: '🛁'
        },
        {
          id: 'bathrobe',
          name: 'Bath robe',
          price: 6.50,
          includes: ['1 x Bath Robe'],
          description: 'White bath robe',
          icon: '👘'
        },
        {
          id: 'teatowel',
          name: 'Tea towel',
          price: 1.30,
          includes: ['1 x Tea Towel'],
          description: 'White tea towel',
          icon: '🧽'
        }
      ];

  const showIroning = data.linensHandling === 'wash-hang' || data.linensHandling === 'wash-dry';
  const showDelivery = data.linensHandling === 'order-linens';
  const showIroningHours = showIroning && data.needsIroning === true;
  
  // Calculate total for linen packages
  const linenTotal = Object.entries(data.linenPackages || {}).reduce((total, [packageId, quantity]) => {
    const pkg = linenPackages.find(p => p.id === packageId);
    return total + (pkg ? pkg.price * quantity : 0);
  }, 0);
  
  const hasReachedMinimum = linenTotal >= 150;
  const canContinue = data.linensHandling && 
    (!showIroning || data.needsIroning !== null) && 
    (!showDelivery || hasReachedMinimum);

  const adjustIroningHours = (increment: number) => {
    const currentHours = data.ironingHours || 0;
    const newHours = Math.max(0, currentHours + increment * 0.5);
    onUpdate({ ironingHours: newHours });
  };

  const updatePackageQuantity = (packageId: string, quantity: number) => {
    const currentPackages = data.linenPackages || {};
    const updatedPackages = { ...currentPackages, [packageId]: Math.max(0, quantity) };
    onUpdate({ linenPackages: updatedPackages });
  };

  return (
    <div className="space-y-4">
      <div className="p-2 rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.18)] bg-white transition-shadow duration-300">
        <h2 className="text-2xl font-bold text-[#185166] mb-4">
          Linen Handling
        </h2>

      {/* Linen Handling Options */}
      <div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {linensOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = data.linensHandling === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleLinenSelection(option.value)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ironing Switch */}
      {showIroning && (
        <div>
          <h2 className="text-xl font-bold text-[#185166] mb-4">
            Select ironing option <span className="text-destructive">*</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {(ironingConfigs.length > 0 ? ironingConfigs : [
              { option: 'yes_iron_linens', label: 'Yes, iron linens' },
              { option: 'no_ironing_needed', label: 'No ironing needed' }
            ]).map((option: any, index: number) => {
              const isYes = option.option.includes('yes') || index === 0;
              const isSelected = data.needsIroning === isYes;
              return (
                <button
                  key={option.option}
                  onClick={() => onUpdate({ needsIroning: isYes })}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                    isSelected
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Shirt className={`h-6 w-6 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Extra Hours for Linen Handling */}
      {(data.linensHandling === 'wash-hang' || data.linensHandling === 'wash-dry' || data.needsIroning) && (
        <div>
          <div className="bg-muted/10 border border-border rounded-lg p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-base font-medium text-foreground mb-2">Recommended Extra Time</h4>
                <p className="text-sm text-muted-foreground">
                  {data.needsIroning 
                    ? 'We recommend 1.5 hours total for washing and ironing linens.'
                    : (data.linensHandling === 'wash-hang' || data.linensHandling === 'wash-dry')
                    ? 'We recommend 30 minutes extra for washing linens.'
                    : ''
                  } You can adjust based on your needs.
                </p>
              </div>
              
              <div className="w-full flex justify-center lg:justify-end lg:ml-6">
                <div className="flex items-center bg-card border border-border rounded-2xl p-2 w-full max-w-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary"
                    onClick={() => {
                      const newHours = roundToNearestHalf(Math.max((data.extraHours || 0) - 0.5, 0));
                      onUpdate({ extraHours: newHours });
                    }}
                    disabled={(data.extraHours || 0) <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 text-center mx-4">
                    <div className="text-xl font-bold text-foreground">
                      {(data.extraHours || 0) % 1 === 0 
                        ? (data.extraHours || 0).toString() 
                        : (data.extraHours || 0).toFixed(1)} hours
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary"
                    onClick={() => {
                      const newHours = roundToNearestHalf((data.extraHours || 0) + 0.5);
                      onUpdate({ extraHours: newHours });
                    }}
                    disabled={(data.extraHours || 0) >= 5}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Linen Packages for Delivery */}
      {showDelivery && (
        <div className="border-2 border-dashed border-primary/30 rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-foreground mb-2">Select Linen Packages</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-blue-800">
                <strong>Delivery Confirmation Required:</strong> Linen delivery for the day of cleaning needs to be confirmed first. We'll contact you to arrange the best delivery time.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-yellow-800">
                <strong>Important:</strong> £150 minimum order for linen delivery. Depending on your booking frequency, 
                we can arrange delivery every 2-4 weeks.
              </p>
            </div>
            
            {/* Total Progress */}
            <div className="bg-card border rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Linen Total:</span>
                <span className={`text-lg font-bold ${hasReachedMinimum ? 'text-green-600' : 'text-red-600'}`}>
                  £{linenTotal.toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 mb-2">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    hasReachedMinimum ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((linenTotal / 150) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">£0</span>
                <span className={`font-medium ${hasReachedMinimum ? 'text-green-600' : 'text-red-600'}`}>
                  {hasReachedMinimum ? 'Minimum reached!' : `Need £${(150 - linenTotal).toFixed(2)} more`}
                </span>
                <span className="text-muted-foreground">£150 minimum</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {linenPackages.map((linen) => {
              const quantity = data.linenPackages?.[linen.id] || 0;
              const isSelected = quantity > 0;
              const isInfoVisible = showInfo === linen.id;
              
              return (
                <div
                  key={linen.id}
                  className={`group relative rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-xl h-40'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg h-32'
                  }`}
                >
                  {/* Info Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowInfo(isInfoVisible ? null : linen.id);
                    }}
                    className="absolute top-2 right-2 z-10 p-1 rounded-full bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </button>

                  {/* Info Popup */}
                  {isInfoVisible && (
                    <div className="absolute top-8 right-2 z-20 bg-popover border border-border rounded-lg p-3 shadow-lg min-w-48 max-w-64">
                      <div className="text-xs font-medium text-foreground mb-1">Includes:</div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {linen.includes.map((item, idx) => (
                          <div key={idx}>• {item}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Main Card Content */}
                  <button
                    onClick={() => {
                      if (!isSelected) {
                        updatePackageQuantity(linen.id, 1);
                      }
                    }}
                    className="w-full h-full"
                  >
                    {!isSelected ? (
                      <div className="flex flex-col items-center justify-center h-full p-3">
                        <div className="text-2xl mb-2">{linen.icon}</div>
                        <span className="text-sm font-bold text-foreground text-center leading-tight">
                          {linen.name}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          £{linen.price.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
                        {/* Main content area */}
                        <div className="flex-1 flex flex-col items-center justify-center p-2">
                          <div className="text-xl mb-1">{linen.icon}</div>
                          <span className="text-xs font-bold text-primary mb-1 text-center leading-tight">
                            {linen.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            £{linen.price.toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Separator line */}
                        <div className="h-px bg-border mx-3"></div>
                        
                        {/* Number selection area */}
                        <div className="p-3">
                          <div className="flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                updatePackageQuantity(linen.id, quantity - 1);
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <div className="flex-1 text-center mx-2">
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
                                updatePackageQuantity(linen.id, quantity + 1);
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          
          {/* Selected items description */}
          {Object.entries(data.linenPackages || {}).some(([_, qty]) => qty > 0) && (
            <div className="mt-6 p-4 bg-muted/20 border border-muted-foreground/20 rounded-2xl">
              <h4 className="font-semibold text-foreground mb-3">Selected items:</h4>
              <div className="space-y-2">
                {Object.entries(data.linenPackages || {}).map(([id, quantity]) => {
                  if (quantity === 0) return null;
                  const linen = linenPackages.find(l => l.id === id);
                  if (!linen) return null;
                  
                  return (
                    <div key={id} className="text-sm text-muted-foreground">
                      {quantity}x {linen.name} - {linen.description}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" size="lg" onClick={onBack}>
          Back
        </Button>
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

export { LinensStep };