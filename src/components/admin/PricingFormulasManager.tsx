import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import FormulaBuilder from './FormulaBuilder';

interface PricingFormula {
  id: string;
  service_type: string;
  sub_service_type: string | null;
  formula_name: string;
  formula_config: any;
  base_hourly_rate: number;
  is_active: boolean;
}

const PricingFormulasManager: React.FC = () => {
  const { toast } = useToast();
  const [formulas, setFormulas] = useState<PricingFormula[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<PricingFormula | null>(null);
  
  // Form state for new/edit formula
  const [serviceType, setServiceType] = useState('');
  const [subServiceType, setSubServiceType] = useState('');
  const [formulaName, setFormulaName] = useState('');
  const [baseHourlyRate, setBaseHourlyRate] = useState<number>(20);
  const [formulaConfig, setFormulaConfig] = useState<any>(null);

  const fetchFormulas = async () => {
    try {
      const { data, error } = await supabase
        .from('service_pricing_formulas')
        .select('*')
        .order('service_type', { ascending: true });

      if (error) throw error;
      setFormulas(data || []);
    } catch (error) {
      console.error('Error fetching formulas:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pricing formulas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormulas();
  }, []);

  const resetForm = () => {
    setServiceType('');
    setSubServiceType('');
    setFormulaName('');
    setBaseHourlyRate(20);
    setFormulaConfig(null);
    setEditingFormula(null);
  };

  const handleCreateFormula = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleEditFormula = (formula: PricingFormula) => {
    setEditingFormula(formula);
    setServiceType(formula.service_type);
    setSubServiceType(formula.sub_service_type || '');
    setFormulaName(formula.formula_name);
    setBaseHourlyRate(formula.base_hourly_rate);
    setFormulaConfig(formula.formula_config);
    setIsCreateDialogOpen(true);
  };

  const handleSaveFormula = async (formulaConfigFromBuilder: any) => {
    if (!serviceType || !formulaName || !formulaConfigFromBuilder) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const formulaData = {
        service_type: serviceType,
        sub_service_type: subServiceType || null,
        formula_name: formulaName,
        formula_config: formulaConfigFromBuilder,
        base_hourly_rate: baseHourlyRate,
        is_active: true
      };

      if (editingFormula) {
        const { error } = await supabase
          .from('service_pricing_formulas')
          .update(formulaData)
          .eq('id', editingFormula.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Pricing formula updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('service_pricing_formulas')
          .insert([formulaData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Pricing formula created successfully"
        });
      }

      setIsCreateDialogOpen(false);
      resetForm();
      fetchFormulas();
    } catch (error) {
      console.error('Error saving formula:', error);
      toast({
        title: "Error",
        description: "Failed to save pricing formula",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFormula = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing formula?')) return;

    try {
      const { error } = await supabase
        .from('service_pricing_formulas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pricing formula deleted successfully"
      });

      fetchFormulas();
    } catch (error) {
      console.error('Error deleting formula:', error);
      toast({
        title: "Error",
        description: "Failed to delete pricing formula",
        variant: "destructive"
      });
    }
  };

  const toggleFormulaStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('service_pricing_formulas')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Formula ${!currentStatus ? 'activated' : 'deactivated'}`
      });

      fetchFormulas();
    } catch (error) {
      console.error('Error updating formula status:', error);
      toast({
        title: "Error",
        description: "Failed to update formula status",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading pricing formulas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pricing Formulas Manager</h2>
          <p className="text-muted-foreground">Create and manage dynamic pricing formulas for your services</p>
        </div>
        <Button onClick={handleCreateFormula}>
          <Plus className="h-4 w-4 mr-2" />
          Create Formula
        </Button>
      </div>

      <div className="grid gap-4">
        {formulas.map((formula) => (
          <Card key={formula.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    {formula.formula_name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{formula.service_type}</Badge>
                    {formula.sub_service_type && (
                      <Badge variant="secondary">{formula.sub_service_type}</Badge>
                    )}
                    <Badge variant={formula.is_active ? "default" : "secondary"}>
                      {formula.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFormulaStatus(formula.id, formula.is_active)}
                  >
                    {formula.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditFormula(formula)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteFormula(formula.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Base Hourly Rate:</strong> £{formula.base_hourly_rate}</p>
                <p><strong>Formula:</strong> <code>{formula.formula_config?.baseFormula || 'N/A'}</code></p>
                {formula.formula_config?.conditions?.length > 0 && (
                  <div>
                    <strong>Conditions:</strong>
                    <ul className="ml-4 mt-1 text-sm">
                      {formula.formula_config.conditions.map((condition: any, index: number) => (
                        <li key={index}>
                          IF {condition.field} {condition.operator} {condition.value} THEN multiply by {condition.multiplier}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Formula Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFormula ? 'Edit Pricing Formula' : 'Create New Pricing Formula'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="serviceType">Service Type</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Airbnb">Airbnb</SelectItem>
                    <SelectItem value="Standard">Standard Cleaning</SelectItem>
                    <SelectItem value="Deep">Deep Cleaning</SelectItem>
                    <SelectItem value="Office">Office Cleaning</SelectItem>
                    <SelectItem value="End of Tenancy">End of Tenancy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subServiceType">Sub Service Type (Optional)</Label>
                <Select value={subServiceType} onValueChange={setSubServiceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Mid-stay">Mid-stay</SelectItem>
                    <SelectItem value="Deep">Deep</SelectItem>
                    <SelectItem value="Check-out">Check-out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="formulaName">Formula Name</Label>
                <Input
                  id="formulaName"
                  value={formulaName}
                  onChange={(e) => setFormulaName(e.target.value)}
                  placeholder="e.g., Airbnb Standard Cleaning"
                />
              </div>

              <div>
                <Label htmlFor="baseHourlyRate">Base Hourly Rate (£)</Label>
                <Input
                  id="baseHourlyRate"
                  type="number"
                  step="0.01"
                  value={baseHourlyRate}
                  onChange={(e) => setBaseHourlyRate(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Formula Builder */}
            <FormulaBuilder
              onSave={handleSaveFormula}
              initialFormula={formulaConfig}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingFormulasManager;