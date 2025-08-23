import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PricingRule } from '@/hooks/useAirbnbPricing';
import { Settings, Save, RotateCcw } from 'lucide-react';

const AirbnbPricingManager: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [originalRules, setOriginalRules] = useState<PricingRule[]>([]);

  const fetchPricingRules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('airbnb_field_pricing')
        .select('*')
        .order('field_name, field_value');

      if (error) throw error;
      
      const rules = data || [];
      setPricingRules(rules);
      setOriginalRules(JSON.parse(JSON.stringify(rules)));
    } catch (error) {
      console.error('Error fetching pricing rules:', error);
      toast({
        title: "Error",
        description: "Failed to load pricing configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRuleUpdate = (id: string, field: 'base_cost' | 'multiplier_factor', value: number) => {
    setPricingRules(rules => 
      rules.map(rule => 
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    );
  };

  const savePricingRules = async () => {
    try {
      setSaving(true);
      
      const updates = pricingRules.map(rule => ({
        id: rule.id,
        field_name: rule.field_name,
        field_value: rule.field_value,
        base_cost: rule.base_cost,
        multiplier_factor: rule.multiplier_factor,
        is_active: rule.is_active,
        pricing_rules: rule.pricing_rules
      }));

      const { error } = await supabase
        .from('airbnb_field_pricing')
        .upsert(updates);

      if (error) throw error;

      setOriginalRules(JSON.parse(JSON.stringify(pricingRules)));
      
      toast({
        title: "Success",
        description: "Pricing configuration updated successfully!",
      });
    } catch (error) {
      console.error('Error saving pricing rules:', error);
      toast({
        title: "Error",
        description: "Failed to save pricing configuration.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setPricingRules(JSON.parse(JSON.stringify(originalRules)));
    toast({
      title: "Reset",
      description: "Changes have been reset to saved values.",
    });
  };

  const hasChanges = JSON.stringify(pricingRules) !== JSON.stringify(originalRules);

  const groupedRules = pricingRules.reduce((groups, rule) => {
    const group = groups[rule.field_name] || [];
    group.push(rule);
    groups[rule.field_name] = group;
    return groups;
  }, {} as Record<string, PricingRule[]>);

  const fieldLabels = {
    property_type: 'Property Types',
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms',
    service_type: 'Service Types',
    cleaning_products: 'Cleaning Products',
    ironing_required: 'Ironing Service',
    same_day_cleaning: 'Same Day Cleaning'
  };

  const getValueLabel = (fieldName: string, value: string) => {
    const labels: Record<string, Record<string, string>> = {
      property_type: {
        flat: 'Flat',
        house: 'House',
        studio: 'Studio'
      },
      bedrooms: {
        '1': '1 Bedroom',
        '2': '2 Bedrooms',
        '3': '3 Bedrooms',
        '4': '4 Bedrooms',
        '5': '5+ Bedrooms'
      },
      bathrooms: {
        '1': '1 Bathroom',
        '2': '2 Bathrooms',
        '3': '3 Bathrooms',
        '4': '4+ Bathrooms'
      },
      service_type: {
        check_in_out: 'Check In / Out',
        mid_stay: 'Mid Stay',
        light_cleaning: 'Light Cleaning',
        deep_cleaning: 'Deep Cleaning'
      },
      cleaning_products: {
        i_provide: "I'll Provide Products",
        bring_own: 'Bring Products'
      },
      ironing_required: {
        'true': 'Ironing Required',
        'false': 'No Ironing'
      },
      same_day_cleaning: {
        'true': 'Same Day Service',
        'false': 'Regular Booking'
      }
    };

    return labels[fieldName]?.[value] || value;
  };

  useEffect(() => {
    fetchPricingRules();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading pricing configuration...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Airbnb Pricing Configuration
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetChanges}
                  disabled={saving}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
              <Button
                onClick={savePricingRules}
                disabled={!hasChanges || saving}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Configure pricing for each field option. Base costs are added together, while multiplier factors are applied to the subtotal.
          </div>

          {Object.entries(groupedRules).map(([fieldName, rules]) => (
            <div key={fieldName} className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                {fieldLabels[fieldName as keyof typeof fieldLabels] || fieldName}
              </h3>
              
              <div className="grid gap-4">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {getValueLabel(fieldName, rule.field_value)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {rule.field_value}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Base Cost (£)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={rule.base_cost}
                          onChange={(e) => handleRuleUpdate(rule.id, 'base_cost', parseFloat(e.target.value) || 0)}
                          className="w-20 h-8 text-sm"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Multiplier</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={rule.multiplier_factor}
                          onChange={(e) => handleRuleUpdate(rule.id, 'multiplier_factor', parseFloat(e.target.value) || 1)}
                          className="w-20 h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator />
            </div>
          ))}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-foreground mb-2">How Pricing Works:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Base costs from selected options are added together</li>
              <li>• Service type multiplier is applied to the subtotal</li>
              <li>• Same day cleaning multiplier adds a surcharge</li>
              <li>• Final total = (Subtotal × Service Multiplier) + Same Day Surcharge</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AirbnbPricingManager;