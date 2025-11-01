import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calculator, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ServicePricing {
  id?: string;
  service_type: string;
  sub_service_type: string | null;
  formula_name: string;
  base_hourly_rate: number;
}

const PricingFormulasManager: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Airbnb cleaning rates
  const [airbnbStandard, setAirbnbStandard] = useState<number>(25);
  const [airbnbMidStay, setAirbnbMidStay] = useState<number>(20);
  const [airbnbDeep, setAirbnbDeep] = useState<number>(35);
  const [cleaningProducts, setCleaningProducts] = useState<number>(10);
  const [cleaningEquipment, setCleaningEquipment] = useState<number>(15);
  
  // Standard cleaning rates
  const [standardCleaning, setStandardCleaning] = useState<number>(20);

  const fetchPricingData = async () => {
    try {
      const { data, error } = await supabase
        .from('service_pricing_formulas')
        .select('*');

      if (error) throw error;

      // Set the rates from existing data
      data?.forEach((item) => {
        if (item.service_type === 'Airbnb') {
          switch (item.sub_service_type) {
            case 'Standard':
              setAirbnbStandard(item.base_hourly_rate);
              break;
            case 'Mid-stay':
              setAirbnbMidStay(item.base_hourly_rate);
              break;
            case 'Deep':
              setAirbnbDeep(item.base_hourly_rate);
              break;
          }
        } else if (item.service_type === 'Standard') {
          setStandardCleaning(item.base_hourly_rate);
        } else if (item.service_type === 'Add-ons') {
          if (item.sub_service_type === 'Cleaning Products') {
            setCleaningProducts(item.base_hourly_rate);
          } else if (item.sub_service_type === 'Cleaning Equipment') {
            setCleaningEquipment(item.base_hourly_rate);
          }
        }
      });
    } catch (error) {
      console.error('Error fetching pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingData();
  }, []);

  const savePricing = async () => {
    setSaving(true);
    try {
      // Delete existing data
      await supabase.from('service_pricing_formulas').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Insert new pricing data
      const pricingData = [
        {
          service_type: 'Airbnb',
          sub_service_type: 'Standard',
          formula_name: 'Airbnb Standard Cleaning',
          formula_config: { baseFormula: 'total_hours * base_hourly_rate' },
          base_hourly_rate: airbnbStandard,
          is_active: true
        },
        {
          service_type: 'Airbnb',
          sub_service_type: 'Mid-stay',
          formula_name: 'Airbnb Mid-stay Cleaning',
          formula_config: { baseFormula: 'total_hours * base_hourly_rate' },
          base_hourly_rate: airbnbMidStay,
          is_active: true
        },
        {
          service_type: 'Airbnb',
          sub_service_type: 'Deep',
          formula_name: 'Airbnb Deep Cleaning',
          formula_config: { baseFormula: 'total_hours * base_hourly_rate' },
          base_hourly_rate: airbnbDeep,
          is_active: true
        },
        {
          service_type: 'Standard',
          sub_service_type: null,
          formula_name: 'Standard Cleaning',
          formula_config: { baseFormula: 'total_hours * base_hourly_rate' },
          base_hourly_rate: standardCleaning,
          is_active: true
        },
        {
          service_type: 'Add-ons',
          sub_service_type: 'Cleaning Products',
          formula_name: 'Cleaning Products',
          formula_config: { baseFormula: 'base_hourly_rate' },
          base_hourly_rate: cleaningProducts,
          is_active: true
        },
        {
          service_type: 'Add-ons',
          sub_service_type: 'Cleaning Equipment',
          formula_name: 'Cleaning Equipment',
          formula_config: { baseFormula: 'base_hourly_rate' },
          base_hourly_rate: cleaningEquipment,
          is_active: true
        }
      ];

      const { error } = await supabase
        .from('service_pricing_formulas')
        .insert(pricingData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pricing updated successfully"
      });
    } catch (error) {
      console.error('Error saving pricing:', error);
      toast({
        title: "Error",
        description: "Failed to save pricing",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading pricing data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Service Pricing Management</h2>
          <p className="text-muted-foreground">Set hourly rates for different cleaning services</p>
        </div>
        <Button onClick={savePricing} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Airbnb Cleaning */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Airbnb Cleaning Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="airbnb-standard">Standard Cleaning (£/hour)</Label>
                <Input
                  id="airbnb-standard"
                  type="number"
                  step="0.01"
                  value={airbnbStandard}
                  onChange={(e) => setAirbnbStandard(parseFloat(e.target.value) || 0)}
                  placeholder="25.00"
                />
                <p className="text-xs text-muted-foreground mt-1">Regular turnover cleaning</p>
              </div>

              <div>
                <Label htmlFor="airbnb-midstay">Mid-stay Cleaning (£/hour)</Label>
                <Input
                  id="airbnb-midstay"
                  type="number"
                  step="0.01"
                  value={airbnbMidStay}
                  onChange={(e) => setAirbnbMidStay(parseFloat(e.target.value) || 0)}
                  placeholder="20.00"
                />
                <p className="text-xs text-muted-foreground mt-1">While guests are staying</p>
              </div>

              <div>
                <Label htmlFor="airbnb-deep">Deep Cleaning (£/hour)</Label>
                <Input
                  id="airbnb-deep"
                  type="number"
                  step="0.01"
                  value={airbnbDeep}
                  onChange={(e) => setAirbnbDeep(parseFloat(e.target.value) || 0)}
                  placeholder="35.00"
                />
                <p className="text-xs text-muted-foreground mt-1">After long-term guests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add-on Services */}
        <Card>
          <CardHeader>
            <CardTitle>Add-on Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cleaning-products">Cleaning Products (£ per booking)</Label>
                <Input
                  id="cleaning-products"
                  type="number"
                  step="0.01"
                  value={cleaningProducts}
                  onChange={(e) => setCleaningProducts(parseFloat(e.target.value) || 0)}
                  placeholder="10.00"
                />
                <p className="text-xs text-muted-foreground mt-1">Cost for providing cleaning products</p>
              </div>

              <div>
                <Label htmlFor="cleaning-equipment">Cleaning Equipment (£ per booking)</Label>
                <Input
                  id="cleaning-equipment"
                  type="number"
                  step="0.01"
                  value={cleaningEquipment}
                  onChange={(e) => setCleaningEquipment(parseFloat(e.target.value) || 0)}
                  placeholder="15.00"
                />
                <p className="text-xs text-muted-foreground mt-1">Cost for providing equipment</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Standard Cleaning */}
        <Card>
          <CardHeader>
            <CardTitle>Standard Cleaning Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="standard-cleaning">Standard Cleaning (£/hour)</Label>
              <Input
                id="standard-cleaning"
                type="number"
                step="0.01"
                value={standardCleaning}
                onChange={(e) => setStandardCleaning(parseFloat(e.target.value) || 0)}
                placeholder="20.00"
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">Regular house cleaning</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">How pricing works:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Service rates are charged per hour of work</li>
          <li>• Add-on services are fixed costs per booking</li>
          <li>• Total cost = (Hours × Hourly Rate) + Add-ons</li>
          <li>• All prices are in British Pounds (£)</li>
        </ul>
      </div>
    </div>
  );
};

export default PricingFormulasManager;