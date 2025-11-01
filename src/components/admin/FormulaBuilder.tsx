import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FormulaBuilderProps {
  onSave: (formula: FormulaConfig) => void;
  initialFormula?: FormulaConfig;
}

interface FormulaConfig {
  baseFormula: string;
  conditions: ConditionRule[];
}

interface ConditionRule {
  id: string;
  field: string;
  operator: string;
  value: string;
  multiplier: number;
}

const AVAILABLE_FIELDS = [
  { value: 'total_hours', label: 'Total Hours' },
  { value: 'total_cost', label: 'Total Cost' },
  { value: 'base_hourly_rate', label: 'Base Hourly Rate' },
  { value: 'property_size', label: 'Property Size' },
  { value: 'guest_count', label: 'Guest Count' },
  { value: 'has_clean_products', label: 'Clean Products Included' },
  { value: 'has_equipment', label: 'Equipment Included' }
];

const OPERATORS = [
  { value: '>', label: 'Greater than' },
  { value: '<', label: 'Less than' },
  { value: '=', label: 'Equal to' },
  { value: '>=', label: 'Greater than or equal' },
  { value: '<=', label: 'Less than or equal' }
];

const FormulaBuilder: React.FC<FormulaBuilderProps> = ({ onSave, initialFormula }) => {
  const { toast } = useToast();
  const [baseFormula, setBaseFormula] = useState(initialFormula?.baseFormula || 'total_hours * base_hourly_rate');
  const [conditions, setConditions] = useState<ConditionRule[]>(initialFormula?.conditions || []);

  const addCondition = useCallback(() => {
    const newCondition: ConditionRule = {
      id: Math.random().toString(36).substr(2, 9),
      field: '',
      operator: '>',
      value: '',
      multiplier: 1
    };
    setConditions(prev => [...prev, newCondition]);
  }, []);

  const removeCondition = useCallback((id: string) => {
    setConditions(prev => prev.filter(condition => condition.id !== id));
  }, []);

  const updateCondition = useCallback((id: string, updates: Partial<ConditionRule>) => {
    setConditions(prev => prev.map(condition => 
      condition.id === id ? { ...condition, ...updates } : condition
    ));
  }, []);

  const insertFieldIntoFormula = useCallback((field: string) => {
    setBaseFormula(prev => prev + ` ${field}`);
  }, []);

  const handleSave = useCallback(() => {
    if (!baseFormula.trim()) {
      toast({
        title: "Error",
        description: "Base formula is required",
        variant: "destructive"
      });
      return;
    }

    const formula: FormulaConfig = {
      baseFormula: baseFormula.trim(),
      conditions
    };

    onSave(formula);
  }, [baseFormula, conditions, onSave, toast]);

  return (
    <div className="space-y-6">
      {/* Base Formula */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Base Formula
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="baseFormula">Formula Expression</Label>
            <Input
              id="baseFormula"
              value={baseFormula}
              onChange={(e) => setBaseFormula(e.target.value)}
              placeholder="e.g., total_hours * base_hourly_rate"
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Use mathematical expressions with available fields. Operators: +, -, *, /, (), etc.
            </p>
          </div>

          <div>
            <Label>Available Fields</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {AVAILABLE_FIELDS.map(field => (
                <Badge
                  key={field.value}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => insertFieldIntoFormula(field.value)}
                >
                  {field.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditional Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Conditional Multipliers
            <Button onClick={addCondition} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {conditions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No conditions added. The base formula will be used as-is.
            </p>
          ) : (
            conditions.map((condition) => (
              <div key={condition.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-5 gap-3">
                  <Select
                    value={condition.field}
                    onValueChange={(value) => updateCondition(condition.id, { field: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_FIELDS.map(field => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(condition.id, { operator: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map(op => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                    placeholder="Value"
                  />

                  <div className="flex items-center gap-2">
                    <span className="text-sm">×</span>
                    <Input
                      type="number"
                      step="0.1"
                      value={condition.multiplier}
                      onChange={(e) => updateCondition(condition.id, { multiplier: parseFloat(e.target.value) || 1 })}
                      placeholder="1.0"
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeCondition(condition.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Formula Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-3 rounded-md font-mono text-sm">
            <strong>Base:</strong> {baseFormula}
            {conditions.length > 0 && (
              <div className="mt-2">
                <strong>Conditions:</strong>
                <ul className="ml-4 mt-1">
                  {conditions.map((condition, index) => (
                    <li key={condition.id}>
                      IF {condition.field} {condition.operator} {condition.value} THEN multiply by {condition.multiplier}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Formula
        </Button>
      </div>
    </div>
  );
};

export default FormulaBuilder;