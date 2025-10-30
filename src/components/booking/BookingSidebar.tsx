import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building, Bed, Bath, Home, Users, Calculator, Package2, Calendar } from 'lucide-react';

interface BookingSidebarProps {
  formData: {
    propertyType?: string;
    bedrooms?: string;
    bathrooms?: string;
    toilets?: string;
    serviceType?: string;
    linensHandling?: string;
    needsOvenCleaning?: boolean | null;
    estimatedHours?: number | null;
    extraHours?: number;
    hourlyRate?: number;
    totalCost?: number;
    selectedDate?: Date | null;
    selectedTime?: string;
  };
}

export function BookingSidebar({ formData }: BookingSidebarProps) {
  const getPropertyTypeLabel = () => {
    switch (formData.propertyType) {
      case 'flat': return 'Flat';
      case 'house': return 'House';
      default: return 'Not Selected';
    }
  };

  const getServiceTypeLabel = () => {
    switch (formData.serviceType) {
      case 'checkin-checkout': return 'Check-in/Check-out Clean';
      case 'midstay': return 'Mid-stay Clean';
      case 'light': return 'Light Clean';
      case 'deep': return 'Deep Clean';
      default: return 'Not Selected';
    }
  };

  const getLinensLabel = () => {
    switch (formData.linensHandling) {
      case 'customer-handles': return 'Customer Handles';
      case 'wash-hang': return 'Wash & Hang';
      case 'wash-dry': return 'Wash & Dry';
      case 'order-linens': return 'Order Linens';
      default: return 'Not Selected';
    }
  };

  const formatDate = () => {
    if (!formData.selectedDate) return 'Not Selected';
    const date = new Date(formData.selectedDate);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getTotalHours = () => {
    const estimated = formData.estimatedHours || 0;
    const extra = formData.extraHours || 0;
    return estimated + extra;
  };

  return (
    <Card className="sticky top-4 lg:w-80 block border-0 lg:border shadow-lg">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-primary">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Calculator className="w-4 h-4" />
          </div>
          Booking Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Property Details */}
        {formData.propertyType && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Property Type:</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                {getPropertyTypeLabel()}
              </Badge>
            </div>
            
            {formData.bedrooms && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bedrooms:</span>
                <div className="flex items-center gap-1">
                  <Bed className="w-3 h-3 text-primary" />
                  <span className="font-medium">{formData.bedrooms}</span>
                </div>
              </div>
            )}
            
            {formData.bathrooms && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bathrooms:</span>
                <div className="flex items-center gap-1">
                  <Bath className="w-3 h-3 text-primary" />
                  <span className="font-medium">{formData.bathrooms}</span>
                </div>
              </div>
            )}
            
            {formData.toilets && parseInt(formData.toilets) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Separate Toilets:</span>
                <span className="font-medium">{formData.toilets}</span>
              </div>
            )}
          </div>
        )}

        {/* Service Details */}
        {formData.serviceType && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Service Type:</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                  {getServiceTypeLabel()}
                </Badge>
              </div>
              
              {formData.needsOvenCleaning && (
                <div className="text-sm text-muted-foreground">
                  + Oven Cleaning
                </div>
              )}
            </div>
          </>
        )}

        {/* Linens */}
        {formData.linensHandling && formData.linensHandling !== '' && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Linens:</span>
                <div className="flex items-center gap-1">
                  <Package2 className="w-3 h-3 text-primary" />
                  <span className="font-medium text-xs">{getLinensLabel()}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Schedule */}
        {formData.selectedDate && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Date:</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-primary" />
                  <span className="font-medium text-xs">{formatDate()}</span>
                </div>
              </div>
              
              {formData.selectedTime && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium">{formData.selectedTime}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Hours Breakdown */}
        {(formData.estimatedHours !== null && formData.estimatedHours !== undefined) && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated Hours:</span>
                <span className="font-medium">{formData.estimatedHours}h</span>
              </div>
              
              {formData.extraHours > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Extra Hours:</span>
                  <span className="font-medium">{formData.extraHours}h</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Hours:</span>
                <span className="font-bold text-primary">{getTotalHours()}h</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hourly Rate:</span>
                <span className="font-medium">£{formData.hourlyRate || 25}/h</span>
              </div>
            </div>
          </>
        )}

        {/* Price */}
        <Separator className="my-4" />
        <div className="flex items-center justify-between pt-2">
          <span className="font-semibold text-base">Estimated Total:</span>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              £{formData.totalCost || 0}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}