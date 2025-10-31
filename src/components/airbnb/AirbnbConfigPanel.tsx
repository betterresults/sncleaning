import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Eye, EyeOff, GripVertical, Upload } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { 
  useAirbnbFieldConfigs,
  useAllAirbnbCategories,
  useCreateFieldConfig, 
  useUpdateFieldConfig, 
  useDeleteFieldConfig,
  FieldConfig 
} from '@/hooks/useAirbnbFieldConfigs';
import {
  useAirbnbPricingFormulas,
  useCreatePricingFormula,
  useUpdatePricingFormula,
  useDeletePricingFormula,
  FormulaElement,
  PricingFormula
} from '@/hooks/useAirbnbPricingFormulas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export const AirbnbConfigPanel: React.FC = () => {
  const { data: configs = [], isLoading: configsLoading } = useAirbnbFieldConfigs();
  const { data: categories = [], isLoading: categoriesLoading } = useAllAirbnbCategories();
  const { data: formulas = [], isLoading: formulasLoading } = useAirbnbPricingFormulas();
  
  const createConfig = useCreateFieldConfig();
  const updateConfig = useUpdateFieldConfig();
  const deleteConfig = useDeleteFieldConfig();
  
  const createFormula = useCreatePricingFormula();
  const updateFormula = useUpdatePricingFormula();
  const deleteFormula = useDeletePricingFormula();

  const [newCategory, setNewCategory] = useState('');
  const [newOption, setNewOption] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState(0);
  const [newValueType, setNewValueType] = useState<'fixed' | 'percentage'>('fixed');
  const [newTime, setNewTime] = useState(0);
  const [newTimeUnit, setNewTimeUnit] = useState<'minutes' | 'hours'>('minutes');
  const [newIcon, setNewIcon] = useState('');
  const [newMaxValue, setNewMaxValue] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const [currentFormula, setCurrentFormula] = useState<Partial<PricingFormula>>({
    name: '',
    description: '',
    elements: [],
    result_type: 'cost'
  });
  const [isEditingFormula, setIsEditingFormula] = useState(false);
  const [showFormulaBuilder, setShowFormulaBuilder] = useState(false);

  const groupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, FieldConfig[]>);

  const handleAddField = () => {
    const category = addingToCategory || selectedCategory || newCategory;
    if (!category || !newOption) return;

    // Convert time to minutes if in hours
    const timeInMinutes = newTimeUnit === 'hours' ? newTime * 60 : newTime;

    createConfig.mutate({
      category,
      option: newOption,
      label: newLabel || newOption,
      value: newValue,
      value_type: newValueType,
      time: timeInMinutes,
      icon: newIcon || null,
      max_value: newMaxValue,
      is_visible: true,
      display_order: (groupedConfigs[category]?.length || 0) + 1,
    });

    setNewCategory('');
    setNewOption('');
    setNewLabel('');
    setNewValue(0);
    setNewTime(0);
    setNewTimeUnit('minutes');
    setNewIcon('');
    setNewMaxValue(null);
    setSelectedCategory('');
    setAddingToCategory(null);
    setShowAddDialog(false);
  };

  const renderIcon = (iconName: string | null) => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) return <span className="text-xs text-muted-foreground">{iconName}</span>;
    return <IconComponent className="h-4 w-4" />;
  };

  const handleUpdateConfig = (id: string, updates: Partial<FieldConfig>) => {
    updateConfig.mutate({ id, updates });
  };

  const toggleVisibility = (id: string, currentVisibility: boolean | null) => {
    handleUpdateConfig(id, { is_visible: !currentVisibility });
  };

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  // Formula builder functions
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
      elements: [...(currentFormula.elements || []), element]
    });
  };

  const removeFromFormula = (index: number) => {
    setCurrentFormula({
      ...currentFormula,
      elements: currentFormula.elements?.filter((_, i) => i !== index) || []
    });
  };

  const saveFormula = () => {
    if (currentFormula.name && currentFormula.elements && currentFormula.elements.length > 0) {
      if (currentFormula.id) {
        updateFormula.mutate({ 
          id: currentFormula.id, 
          updates: {
            name: currentFormula.name,
            description: currentFormula.description || null,
            elements: currentFormula.elements,
            result_type: currentFormula.result_type || 'cost',
          }
        });
      } else {
        createFormula.mutate({
          name: currentFormula.name,
          description: currentFormula.description || null,
          elements: currentFormula.elements,
          result_type: currentFormula.result_type || 'cost',
        });
      }
      setCurrentFormula({ name: '', description: '', elements: [], result_type: 'cost' });
      setIsEditingFormula(false);
      setShowFormulaBuilder(false);
    }
  };

  const editFormula = (formula: PricingFormula) => {
    setCurrentFormula(formula);
    setIsEditingFormula(true);
    setShowFormulaBuilder(true);
  };

  if (configsLoading || categoriesLoading || formulasLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="fields" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fields">Field Configuration</TabsTrigger>
          <TabsTrigger value="formulas">Pricing Formulas</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-6">
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Form Fields</h2>
              <p className="text-muted-foreground">Manage categories and options</p>
            </div>
              
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Field to {addingToCategory || 'Category'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {!addingToCategory && (
                    <div>
                      <Label>Category</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select existing..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-1">or create new:</p>
                      <Input
                        value={newCategory}
                        onChange={(e) => {
                          setNewCategory(e.target.value);
                          setSelectedCategory('');
                        }}
                        placeholder="New category..."
                        className="mt-1"
                      />
                    </div>
                  )}
                  <div>
                    <Label>Display Label</Label>
                    <Input
                      value={newLabel}
                      onChange={(e) => {
                        setNewLabel(e.target.value);
                        if (!newOption) setNewOption(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                      }}
                      placeholder="e.g., 'Flat', '1 Bedroom', 'Yes'..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Value</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={newValue}
                        onChange={(e) => setNewValue(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Value Type</Label>
                      <Select value={newValueType} onValueChange={(v: any) => setNewValueType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed (Price)</SelectItem>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <Label>Time</Label>
                      <Input
                        type="number"
                        step="1"
                        value={newTime}
                        onChange={(e) => setNewTime(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Select value={newTimeUnit} onValueChange={(v: any) => setNewTimeUnit(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Max Value (for counters)</Label>
                      <Input
                        type="number"
                        value={newMaxValue || ''}
                        onChange={(e) => setNewMaxValue(e.target.value ? Number(e.target.value) : null)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Icon (Lucide icon name)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newIcon}
                        onChange={(e) => setNewIcon(e.target.value)}
                        placeholder="e.g., 'Home', 'Bath', 'ChefHat'..."
                      />
                      {newIcon && renderIcon(newIcon)}
                    </div>
                  </div>
                  <Button onClick={handleAddField} className="w-full">
                    Add Field
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </Card>

          <div className="space-y-4">
            {categories.sort().map((category) => (
                <Collapsible
                  key={category}
                  open={openCategories[category]}
                  onOpenChange={() => toggleCategory(category)}
                >
                  <Card className="overflow-hidden">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <ChevronDown className={`h-5 w-5 transition-transform ${openCategories[category] ? 'rotate-180' : ''}`} />
                          <h3 className="font-bold text-lg">{category}</h3>
                          <span className="text-sm text-muted-foreground">
                            ({groupedConfigs[category]?.length || 0} fields)
                          </span>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 space-y-2 border-t">
                        <div className="grid grid-cols-11 gap-2 text-xs font-semibold text-muted-foreground pb-2 border-b">
                          <div className="col-span-2">Label</div>
                          <div className="col-span-1">Value</div>
                          <div className="col-span-2">Type</div>
                          <div className="col-span-1">Time (min)</div>
                          <div className="col-span-1">Max</div>
                          <div className="col-span-2">Icon</div>
                          <div className="col-span-1">Visible</div>
                          <div className="col-span-1">Actions</div>
                        </div>
                        {groupedConfigs[category]?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)).map((config) => (
                          <div key={config.id} className="grid grid-cols-11 gap-2 items-center p-2 border rounded hover:bg-muted/30 transition-colors">
                            <div className="col-span-2">
                              <Input
                                value={config.label || config.option}
                                onChange={(e) => handleUpdateConfig(config.id, { label: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-1">
                              <Input
                                type="number"
                                step="0.5"
                                value={config.value}
                                onChange={(e) => handleUpdateConfig(config.id, { value: Number(e.target.value) })}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <Select 
                                value={config.value_type} 
                                onValueChange={(v) => handleUpdateConfig(config.id, { value_type: v })}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fixed">Fixed</SelectItem>
                                  <SelectItem value="percentage">%</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-1">
                              <Input
                                type="number"
                                step="1"
                                value={config.time || 0}
                                onChange={(e) => handleUpdateConfig(config.id, { time: Number(e.target.value) })}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-1">
                              <Input
                                type="number"
                                value={config.max_value || ''}
                                onChange={(e) => handleUpdateConfig(config.id, { max_value: e.target.value ? Number(e.target.value) : null })}
                                className="h-8 text-sm"
                                placeholder="-"
                              />
                            </div>
                            <div className="col-span-2">
                              <div className="flex items-center gap-1">
                                {renderIcon(config.icon)}
                                <Input
                                  value={config.icon || ''}
                                  onChange={(e) => handleUpdateConfig(config.id, { icon: e.target.value })}
                                  className="h-8 text-sm flex-1"
                                  placeholder="Icon..."
                                />
                              </div>
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <Switch
                                checked={config.is_visible ?? true}
                                onCheckedChange={() => toggleVisibility(config.id, config.is_visible)}
                              />
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this field?')) {
                                    deleteConfig.mutate(config.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setAddingToCategory(category);
                              setShowAddDialog(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Field to {category}
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
        </TabsContent>

        <TabsContent value="formulas" className="space-y-6">
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Създай нова формула</h2>
              <p className="text-muted-foreground mb-4">Изгради калкулации за системата</p>
              <Button 
                onClick={() => {
                  setCurrentFormula({ name: '', description: '', elements: [], result_type: 'cost' });
                  setIsEditingFormula(false);
                  setShowFormulaBuilder(true);
                }}
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Започни изграждане
              </Button>
            </div>
          </Card>

          {(showFormulaBuilder || currentFormula.name || (currentFormula.elements && currentFormula.elements.length > 0) || isEditingFormula) && (
            <Card className="p-6 border-2 border-primary/30 bg-primary/5">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-primary">Конструктор на формули</h2>
                  <p className="text-muted-foreground">
                    {isEditingFormula ? 'Редактиране' : 'Създаване'}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCurrentFormula({ name: '', description: '', elements: [], result_type: 'cost' });
                    setIsEditingFormula(false);
                    setShowFormulaBuilder(false);
                  }}
                >
                  Отказ
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Име на формулата</Label>
                  <Input
                    value={currentFormula.name}
                    onChange={(e) => setCurrentFormula({...currentFormula, name: e.target.value})}
                    placeholder="напр. Базова цена"
                  />
                </div>
                <div>
                  <Label>Описание</Label>
                  <Input
                    value={currentFormula.description || ''}
                    onChange={(e) => setCurrentFormula({...currentFormula, description: e.target.value})}
                    placeholder="Какво изчислява формулата?"
                  />
                </div>
                <div>
                  <Label>Тип резултат</Label>
                  <Select 
                    value={currentFormula.result_type} 
                    onValueChange={(v: any) => setCurrentFormula({...currentFormula, result_type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cost">Цена (£)</SelectItem>
                      <SelectItem value="time">Време (часове)</SelectItem>
                      <SelectItem value="percentage">Процент (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Елементи</Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded min-h-[60px] bg-background">
                    {currentFormula.elements?.map((el, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                        <span>{el.label || el.value}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => removeFromFormula(idx)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Добави поле</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableFields.map((field) => (
                        <Button
                          key={field.value}
                          variant="outline"
                          size="sm"
                          onClick={() => addToFormula({ type: 'field', value: field.value, label: field.label })}
                        >
                          {field.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Добави оператор</Label>
                    <div className="flex flex-wrap gap-2">
                      {operators.map((op) => (
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
                </div>

                <Button onClick={saveFormula} className="w-full">
                  Запази формулата
                </Button>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            {formulas.map((formula) => (
              <Card key={formula.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{formula.name}</h3>
                    {formula.description && (
                      <p className="text-sm text-muted-foreground">{formula.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formula.elements.map((el, idx) => (
                        <span key={idx} className="bg-primary/10 px-2 py-1 rounded text-sm">
                          {el.label || el.value}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => editFormula(formula)}>
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => deleteFormula.mutate(formula.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
