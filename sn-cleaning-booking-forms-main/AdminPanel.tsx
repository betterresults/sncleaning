import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Plus, Trash2 } from 'lucide-react';

interface OptionConfig {
  id: string;
  category: string;
  option: string;
  value: number;
  valueType: 'fixed' | 'percentage';
  time: number;
}

interface FormulaElement {
  type: 'field' | 'operator' | 'number';
  value: string;
  label?: string;
}

interface Formula {
  id: string;
  name: string;
  description: string;
  elements: FormulaElement[];
  resultType: 'cost' | 'time' | 'percentage';
}

const AdminPanel: React.FC = () => {
  const [configs, setConfigs] = useState<OptionConfig[]>([
    // Property Type
    { id: '1', category: 'Property Type', option: 'Flat', value: 0, valueType: 'fixed', time: 0 },
    { id: '2', category: 'Property Type', option: 'House', value: 0, valueType: 'fixed', time: 1 },
    
    // Bedrooms
    { id: '3', category: 'Bedrooms', option: 'Studio', value: 0, valueType: 'fixed', time: 1.5 },
    { id: '4', category: 'Bedrooms', option: '1', value: 0, valueType: 'fixed', time: 2 },
    { id: '5', category: 'Bedrooms', option: '2', value: 0, valueType: 'fixed', time: 2.5 },
    { id: '6', category: 'Bedrooms', option: '3', value: 0, valueType: 'fixed', time: 3 },
    { id: '7', category: 'Bedrooms', option: '4', value: 0, valueType: 'fixed', time: 4 },
    { id: '8', category: 'Bedrooms', option: '5', value: 0, valueType: 'fixed', time: 5 },
    { id: '9', category: 'Bedrooms', option: '6+', value: 0, valueType: 'fixed', time: 6 },
    
    // Bathrooms
    { id: '10', category: 'Bathrooms', option: '1', value: 0, valueType: 'fixed', time: 0.5 },
    { id: '11', category: 'Bathrooms', option: '2', value: 0, valueType: 'fixed', time: 1 },
    { id: '12', category: 'Bathrooms', option: '3', value: 0, valueType: 'fixed', time: 1.5 },
    { id: '13', category: 'Bathrooms', option: '4', value: 0, valueType: 'fixed', time: 2 },
    { id: '14', category: 'Bathrooms', option: '5', value: 0, valueType: 'fixed', time: 2.5 },
    { id: '15', category: 'Bathrooms', option: '6+', value: 0, valueType: 'fixed', time: 3 },
    
    // Additional Rooms
    { id: '16', category: 'Additional Rooms', option: 'Toilets (each)', value: 0, valueType: 'fixed', time: 0.25 },
    { id: '17', category: 'Additional Rooms', option: 'Study Rooms (each)', value: 0, valueType: 'fixed', time: 0.25 },
    { id: '18', category: 'Additional Rooms', option: 'Utility Rooms (each)', value: 0, valueType: 'fixed', time: 0.25 },
    { id: '19', category: 'Additional Rooms', option: 'Other Rooms (each)', value: 0, valueType: 'fixed', time: 0.25 },
    
    // Service Type
    { id: '20', category: 'Service Type', option: 'Check-in/Check-out Cleaning', value: 23, valueType: 'fixed', time: 0 },
    { id: '21', category: 'Service Type', option: 'Mid-stay Cleaning', value: 20, valueType: 'fixed', time: 0 },
    { id: '22', category: 'Service Type', option: 'Light Cleaning', value: 19, valueType: 'fixed', time: -1 },
    { id: '23', category: 'Service Type', option: 'Deep Cleaning', value: 26, valueType: 'fixed', time: 1.3 },
    
    // Property Already Cleaned (Airbnb Standard)
    { id: '24', category: 'Airbnb Standard', option: 'Yes - property up to standard', value: 0, valueType: 'fixed', time: 0 },
    { id: '25', category: 'Airbnb Standard', option: 'No - needs intensive cleaning', value: 5, valueType: 'fixed', time: 1.3 },
    
    // Oven Cleaning
    { id: '26', category: 'Oven Cleaning', option: 'No oven cleaning required', value: 0, valueType: 'fixed', time: 0 },
    { id: '27', category: 'Oven Cleaning', option: 'Yes - professional oven cleaning', value: 0, valueType: 'fixed', time: 1 },
    
    // Oven Size/Type
    { id: '101', category: 'Oven Size/Type', option: 'Small oven (single)', value: 59, valueType: 'fixed', time: 0 },
    { id: '102', category: 'Oven Size/Type', option: 'Standard oven (double)', value: 79, valueType: 'fixed', time: 0.5 },
    { id: '103', category: 'Oven Size/Type', option: 'Large oven (range cooker)', value: 139, valueType: 'fixed', time: 1 },
    { id: '104', category: 'Oven Size/Type', option: 'Commercial oven', value: 139, valueType: 'fixed', time: 1.5 },
    { id: '105', category: 'Oven Size/Type', option: 'AGA/Rayburn', value: 149, valueType: 'fixed', time: 1.5 },
    
    // Cleaning Products
    { id: '28', category: 'Cleaning Products', option: 'Customer provides everything', value: 0, valueType: 'fixed', time: 0 },
    { id: '29', category: 'Cleaning Products', option: 'Bring cleaning products', value: 2, valueType: 'fixed', time: 0 },
    { id: '30', category: 'Cleaning Products', option: 'Bring products & equipment', value: 5, valueType: 'fixed', time: 0 },
    
    // Linen Handling
    { id: '31', category: 'Linen Handling', option: 'Customer handles linens', value: 0, valueType: 'fixed', time: 0 },
    { id: '32', category: 'Linen Handling', option: 'Wash and hang dry', value: 15, valueType: 'fixed', time: 0.5 },
    { id: '33', category: 'Linen Handling', option: 'Wash and tumble dry', value: 20, valueType: 'fixed', time: 0.5 },
    { id: '34', category: 'Linen Handling', option: 'Order linens from us', value: 0, valueType: 'fixed', time: 0 },
    
    // Scheduling Rush Fees
    { id: '35', category: 'Scheduling', option: 'Same day booking', value: 44, valueType: 'fixed', time: 0 },
    { id: '36', category: 'Scheduling', option: 'Within 12 hours', value: 30, valueType: 'fixed', time: 0 },
    { id: '37', category: 'Scheduling', option: 'Within 24 hours', value: 20, valueType: 'fixed', time: 0 },
    { id: '38', category: 'Scheduling', option: 'Within 48 hours', value: 10, valueType: 'fixed', time: 0 },
    
    // Time Flexibility
    { id: '39', category: 'Time Flexibility', option: 'Specific time', value: 0, valueType: 'fixed', time: 0 },
    { id: '40', category: 'Time Flexibility', option: 'Flexible time', value: 0, valueType: 'fixed', time: 0 },
    
    // Linen Packages
    { id: '41', category: 'Linen Packages', option: 'Single Bed Package', value: 19.95, valueType: 'fixed', time: 0 },
    { id: '42', category: 'Linen Packages', option: 'Double Bed Package', value: 23.95, valueType: 'fixed', time: 0 },
    { id: '43', category: 'Linen Packages', option: 'King Bed Package', value: 25.75, valueType: 'fixed', time: 0 },
    { id: '44', category: 'Linen Packages', option: 'Super King Package', value: 26.75, valueType: 'fixed', time: 0 },
    { id: '45', category: 'Linen Packages', option: 'Bath Mat', value: 2.80, valueType: 'fixed', time: 0 },
    { id: '46', category: 'Linen Packages', option: 'Bath Sheet', value: 3.10, valueType: 'fixed', time: 0 },
    { id: '47', category: 'Linen Packages', option: 'Bath Robe', value: 6.50, valueType: 'fixed', time: 0 },
    { id: '48', category: 'Linen Packages', option: 'Tea Towel', value: 1.30, valueType: 'fixed', time: 0 },
  ]);

  const [formulas, setFormulas] = useState<Formula[]>([
    {
      id: '1',
      name: 'Cost Per Hour',
      description: 'Hourly rate based on service type, products, and property standard',
      elements: [
        { type: 'field', value: 'serviceType', label: 'Service Type' },
        { type: 'operator', value: '+' },
        { type: 'field', value: 'cleaningProducts', label: 'Cleaning Products' },
        { type: 'operator', value: '+' },
        { type: 'field', value: 'airbnbStandard', label: 'Airbnb Standard' }
      ],
      resultType: 'cost'
    },
    {
      id: '2',
      name: 'Recommended Booking Time',
      description: 'Calculate total time needed including deep clean multiplier (x1.3 for deep cleaning or non-standard properties)',
      elements: [
        { type: 'operator', value: '(' },
        { type: 'field', value: 'propertyType', label: 'Property Type' },
        { type: 'operator', value: '+' },
        { type: 'field', value: 'bedrooms', label: 'Bedrooms' },
        { type: 'operator', value: '+' },
        { type: 'field', value: 'bathrooms', label: 'Bathrooms' },
        { type: 'operator', value: '+' },
        { type: 'field', value: 'additionalRooms', label: 'Additional Rooms' },
        { type: 'operator', value: '+' },
        { type: 'field', value: 'ovenCleaning', label: 'Oven Cleaning' },
        { type: 'operator', value: '+' },
        { type: 'field', value: 'linenHandling', label: 'Linen Handling' },
        { type: 'operator', value: ')' },
        { type: 'operator', value: '*' },
        { type: 'number', value: '1.3', label: '1.3 (if Deep Clean or Intensive Cleaning needed)' }
      ],
      resultType: 'time'
    }
  ]);

  const [currentFormula, setCurrentFormula] = useState<Formula>({
    id: '',
    name: '',
    description: '',
    elements: [],
    resultType: 'cost'
  });

  const [isEditingFormula, setIsEditingFormula] = useState(false);
  const [showFormulaBuilder, setShowFormulaBuilder] = useState(false);

  const updateConfig = (id: string, field: 'value' | 'time' | 'valueType', newValue: number | string) => {
    setConfigs(configs.map(config => 
      config.id === id ? { ...config, [field]: newValue } : config
    ));
  };

  const groupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, OptionConfig[]>);

  const availableFields = [
    { value: 'propertyType', label: 'Property Type' },
    { value: 'bedrooms', label: 'Bedrooms' },
    { value: 'bathrooms', label: 'Bathrooms' },
    { value: 'additionalRooms', label: 'Additional Rooms' },
    { value: 'serviceType', label: 'Service Type' },
    { value: 'airbnbStandard', label: 'Airbnb Standard' },
    { value: 'ovenCleaning', label: 'Oven Cleaning' },
    { value: 'cleaningProducts', label: 'Cleaning Products' },
    { value: 'linenHandling', label: 'Linen Handling' },
    { value: 'scheduling', label: 'Scheduling' },
    { value: 'timeFlexibility', label: 'Time Flexibility' }
  ];

  const operators = [
    { value: '+', label: 'Add (+)' },
    { value: '-', label: 'Subtract (-)' },
    { value: '*', label: 'Multiply (×)' },
    { value: '/', label: 'Divide (÷)' },
    { value: '(', label: 'Open (' },
    { value: ')', label: 'Close )' }
  ];

  const addToFormula = (element: FormulaElement) => {
    setCurrentFormula({
      ...currentFormula,
      elements: [...currentFormula.elements, element]
    });
  };

  const removeFromFormula = (index: number) => {
    setCurrentFormula({
      ...currentFormula,
      elements: currentFormula.elements.filter((_, i) => i !== index)
    });
  };

  const saveFormula = () => {
    if (currentFormula.name && currentFormula.elements.length > 0) {
      if (currentFormula.id) {
        setFormulas(formulas.map(f => f.id === currentFormula.id ? currentFormula : f));
      } else {
        setFormulas([...formulas, { ...currentFormula, id: Date.now().toString() }]);
      }
      setCurrentFormula({ id: '', name: '', description: '', elements: [], resultType: 'cost' });
      setIsEditingFormula(false);
    }
  };

  const editFormula = (formula: Formula) => {
    setCurrentFormula(formula);
    setIsEditingFormula(true);
  };

  const deleteFormula = (id: string) => {
    setFormulas(formulas.filter(f => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Booking Form Configuration
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure calculation formulas and field values
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="formulas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="formulas">Calculation Formulas</TabsTrigger>
            <TabsTrigger value="fields">Field Configuration</TabsTrigger>
          </TabsList>

          {/* Formulas Tab */}
          <TabsContent value="formulas">
            <div className="space-y-6">
              
              {/* Add New Formula Button */}
              <Card className="p-6 bg-primary/5 border-primary/20">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Create New Formula</h2>
                  <p className="text-muted-foreground mb-4">Build custom calculations for your booking system</p>
                  <Button 
                    onClick={() => {
                      setCurrentFormula({ id: '', name: '', description: '', elements: [], resultType: 'cost' });
                      setIsEditingFormula(false);
                      setShowFormulaBuilder(true);
                    }}
                    className="bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Start Building New Formula
                  </Button>
                </div>
              </Card>
              {/* Formula Builder - Only show when building */}
              {(showFormulaBuilder || currentFormula.name || currentFormula.elements.length > 0 || isEditingFormula) && (
              <Card className="p-6 border-2 border-primary/30 bg-primary/5">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-primary">Formula Builder</h2>
                    <p className="text-muted-foreground">
                      {isEditingFormula ? 'Editing existing formula' : 'Creating new formula'}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCurrentFormula({ id: '', name: '', description: '', elements: [], resultType: 'cost' });
                      setIsEditingFormula(false);
                      setShowFormulaBuilder(false);
                    }}
                  >
                    Cancel & Clear
                  </Button>
                </div>
                
                {/* Step 1: Choose what you're calculating */}
                <Card className="p-4 mb-6 bg-background">
                  <h3 className="text-lg font-medium mb-3">Step 1: What are you calculating?</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant={currentFormula.resultType === 'cost' ? 'default' : 'outline'}
                      onClick={() => setCurrentFormula({...currentFormula, resultType: 'cost'})}
                      className="h-16 flex flex-col"
                    >
                      <span className="text-lg">💰</span>
                      <span>Money (£)</span>
                    </Button>
                    <Button
                      variant={currentFormula.resultType === 'time' ? 'default' : 'outline'}
                      onClick={() => setCurrentFormula({...currentFormula, resultType: 'time'})}
                      className="h-16 flex flex-col"
                    >
                      <span className="text-lg">⏰</span>
                      <span>Time (hours)</span>
                    </Button>
                    <Button
                      variant={currentFormula.resultType === 'percentage' ? 'default' : 'outline'}
                      onClick={() => setCurrentFormula({...currentFormula, resultType: 'percentage'})}
                      className="h-16 flex flex-col"
                    >
                      <span className="text-lg">📊</span>
                      <span>Percentage (%)</span>
                    </Button>
                  </div>
                </Card>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Formula Creation */}
                  <div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="formula-name">Formula Name *</Label>
                        <Input
                          id="formula-name"
                          value={currentFormula.name}
                          onChange={(e) => setCurrentFormula({...currentFormula, name: e.target.value})}
                          placeholder="e.g., Base Cleaning Cost"
                        />
                      </div>
                      <div>
                        <Label htmlFor="formula-description">Description</Label>
                        <Input
                          id="formula-description"
                          value={currentFormula.description}
                          onChange={(e) => setCurrentFormula({...currentFormula, description: e.target.value})}
                          placeholder="What does this formula calculate?"
                        />
                      </div>
                      <div>
                        <Label htmlFor="result-type">What are you calculating? *</Label>
                        <select
                          id="result-type"
                          value={currentFormula.resultType}
                          onChange={(e) => setCurrentFormula({...currentFormula, resultType: e.target.value as any})}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        >
                          <option value="cost">Money (£)</option>
                          <option value="time">Time (hours)</option>
                          <option value="percentage">Percentage (%)</option>
                        </select>
                      </div>
                    </div>

                    {/* Add Elements */}
                    <div className="mt-6">
                      <h3 className="font-medium mb-3">Build Your Formula</h3>
                      <div className="space-y-4">
                        <div>
                          <Label>1. Choose Fields to Include</Label>
                          <div className="grid grid-cols-1 gap-2 mt-2">
                            {availableFields.map(field => (
                              <Button
                                key={field.value}
                                variant="outline"
                                size="sm"
                                onClick={() => addToFormula({ type: 'field', value: field.value, label: field.label })}
                                className="justify-start text-left"
                              >
                                + {field.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label>2. Add Operators</Label>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {operators.map(op => (
                              <Button
                                key={op.value}
                                variant="outline"
                                size="sm"
                                onClick={() => addToFormula({ type: 'operator', value: op.value })}
                              >
                                {op.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label>3. Add Numbers</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              type="number"
                              placeholder="Enter number and press Enter"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const target = e.target as HTMLInputElement;
                                  if (target.value) {
                                    addToFormula({ type: 'number', value: target.value });
                                    target.value = '';
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Current Formula Preview */}
                  <div>
                    <h3 className="font-medium mb-3">Current Formula Preview</h3>
                    <div className="border rounded-lg p-4 min-h-32 bg-muted/20">
                      {currentFormula.elements.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <p className="font-medium">No formula built yet</p>
                          <p className="text-sm">Click the buttons on the left to build your formula</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {currentFormula.elements.map((element, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1 px-3 py-1 bg-primary/10 border border-primary/20 rounded text-sm cursor-pointer hover:bg-primary/20"
                                onClick={() => removeFromFormula(index)}
                                title="Click to remove"
                              >
                                <span>
                                  {element.type === 'field' ? element.label : element.value}
                                </span>
                                <span className="text-xs text-muted-foreground ml-1">×</span>
                              </div>
                            ))}
                          </div>
                          
                          {/* Sample Calculation */}
                          <div className="mt-4 p-3 bg-card border rounded">
                            <h4 className="font-medium mb-2">Sample Preview:</h4>
                            <p className="text-sm text-muted-foreground">
                              {currentFormula.resultType === 'cost' && 'Result: £125.50'}
                              {currentFormula.resultType === 'time' && 'Result: 4.5 hours'}
                              {currentFormula.resultType === 'percentage' && 'Result: 15%'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              This is just an example - actual values will depend on selected options
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={saveFormula} 
                      className="w-full mt-4 bg-primary hover:bg-primary/90" 
                      disabled={!currentFormula.name || currentFormula.elements.length === 0}
                    >
                      {isEditingFormula ? 'Update Formula' : 'Save Formula'}
                    </Button>
                    
                    {(!currentFormula.name || currentFormula.elements.length === 0) && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {!currentFormula.name ? 'Please enter a formula name' : 'Please add elements to your formula'}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
              )}

              {/* Existing Formulas */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Saved Formulas</h2>
                <div className="space-y-4">
                  {formulas.map(formula => (
                    <div key={formula.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{formula.name}</h3>
                          <p className="text-sm text-muted-foreground">{formula.description}</p>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {formula.resultType === 'cost' ? 'Cost (£)' : formula.resultType === 'time' ? 'Time (hrs)' : 'Percentage (%)'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => editFormula(formula)}>
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteFormula(formula.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 text-sm">
                        {formula.elements.map((element, index) => (
                          <span key={index} className="px-2 py-1 bg-muted rounded">
                            {element.type === 'field' ? element.label : element.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Fields Configuration Tab */}
          <TabsContent value="fields">
            <div className="space-y-6">
              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={() => {
                    // Save configurations to localStorage
                    localStorage.setItem('bookingConfigs', JSON.stringify(configs));
                    alert('Configuration saved successfully!');
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  Save All Changes
                </Button>
              </div>
              
              <div className="space-y-8">
              {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => (
                <Card key={category} className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-foreground">{category}</h2>
                  
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="grid grid-cols-4 gap-4 pb-2 border-b border-border">
                      <div className="font-medium text-muted-foreground">Option</div>
                      <div className="font-medium text-muted-foreground">Value</div>
                      <div className="font-medium text-muted-foreground">Type</div>
                      <div className="font-medium text-muted-foreground">Time (hours)</div>
                    </div>
                    
                    {/* Options */}
                    {categoryConfigs.map((config) => (
                      <div key={config.id} className="grid grid-cols-4 gap-4 items-center">
                        <div className="text-foreground">{config.option}</div>
                        <div>
                          <Input
                            type="number"
                            step="0.01"
                            value={config.value}
                            onChange={(e) => updateConfig(config.id, 'value', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <select
                            value={config.valueType}
                            onChange={(e) => updateConfig(config.id, 'valueType', e.target.value)}
                            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                          >
                            <option value="fixed">£ Fixed</option>
                            <option value="percentage">% Percent</option>
                          </select>
                        </div>
                        <div>
                          <Input
                            type="number"
                            step="0.25"
                            value={config.time}
                            onChange={(e) => updateConfig(config.id, 'time', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Category Notes */}
                  <div className="mt-4 text-sm text-muted-foreground">
                    {category === 'Property Type' && 'Base cost and time for property type'}
                    {category === 'Bedrooms' && 'Additional cost and time per bedroom count'}
                    {category === 'Bathrooms' && 'Additional cost and time per bathroom count'}
                    {category === 'Additional Rooms' && 'Cost and time per additional room'}
                    {category === 'Service Type' && 'Hourly rate and time modifier for service'}
                    {category === 'Airbnb Standard' && 'Cost/time based on current property condition'}
                    {category === 'Oven Cleaning' && 'Additional service cost and time'}
                    {category === 'Cleaning Products' && 'Cost for providing supplies'}
                    {category === 'Linen Handling' && 'Additional cost and time for linen services'}
                    {category === 'Scheduling' && 'Rush fees based on booking timing'}
                    {category === 'Time Flexibility' && 'Discount/premium for time flexibility'}
                    {category === 'Linen Packages' && 'Fixed prices for linen packages'}
                  </div>
                </Card>
              ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;
