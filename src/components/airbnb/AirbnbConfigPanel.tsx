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
  const [newValueType, setNewValueType] = useState<'fixed' | 'percentage' | 'none'>('none');
  const [newTime, setNewTime] = useState(0);
  const [newTimeUnit, setNewTimeUnit] = useState<'minutes' | 'hours'>('minutes');
  const [newIcon, setNewIcon] = useState('');
  const [newMinValue, setNewMinValue] = useState<number | null>(null);
  const [newMaxValue, setNewMaxValue] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [categoryVisibility, setCategoryVisibility] = useState<Record<string, boolean>>({});
  const [editingIcon, setEditingIcon] = useState<string | null>(null);
  const [customIconUrl, setCustomIconUrl] = useState('');
  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const [iconMode, setIconMode] = useState<'lucide' | 'url'>('lucide');
  const [localChanges, setLocalChanges] = useState<Record<string, Partial<FieldConfig>>>({});

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

    // Get category_order from existing fields in that category, or use a default
    const existingCategoryConfig = configs.find(c => c.category === category);
    const categoryOrder = existingCategoryConfig?.category_order ?? 999;

    createConfig.mutate({
      category,
      option: newOption,
      label: newLabel || newOption,
      value: newValue,
      value_type: newValueType,
      time: timeInMinutes,
      icon: newIcon || null,
      min_value: newMinValue,
      max_value: newMaxValue,
      is_visible: categoryVisibility[category] ?? true,
      display_order: (groupedConfigs[category]?.length || 0) + 1,
      category_order: categoryOrder,
    } as any);

    setNewCategory('');
    setNewOption('');
    setNewLabel('');
    setNewValue(0);
    setNewTime(0);
    setNewTimeUnit('minutes');
    setNewIcon('');
    setNewMinValue(null);
    setNewMaxValue(null);
    setSelectedCategory('');
    setAddingToCategory(null);
    setShowAddDialog(false);
  };

  const renderIcon = (iconName: string | null) => {
    if (!iconName) return null;
    
    // Check if it's a URL
    if (iconName.startsWith('http://') || iconName.startsWith('https://')) {
      return <img src={iconName} alt="icon" className="h-4 w-4 object-contain" />;
    }
    
    // Otherwise treat as Lucide icon name
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) return null;
    return <IconComponent className="h-4 w-4" />;
  };

  const toggleCategoryVisibility = (category: string) => {
    const newVisibility = !categoryVisibility[category];
    setCategoryVisibility(prev => ({ ...prev, [category]: newVisibility }));
    
    // Update all fields in this category
    (groupedConfigs[category] || []).forEach(config => {
      handleUpdateConfig(config.id, { is_visible: newVisibility });
    });
  };

  const handleUpdateConfig = (id: string, updates: Partial<FieldConfig>) => {
    // If category is being changed, ensure category_order is set for the new category
    if (updates.category) {
      const existingConfig = configs.find(c => c.category === updates.category);
      if (existingConfig && !updates.category_order) {
        updates.category_order = existingConfig.category_order;
      }
    }
    updateConfig.mutate({ id, updates });
  };

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleLocalChange = (id: string, field: string, value: any) => {
    setLocalChanges(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value }
    }));
  };

  const getCurrentValue = (configId: string, field: string, defaultValue: any) => {
    return localChanges[configId]?.[field] ?? defaultValue;
  };

  const saveCategoryChanges = (category: string) => {
    const fieldsToUpdate = groupedConfigs[category] || [];
    fieldsToUpdate.forEach(config => {
      if (localChanges[config.id]) {
        handleUpdateConfig(config.id, localChanges[config.id]);
      }
    });
    setLocalChanges(prev => {
      const newChanges = { ...prev };
      fieldsToUpdate.forEach(config => {
        delete newChanges[config.id];
      });
      return newChanges;
    });
  };

  const hasCategoryChanges = (category: string) => {
    const fieldsInCategory = groupedConfigs[category] || [];
    return fieldsInCategory.some(config => localChanges[config.id]);
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

  // Simple, safe evaluator for + - * / and parentheses.
  const isOperator = (t: string) => ['+', '-', '*', '/'].includes(t);
  const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

  const toRPN = (tokens: string[]) => {
    const output: string[] = [];
    const stack: string[] = [];
    for (const tok of tokens) {
      if (isOperator(tok)) {
        while (stack.length && isOperator(stack[stack.length - 1]) && precedence[stack[stack.length - 1]] >= precedence[tok]) {
          output.push(stack.pop() as string);
        }
        stack.push(tok);
      } else if (tok === '(') {
        stack.push(tok);
      } else if (tok === ')') {
        while (stack.length && stack[stack.length - 1] !== '(') {
          output.push(stack.pop() as string);
        }
        stack.pop();
      } else {
        // number or field placeholder already converted to a number string
        output.push(tok);
      }
    }
    while (stack.length) output.push(stack.pop() as string);
    return output;
  };

  const evalRPN = (rpn: string[]) => {
    const st: number[] = [];
    for (const t of rpn) {
      if (isOperator(t)) {
        const b = st.pop();
        const a = st.pop();
        if (a === undefined || b === undefined) throw new Error('Malformed expression');
        switch (t) {
          case '+': st.push(a + b); break;
          case '-': st.push(a - b); break;
          case '*': st.push(a * b); break;
          case '/': st.push(b === 0 ? NaN : a / b); break;
        }
      } else {
        st.push(parseFloat(t));
      }
    }
    if (st.length !== 1) throw new Error('Malformed expression');
    return st[0];
  };

  const safeEvaluate = (elements: FormulaElement[]) => {
    try {
      const raw = elements.map(el => (el.value || '').trim()).filter(Boolean);
      if (raw.length === 0) return { ok: false, error: 'Empty formula' } as const;

      // Basic validation and placeholder substitution for fields -> '1'
      const allowed = /^[a-zA-Z0-9_\.()+\-*/]+$/;
      const tokens: string[] = raw.map(tok => {
        if (['(', ')', '+', '-', '*', '/'].includes(tok)) return tok;
        if (!isNaN(Number(tok))) return String(Number(tok));
        // treat anything else (field identifiers) as 1 for sample evaluation
        if (!allowed.test(tok)) throw new Error(`Invalid token: ${tok}`);
        return '1';
      });

      // Parentheses balance check
      let bal = 0;
      for (const t of tokens) {
        if (t === '(') bal++;
        else if (t === ')') bal--;
        if (bal < 0) throw new Error('Parentheses are not balanced');
      }
      if (bal !== 0) throw new Error('Parentheses are not balanced');

      const rpn = toRPN(tokens);
      const result = evalRPN(rpn);
      if (!isFinite(result)) throw new Error('Computation error');
      return { ok: true, result } as const;
    } catch (e: any) {
      return { ok: false, error: e.message || 'Invalid formula' } as const;
    }
  };

  const formulaText = (currentFormula.elements || []).map(el => el.value).join(' ');
  const evaluation = React.useMemo(() => safeEvaluate(currentFormula.elements || []), [currentFormula.elements]);
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
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                    <div>
                      <Label>Value Type</Label>
                      <Select value={newValueType} onValueChange={(v: any) => setNewValueType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="fixed">Fixed (Price)</SelectItem>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Min Value</Label>
                      <Input
                        type="number"
                        value={newMinValue || ''}
                        onChange={(e) => setNewMinValue(e.target.value ? Number(e.target.value) : null)}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <Label>Max Value</Label>
                      <Input
                        type="number"
                        value={newMaxValue || ''}
                        onChange={(e) => setNewMaxValue(e.target.value ? Number(e.target.value) : null)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Icon URL or Lucide Name</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        value={newIcon}
                        onChange={(e) => setNewIcon(e.target.value)}
                        placeholder="https://... or 'Home', 'Bath', etc."
                      />
                      {newIcon && (
                        <div className="h-8 w-8 flex items-center justify-center border rounded">
                          {renderIcon(newIcon)}
                        </div>
                      )}
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
                        onFocus={(e) => e.target.select()}
                      />
                      {newMinValue !== null && newMaxValue !== null && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Per unit above minimum (e.g., min=1, value=3 → (3-1) × time)
                        </p>
                      )}
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
                  <Button onClick={handleAddField} className="w-full">
                    Add Field
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

          <div className="space-y-4">
            {categories.map((category) => (
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
                            ({(groupedConfigs[category]?.length || 0)} fields)
                          </span>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <span className="text-xs text-muted-foreground mr-2">
                            {categoryVisibility[category] === false ? 'Hidden' : 'Visible'}
                          </span>
                          <Switch
                            checked={categoryVisibility[category] !== false}
                            onCheckedChange={() => toggleCategoryVisibility(category)}
                          />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 space-y-2 border-t">
                        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground pb-2 border-b">
                          <div className="col-span-2">Label</div>
                          <div className="col-span-1">Min</div>
                          <div className="col-span-1">Max</div>
                          <div className="col-span-1">Icon</div>
                          <div className="col-span-1"></div>
                          <div className="col-span-2">Value</div>
                          <div className="col-span-1">Type</div>
                          <div className="col-span-2">Time (min)</div>
                          <div className="col-span-1">Actions</div>
                        </div>
                        {(groupedConfigs[category] || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0)).map((config) => (
                          <div key={config.id} className="grid grid-cols-12 gap-2 items-center p-2 border rounded hover:bg-muted/30 transition-colors">
                            <div className="col-span-2">
                              <Input
                                value={getCurrentValue(config.id, 'label', config.label || config.option)}
                                onChange={(e) => handleLocalChange(config.id, 'label', e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-1">
                              <Input
                                type="number"
                                value={(() => {
                                  const val = getCurrentValue(config.id, 'min_value', (config as any).min_value);
                                  return val !== null && val !== undefined ? Number(val) : '';
                                })()}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleLocalChange(config.id, 'min_value', val === '' ? null : Number(val));
                                }}
                                className="h-8 text-sm"
                                placeholder="Min"
                              />
                            </div>
                            <div className="col-span-1">
                              <Input
                                type="number"
                                value={(() => {
                                  const val = getCurrentValue(config.id, 'max_value', config.max_value);
                                  return val !== null && val !== undefined ? Number(val) : '';
                                })()}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleLocalChange(config.id, 'max_value', val === '' ? null : Number(val));
                                }}
                                className="h-8 text-sm"
                                placeholder="Max"
                              />
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <Dialog open={editingIcon === config.id} onOpenChange={(open) => !open && setEditingIcon(null)}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      setEditingIcon(config.id);
                                      setCustomIconUrl(config.icon || '');
                                    }}
                                  >
                                    {renderIcon(config.icon) || <Upload className="h-4 w-4" />}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Set Icon</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <Tabs value={iconMode} onValueChange={(v: any) => setIconMode(v)}>
                                      <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="lucide">Lucide Icons</TabsTrigger>
                                        <TabsTrigger value="url">Custom URL</TabsTrigger>
                                      </TabsList>
                                      
                                      <TabsContent value="lucide" className="space-y-4">
                                        <div>
                                          <Label>Search Icons</Label>
                                          <Input
                                            value={iconSearchQuery}
                                            onChange={(e) => setIconSearchQuery(e.target.value)}
                                            placeholder="Search by name..."
                                            className="mb-4"
                                          />
                                        </div>
                                        <div className="grid grid-cols-6 gap-2 max-h-[400px] overflow-y-auto border rounded p-2">
                                          {Object.keys(LucideIcons)
                                            .filter(name => 
                                              name !== 'createLucideIcon' && 
                                              name !== 'default' &&
                                              !name.startsWith('Lucide') &&
                                              name.toLowerCase().includes(iconSearchQuery.toLowerCase())
                                            )
                                            .slice(0, 100)
                                            .map(iconName => {
                                              const IconComponent = (LucideIcons as any)[iconName];
                                              return (
                                                <button
                                                  key={iconName}
                                                  onClick={() => setCustomIconUrl(iconName)}
                                                  className={`flex flex-col items-center justify-center p-2 border rounded hover:bg-muted transition-colors ${customIconUrl === iconName ? 'bg-primary text-primary-foreground' : ''}`}
                                                  title={iconName}
                                                >
                                                  <IconComponent className="h-6 w-6" />
                                                  <span className="text-[8px] mt-1 truncate w-full text-center">{iconName}</span>
                                                </button>
                                              );
                                            })}
                                        </div>
                                      </TabsContent>
                                      
                                      <TabsContent value="url" className="space-y-4">
                                        <div>
                                          <Label>Image URL</Label>
                                          <Input
                                            value={customIconUrl}
                                            onChange={(e) => setCustomIconUrl(e.target.value)}
                                            placeholder="https://example.com/icon.png"
                                          />
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Enter a direct URL to an image file
                                          </p>
                                        </div>
                                        <div className="flex justify-center p-8 border rounded bg-muted/20">
                                          {customIconUrl && (customIconUrl.startsWith('http://') || customIconUrl.startsWith('https://')) ? (
                                            <img src={customIconUrl} alt="Preview" className="max-h-16 max-w-16 object-contain" />
                                          ) : (
                                            <span className="text-muted-foreground">Preview</span>
                                          )}
                                        </div>
                                      </TabsContent>
                                    </Tabs>
                                    
                                    <div className="flex justify-center p-4 border rounded">
                                      {renderIcon(customIconUrl) || <span className="text-muted-foreground">Icon preview</span>}
                                    </div>
                                    
                                    <Button
                                      onClick={() => {
                                        handleUpdateConfig(config.id, { icon: customIconUrl });
                                        setEditingIcon(null);
                                        setIconSearchQuery('');
                                      }}
                                      className="w-full"
                                    >
                                      Save Icon
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                            <div className="col-span-1 border-r-2 border-muted"></div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                step="0.5"
                                value={getCurrentValue(config.id, 'value', config.value)}
                                onChange={(e) => handleLocalChange(config.id, 'value', Number(e.target.value))}
                                onFocus={(e) => e.target.select()}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-1">
                              <Select 
                                value={getCurrentValue(config.id, 'value_type', config.value_type)} 
                                onValueChange={(v) => handleLocalChange(config.id, 'value_type', v)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">-</SelectItem>
                                  <SelectItem value="fixed">£</SelectItem>
                                  <SelectItem value="percentage">%</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-2">
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  step="1"
                                  value={getCurrentValue(config.id, 'time', config.time) || 0}
                                  onChange={(e) => handleLocalChange(config.id, 'time', Number(e.target.value))}
                                  onFocus={(e) => e.target.select()}
                                  className="h-8 text-sm"
                                  placeholder="0"
                                  title={config.min_value !== null && config.max_value !== null ? `Per unit above min (${config.min_value})` : undefined}
                                />
                                {config.min_value !== null && config.max_value !== null && (
                                  <p className="text-[10px] text-muted-foreground">
                                    × (value - {config.min_value})
                                  </p>
                                )}
                              </div>
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
                        <div className="pt-2 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setAddingToCategory(category);
                              setShowAddDialog(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Field
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() => saveCategoryChanges(category)}
                            disabled={!hasCategoryChanges(category)}
                          >
                            Save Changes
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
              <h2 className="text-2xl font-bold mb-2">Create New Formula</h2>
              <p className="text-muted-foreground mb-4">Build calculations for the system</p>
              <Button 
                onClick={() => {
                  setCurrentFormula({ name: '', description: '', elements: [], result_type: 'cost' });
                  setIsEditingFormula(false);
                  setShowFormulaBuilder(true);
                }}
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Start Building
              </Button>
            </div>
          </Card>

          {(showFormulaBuilder || currentFormula.name || (currentFormula.elements && currentFormula.elements.length > 0) || isEditingFormula) && (
            <Card className="p-6 border-2 border-primary/30 bg-primary/5">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-primary">Formula Builder</h2>
                  <p className="text-muted-foreground">
                    {isEditingFormula ? 'Editing' : 'Creating'}
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
                  Cancel
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Formula Name</Label>
                  <Input
                    value={currentFormula.name}
                    onChange={(e) => setCurrentFormula({...currentFormula, name: e.target.value})}
                    placeholder="e.g. Base Price"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={currentFormula.description || ''}
                    onChange={(e) => setCurrentFormula({...currentFormula, description: e.target.value})}
                    placeholder="What does the formula calculate?"
                  />
                </div>
                <div>
                  <Label>Result Type</Label>
                  <Select 
                    value={currentFormula.result_type} 
                    onValueChange={(v: any) => setCurrentFormula({...currentFormula, result_type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cost">Cost (£)</SelectItem>
                      <SelectItem value="time">Time (minutes)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label>Formula</Label>
                    <Input
                      value={currentFormula.elements?.map(el => el.value).join(' ') || ''}
                      onChange={(e) => {
                        const formulaText = e.target.value;
                        const elements = formulaText.split(' ').filter(s => s.trim()).map(part => {
                          const trimmed = part.trim();
                          if (['+', '-', '*', '/', '(', ')'].includes(trimmed)) {
                            return { type: 'operator' as const, value: trimmed };
                          } else if (!isNaN(Number(trimmed))) {
                            return { type: 'number' as const, value: trimmed, label: trimmed };
                          } else {
                            return { type: 'field' as const, value: trimmed, label: trimmed };
                          }
                        });
                        setCurrentFormula({...currentFormula, elements});
                      }}
                      placeholder="e.g. bedrooms.value * 3 + bathrooms.time / 2"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Write your formula or use the field selector →
                    </p>
                  </div>
                  <div>
                    <Label>Add Fields</Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {availableFields.map((field) => (
                        <Select 
                          key={field.value}
                          onValueChange={(attribute) => {
                            const newElement = { 
                              type: 'field' as const, 
                              value: `${field.value}.${attribute}`,
                              attribute: attribute,
                              label: `${field.label}.${attribute}` 
                            };
                            setCurrentFormula({
                              ...currentFormula,
                              elements: [...(currentFormula.elements || []), newElement]
                            });
                          }}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder={field.label} />
                          </SelectTrigger>
                          <SelectContent className="z-50 bg-background">
                            <SelectItem value="value">Value</SelectItem>
                            <SelectItem value="time">Time</SelectItem>
                            <SelectItem value="min_value">Min Value</SelectItem>
                            <SelectItem value="max_value">Max Value</SelectItem>
                          </SelectContent>
                        </Select>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Formula Preview</Label>
                  <div className="p-3 border rounded bg-muted/20 min-h-[60px]">
                    {currentFormula.elements && currentFormula.elements.length > 0 ? (
                      <div className="flex flex-wrap gap-1 items-center">
                        {currentFormula.elements.map((el, idx) => (
                          <span 
                            key={idx} 
                            className={`px-2 py-1 rounded text-sm ${
                              el.type === 'field' 
                                ? 'bg-blue-100 text-blue-800' 
                                : el.type === 'operator' 
                                ? 'bg-gray-100 text-gray-800 font-bold' 
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {el.label || el.value}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Formula preview will appear here...</span>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Validation</Label>
                  <div className="p-3 border rounded bg-background">
                    {evaluation.ok ? (
                      <span className="text-sm">Looks valid. Sample result with demo data: <strong>{Number((evaluation as any).result).toFixed(2)}</strong></span>
                    ) : (
                      <span className="text-sm text-destructive">{(evaluation as any).error}</span>
                    )}
                  </div>
                </div>

                <Button onClick={saveFormula} className="w-full">
                  Save Formula
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
