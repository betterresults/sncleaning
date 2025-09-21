import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building, Bed, Bath, Home, Users, Calculator } from 'lucide-react';

interface BookingSidebarProps {
  formData: any;
}

export function BookingSidebar({ formData }: BookingSidebarProps) {
  const calculatePrice = () => {
    let basePrice = 0;
    
    // Base prices by property type and configuration
    if (formData.property_type === 'apartment') {
      if (formData.bedrooms === 0) basePrice = 80; // Studio
      else basePrice = 80 + (formData.bedrooms * 25);
    } else if (formData.property_type === 'house') {
      basePrice = 120 + (formData.bedrooms * 30);
    } else if (formData.property_type === 'shared_house') {
      basePrice = 60;
    }
    
    // Add bathroom costs
    basePrice += (formData.bathrooms - 1) * 20;
    basePrice += formData.separate_wc * 15;
    
    // Add additional features
    basePrice += (formData.additional_features?.length || 0) * 25;
    
    // Add cleaning services
    const carpetCount = formData.carpet_cleaning?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    const upholsteryCount = formData.upholstery_cleaning?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    const mattressCount = formData.mattress_cleaning?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    
    basePrice += carpetCount * 15;
    basePrice += upholsteryCount * 25;
    basePrice += mattressCount * 20;
    
    return basePrice;
  };

  const getPropertyTypeLabel = () => {
    switch (formData.property_type) {
      case 'apartment': return 'Apartment';
      case 'house': return 'House';
      case 'shared_house': return 'Shared House';
      default: return 'Not Selected';
    }
  };

  const getSelectedServices = () => {
    const services = [];
    
    if (formData.carpet_cleaning?.length > 0) {
      services.push(`Carpet Cleaning (${formData.carpet_cleaning.length} items)`);
    }
    if (formData.upholstery_cleaning?.length > 0) {
      services.push(`Upholstery Cleaning (${formData.upholstery_cleaning.length} items)`);
    }
    if (formData.mattress_cleaning?.length > 0) {
      services.push(`Mattress Cleaning (${formData.mattress_cleaning.length} items)`);
    }
    
    return services;
  };

  return (
    <Card className="sticky top-4 lg:w-80 hidden lg:block border-0 lg:border shadow-lg">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-primary-light/5 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-primary">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Calculator className="w-4 h-4" />
          </div>
          Booking Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Property Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Property Type:</span>
            <Badge variant="secondary">{getPropertyTypeLabel()}</Badge>
          </div>
          
          {formData.property_type && formData.property_type !== '' && (
            <>
              {(formData.property_type === 'apartment' || formData.property_type === 'house') && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bedrooms:</span>
                  <div className="flex items-center gap-1">
                    <Bed className="w-3 h-3" />
                    <span>{formData.bedrooms || 0}</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bathrooms:</span>
                <div className="flex items-center gap-1">
                  <Bath className="w-3 h-3" />
                  <span>{formData.bathrooms || 1}</span>
                </div>
              </div>
              
              {formData.separate_wc > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Separate WC:</span>
                  <span>{formData.separate_wc}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Additional Features */}
        {formData.additional_features?.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <span className="text-sm font-medium">Additional Rooms:</span>
              {formData.additional_features.map((feature, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{feature.label}</span>
                  <Badge variant="outline" className="text-xs">{feature.quantity || 1}</Badge>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Cleaning Services */}
        {getSelectedServices().length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <span className="text-sm font-medium">Cleaning Services:</span>
              {getSelectedServices().map((service, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  {service}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Price */}
        <Separator />
        <div className="flex items-center justify-between pt-2">
          <span className="font-semibold">Estimated Total:</span>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              £{calculatePrice()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}