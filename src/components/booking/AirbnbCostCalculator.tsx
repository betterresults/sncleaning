import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PoundSterling, Calculator, Home, Bed, Bath, Sparkles, Shirt, Clock } from 'lucide-react';
import { CostBreakdown } from '@/hooks/useAirbnbPricing';

interface AirbnbCostCalculatorProps {
  breakdown: CostBreakdown;
  selectedOptions: {
    propertyType: string;
    bedrooms: string;
    bathrooms: string;
    serviceType: string;
    cleaningProducts: string;
    ironingRequired: boolean;
    isSameDayCleaning: boolean;
  };
}

const AirbnbCostCalculator: React.FC<AirbnbCostCalculatorProps> = ({
  breakdown,
  selectedOptions
}) => {
  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;

  const getServiceTypeLabel = (value: string) => {
    const labels = {
      check_in_out: 'Check In/Out',
      mid_stay: 'Mid Stay',
      light_cleaning: 'Light Cleaning',
      deep_cleaning: 'Deep Cleaning'
    };
    return labels[value as keyof typeof labels] || value;
  };

  const getPropertyTypeLabel = (value: string) => {
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  return (
    <Card className="sticky top-4 bg-card border-border shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Calculator className="h-5 w-5 text-primary" />
          Cost Calculator
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Selected Services */}
        <div className="space-y-3">
          {selectedOptions.propertyType && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {getPropertyTypeLabel(selectedOptions.propertyType)}
                </span>
              </div>
              <span className="font-medium text-foreground">
                {formatCurrency(breakdown.propertyType)}
              </span>
            </div>
          )}

          {selectedOptions.bedrooms && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {selectedOptions.bedrooms} Bedroom{selectedOptions.bedrooms !== '1' ? 's' : ''}
                </span>
              </div>
              <span className="font-medium text-foreground">
                {formatCurrency(breakdown.bedrooms)}
              </span>
            </div>
          )}

          {selectedOptions.bathrooms && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Bath className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {selectedOptions.bathrooms} Bathroom{selectedOptions.bathrooms !== '1' ? 's' : ''}
                </span>
              </div>
              <span className="font-medium text-foreground">
                {formatCurrency(breakdown.bathrooms)}
              </span>
            </div>
          )}

          {selectedOptions.serviceType && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {getServiceTypeLabel(selectedOptions.serviceType)}
                </span>
              </div>
              <span className="font-medium text-foreground">
                {breakdown.serviceType > 0 ? formatCurrency(breakdown.serviceType) : 'Included'}
              </span>
            </div>
          )}

          {selectedOptions.cleaningProducts && breakdown.cleaningProducts > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Cleaning Products</span>
              </div>
              <span className="font-medium text-foreground">
                {formatCurrency(breakdown.cleaningProducts)}
              </span>
            </div>
          )}

          {selectedOptions.ironingRequired && breakdown.ironing > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Shirt className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Ironing Service</span>
              </div>
              <span className="font-medium text-foreground">
                {formatCurrency(breakdown.ironing)}
              </span>
            </div>
          )}

          {selectedOptions.isSameDayCleaning && breakdown.sameDayMultiplier > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Same Day Surcharge</span>
              </div>
              <span className="font-medium text-foreground">
                {formatCurrency(breakdown.sameDayMultiplier)}
              </span>
            </div>
          )}
        </div>

        <Separator className="bg-border" />

        {/* Total */}
        <div className="flex items-center justify-between text-lg font-bold">
          <div className="flex items-center gap-2 text-foreground">
            <PoundSterling className="h-5 w-5 text-primary" />
            <span>Total Cost</span>
          </div>
          <span className="text-primary text-xl">
            {formatCurrency(breakdown.total)}
          </span>
        </div>

        {/* Booking Note */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            Final cost may vary based on property condition and specific requirements
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AirbnbCostCalculator;