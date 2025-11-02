import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  const [testValues, setTestValues] = useState<Record<string, any>>({});

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

  // Quick add helper to create the standard Bed Sizes category and options
  const quickAddBedSizes = () => {
    const category = 'Bed Sizes';
    const existing = groupedConfigs[category] || [];
    const existingOptions = new Set(existing.map((c) => c.option));
    const items = [
      { option: 'single', label: 'Single size bed' },
      { option: 'double', label: 'Double size bed' },
      { option: 'king', label: 'King size bed' },
      { option: 'super-king', label: 'Super King size bed' },
    ];

    const categoryOrder = configs.find((c) => c.category === category)?.category_order ?? 999;

    items.forEach((item, idx) => {
      if (!existingOptions.has(item.option)) {
        createConfig.mutate({
          category,
          option: item.option,
          label: item.label,
          value: 0,
          value_type: 'none',
          time: 0,
          icon: null,
          min_value: null,
          max_value: null,
          is_visible: true,
          display_order: existing.length + idx + 1,
          category_order: categoryOrder,
        } as any);
      }
    });
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
  // Base fields kept for backward compatibility with existing formulas
  const baseAvailableFields = [
    { value: 'propertyType', label: 'Property Type', dbCategory: 'Property Type' },
    { value: 'bedrooms', label: 'Bedrooms', dbCategory: 'Bedrooms' },
    { value: 'bathrooms', label: 'Bathrooms', dbCategory: 'Bathrooms' },
    { value: 'additionalRooms', label: 'Additional Rooms', dbCategory: 'Additional Rooms' },
    { value: 'serviceType', label: 'Service Type', dbCategory: 'Service Type' },
    { value: 'airbnbStandard', label: 'Airbnb Standard', dbCategory: 'Property Features' },
    { value: 'alreadyCleaned', label: 'Already Cleaned', dbCategory: 'Cleaning History' },
    { value: 'ovenCleaning', label: 'Oven Cleaning', dbCategory: 'Oven Cleaning' },
    { value: 'cleaningProducts', label: 'Cleaning Products', dbCategory: 'Cleaning Supplies' },
    { value: 'linenHandling', label: 'Linen Handling', dbCategory: 'Linen Handling' },
    { value: 'scheduling', label: 'Scheduling', dbCategory: 'Equipment Arrangement' },
    { value: 'timeFlexibility', label: 'Time Flexibility', dbCategory: 'Time Flexibility' }
  ];

  // Add dynamic categories (e.g., Bed Sizes) from DB, visible ones only
  const availableFields = React.useMemo(() => {
    const toToken = (str: string) =>
      str
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
        .join('');

    const existingDbCategories = new Set(baseAvailableFields.map(f => f.dbCategory));
    const visibleCategories = new Set(
      (configs || [])
        .filter(c => c.is_active && (c.is_visible ?? true))
        .map(c => c.category)
    );

    const dynamicFields = Array.from(visibleCategories)
      .filter(cat => !existingDbCategories.has(cat))
      .map(cat => ({ value: toToken(cat), label: cat, dbCategory: cat }));

    return [...baseAvailableFields, ...dynamicFields];
  }, [configs]);

  const operators = [
    { value: '+', label: 'Add (+)' },
    { value: '-', label: 'Subtract (-)' },
    { value: '*', label: 'Multiply (×)' },
    { value: '/', label: 'Divide (÷)' },
    { value: '(', label: 'Open (' },
    { value: ')', label: 'Close )' }
  ];

  const conditionalOperators = [
    { value: '===', label: 'Equals (===)' },
    { value: '!==', label: 'Not Equals (!==)' },
    { value: '>', label: 'Greater (>)' },
    { value: '<', label: 'Less (<)' },
    { value: '>=', label: 'Greater or Equal (>=)' },
    { value: '<=', label: 'Less or Equal (<=)' },
    { value: '&&', label: 'AND (&&)' },
    { value: '||', label: 'OR (||)' },
    { value: '!', label: 'NOT (!)' },
    { value: '?', label: 'Then (?)' },
    { value: ':', label: 'Else (:)' }
  ];

  const booleanLiterals = [
    { value: 'true', label: 'True' },
    { value: 'false', label: 'False' }
  ];

  // Advanced tokenizer and evaluator for conditional logic
  const tokenize = (formula: string): string[] => {
    const tokens: string[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < formula.length; i++) {
      const char = formula[i];
      const next = formula[i + 1];
      
      // Handle strings
      if ((char === '"' || char === "'") && !inString) {
        if (current) tokens.push(current.trim());
        current = '';
        inString = true;
        stringChar = char;
        continue;
      }
      
      if (inString) {
        if (char === stringChar) {
          tokens.push(`"${current}"`);
          current = '';
          inString = false;
          stringChar = '';
        } else {
          current += char;
        }
        continue;
      }
      
      // Handle multi-character operators
      if (char === '=' && next === '=' && formula[i + 2] === '=') {
        if (current) tokens.push(current.trim());
        tokens.push('===');
        current = '';
        i += 2;
        continue;
      }
      
      if (char === '!' && next === '=') {
        if (current) tokens.push(current.trim());
        tokens.push('!==');
        current = '';
        i += 1;
        continue;
      }
      
      if (char === '>' && next === '=') {
        if (current) tokens.push(current.trim());
        tokens.push('>=');
        current = '';
        i += 1;
        continue;
      }
      
      if (char === '<' && next === '=') {
        if (current) tokens.push(current.trim());
        tokens.push('<=');
        current = '';
        i += 1;
        continue;
      }
      
      if (char === '&' && next === '&') {
        if (current) tokens.push(current.trim());
        tokens.push('&&');
        current = '';
        i += 1;
        continue;
      }
      
      if (char === '|' && next === '|') {
        if (current) tokens.push(current.trim());
        tokens.push('||');
        current = '';
        i += 1;
        continue;
      }
      
      // Handle single-character operators and delimiters
      if ('()+-*/><?:!'.includes(char) && next !== '=' && char !== '&' && char !== '|') {
        if (current) tokens.push(current.trim());
        tokens.push(char);
        current = '';
        continue;
      }
      
      // Handle whitespace
      if (/\s/.test(char)) {
        if (current) tokens.push(current.trim());
        current = '';
        continue;
      }
      
      current += char;
    }
    
    if (current) tokens.push(current.trim());
    return tokens.filter(t => t.length > 0);
  };

  const safeEvaluate = (elements: FormulaElement[]) => {
    try {
      const formulaString = elements.map(el => (el.value || '').trim()).join(' ');
      if (!formulaString) return { ok: false, error: 'Empty formula' } as const;

      const tokens = tokenize(formulaString);
      console.log('Formula tokens:', tokens);
      if (tokens.length === 0) return { ok: false, error: 'Empty formula' } as const;

      // Validation: check for valid tokens
      const validTokenPattern = /^([a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?|[0-9]+\.?[0-9]*|"[^"]*"|'[^']*'|===|!==|>=|<=|&&|\|\||[+\-*/()><?:!])$/;
      
      for (const token of tokens) {
        if (!validTokenPattern.test(token)) {
          throw new Error(`Invalid token: ${token}`);
        }
      }

      // Check parentheses balance
      let parenBalance = 0;
      for (const token of tokens) {
        if (token === '(') parenBalance++;
        else if (token === ')') parenBalance--;
        if (parenBalance < 0) throw new Error('Unbalanced parentheses');
      }
      if (parenBalance !== 0) throw new Error('Unbalanced parentheses');

      // Check ternary balance (? and : must match)
      const questionCount = tokens.filter(t => t === '?').length;
      const colonCount = tokens.filter(t => t === ':').length;
      if (questionCount !== colonCount) {
        throw new Error('Unbalanced ternary operator (? and : must match)');
      }

      // Simple evaluation with sample values (all fields = 1, all .value = "test", all .time = 1)
      const sampleData: Record<string, any> = {};
      tokens.forEach(token => {
        if (/^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/.test(token)) {
          const parts = token.split('.');
          const fieldName = parts[0];
          // Skip built-ins like Math
          if (fieldName === 'Math') return;
          // Add field to sampleData if it doesn't exist yet
          if (!sampleData[fieldName]) {
            sampleData[fieldName] = { 
              value: fieldName === 'serviceType' ? 'checkin-checkout' : 1, 
              time: 60, 
              min_value: 0, 
              max_value: 100 
            };
          }
        }
      });

      // Try to evaluate using Function constructor with proper context
      // Create parameter names and values from sampleData
      const paramNames = Object.keys(sampleData);
      const paramValues = Object.values(sampleData);
      
      // Add Math object to the function context
      const func = new Function('Math', ...paramNames, `return ${formulaString};`);
      const result = func(Math, ...paramValues);
      
      if (typeof result === 'number' && !isFinite(result)) {
        throw new Error('Computation error: result is not finite');
      }

      return { ok: true, result, tokens } as const;
    } catch (e: any) {
      return { ok: false, error: e.message || 'Invalid formula' } as const;
    }
  };

  const formulaText = (currentFormula.elements || []).map(el => el.value).join(' ');
  const evaluation = React.useMemo(() => safeEvaluate(currentFormula.elements || []), [currentFormula.elements]);
  
  // Extract field names used in the formula
  const extractFieldsFromFormula = (elements: FormulaElement[]): string[] => {
    const fields = new Set<string>();
    elements.forEach(el => {
      if (el.type === 'field' && el.value) {
        const fieldName = el.value.split('.')[0];
        if (availableFields.some(f => f.value === fieldName)) {
          fields.add(fieldName);
        }
      }
    });
    return Array.from(fields);
  };

  // Extract formula references (elements that are not in availableFields)
  const extractFormulaReferences = (elements: FormulaElement[]): string[] => {
    const formulaRefs = new Set<string>();
    const functionNames = new Set(['ABC', 'Math', 'abs', 'floor', 'ceil', 'round', 'min', 'max', 'sqrt', 'pow']);
    
    elements.forEach((el, index) => {
      if (el.type === 'field' && el.value) {
        const fieldName = el.value.split('.')[0];
        
        // Skip if it's a known function name
        if (functionNames.has(fieldName)) {
          return;
        }
        
        // Check if next element is '.' or '(' - indicates it's a function call
        const nextEl = elements[index + 1];
        if (nextEl && (nextEl.value === '.' || nextEl.value === '(')) {
          return;
        }
        
        // If it's not in availableFields and looks like an identifier, it's a formula reference
        if (!availableFields.some(f => f.value === fieldName) && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldName)) {
          formulaRefs.add(fieldName);
        }
      }
    });
    return Array.from(formulaRefs);
  };

  const usedFields = React.useMemo(() => 
    extractFieldsFromFormula(currentFormula.elements || []), 
    [currentFormula.elements]
  );

  const usedFormulaRefs = React.useMemo(() => 
    extractFormulaReferences(currentFormula.elements || []), 
    [currentFormula.elements]
  );

  // Evaluate formula with test values
  const evaluateWithTestValues = () => {
    try {
      // Filter out empty elements and join with spaces
      const formulaString = (currentFormula.elements || [])
        .filter(el => el.value && el.value.trim() !== '')
        .map(el => el.value.trim())
        .join(' ')
        .replace(/;/g, ''); // Remove any semicolons
      
      if (!formulaString) return null;

      // Build proper objects with value and time properties for each field
      const allFieldNames = availableFields.map(f => f.value);
      
      const fieldObjects: Record<string, any> = {};
      const multiplierDefaults = new Set(['serviceType', 'alreadyCleaned']);
      allFieldNames.forEach(fieldName => {
        const testVal = testValues[fieldName];
        const rawVal = multiplierDefaults.has(fieldName)
          ? (testVal?.option ?? testVal?.value)
          : testVal?.value;
        const numVal = typeof rawVal === 'number' ? rawVal : Number(rawVal as any);
        const defaultVal = multiplierDefaults.has(fieldName) ? 1 : 0;

        // For multiplier fields, always get the numeric value from the selected option
        const coercedValue = Number.isFinite(numVal)
          ? numVal
          : (typeof rawVal === 'string' && /^(yes|true)$/i.test(rawVal) ? 1
            : (typeof rawVal === 'string' && /^(no|false)$/i.test(rawVal) ? 0 : defaultVal));

        const timeVal = typeof testVal?.time === 'number' && isFinite(testVal.time)
          ? testVal.time
          : Number(testVal?.time) || 0;

        fieldObjects[fieldName] = {
          value: coercedValue,
          time: timeVal,
          min_value: testVal?.min_value ?? 0,
          max_value: testVal?.max_value ?? 0
        };
      });
      
      // Add formula references as simple numeric values
      const formulaRefs = extractFormulaReferences(currentFormula.elements || []);
      formulaRefs.forEach(refName => {
        const testVal = testValues[refName];
        const numVal = typeof testVal === 'number' ? testVal : Number(testVal) || 0;
        fieldObjects[refName] = numVal;
      });
      
      const paramNames = Object.keys(fieldObjects);
      const paramValues = Object.values(fieldObjects);
      
      console.log('Evaluating formula:', formulaString);
      console.log('With field values:', fieldObjects);
      
      // Add Math object to the function context
      const func = new Function('Math', ...paramNames, `return ${formulaString};`);
      const result = func(Math, ...paramValues);
      
      console.log('Formula result:', result);
      
      return typeof result === 'number' && isFinite(result) ? result : null;
    } catch (e) {
      console.error('Formula evaluation error:', e);
      console.error('Formula string was:', (currentFormula.elements || []).map(el => el.value).join(' '));
      return null;
    }
  };

  const testResult = React.useMemo(() => 
    evaluateWithTestValues(), 
    [currentFormula.elements, testValues]
  );

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

            {/* Top actions */}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAddingToCategory(null);
                  setSelectedCategory('');
                  setShowAddDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Field
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={quickAddBedSizes}
              >
                <Plus className="h-4 w-4 mr-2" />
                Quick Add: Bed Sizes
              </Button>
            </div>

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

          <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100">💡 Conditional Logic Examples</h3>
            <div className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
              <div>
                <span className="font-mono bg-blue-100 dark:bg-blue-900/30 px-1 rounded">
                  condition ? valueIfTrue : valueIfFalse
                </span>
                <p className="text-muted-foreground mt-0.5">Basic ternary operator</p>
              </div>
              <div>
                <span className="font-mono bg-blue-100 dark:bg-blue-900/30 px-1 rounded text-[10px]">
                  serviceType.value === "deep" ? 1.5 : 1
                </span>
                <p className="text-muted-foreground mt-0.5">If deep cleaning, multiply by 1.5, otherwise by 1</p>
              </div>
              <div>
                <span className="font-mono bg-blue-100 dark:bg-blue-900/30 px-1 rounded text-[10px]">
                  alreadyCleaned.value === false ? 1.3 : 1
                </span>
                <p className="text-muted-foreground mt-0.5">If not cleaned to standard, add 30% more time</p>
              </div>
              <div>
                <span className="font-mono bg-blue-100 dark:bg-blue-900/30 px-1 rounded text-[10px]">
                  bedrooms.value {">"} 3 && bathrooms.value {">"} 2 ? 2 : 1
                </span>
                <p className="text-muted-foreground mt-0.5">Multiple conditions with AND (&&)</p>
              </div>
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
                     <Textarea
                      value={currentFormula.elements?.map(el => el.value).join('') || ''}
                      onChange={(e) => {
                        const formulaText = e.target.value;
                        const tokens = tokenize(formulaText);
                        console.log('Tokenized formula:', tokens);
                        const elements = tokens.map(token => {
                          // Operators
                          if (['+', '-', '*', '/', '(', ')', '===', '!==', '>', '<', '>=', '<=', '&&', '||', '!', '?', ':'].includes(token)) {
                            return { type: 'operator' as const, value: token };
                          } 
                          // Numbers
                          else if (!isNaN(Number(token))) {
                            return { type: 'number' as const, value: token, label: token };
                          }
                          // Boolean literals
                          else if (token === 'true' || token === 'false') {
                            return { type: 'number' as const, value: token, label: token };
                          }
                          // String literals
                          else if (token.startsWith('"') && token.endsWith('"')) {
                            return { type: 'field' as const, value: token, label: token };
                          }
                          // Fields
                          else {
                            return { type: 'field' as const, value: token, label: token };
                          }
                        });
                        setCurrentFormula({...currentFormula, elements});
                      }}
                      placeholder='e.g. (propertyType.time + bedrooms.time) * (serviceType.value === "checkin-checkout" && alreadyCleaned.value === false ? 1.5 : 1)'
                      className="font-mono min-h-[120px]"
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Tip: Use conditional logic like <code className="text-xs bg-muted px-1 rounded">condition ? valueIfTrue : valueIfFalse</code>
                    </p>
                  </div>
                  <div>
                    <Label>Add Elements</Label>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-1">Math Operators</div>
                        <div className="flex flex-wrap gap-1">
                          {operators.map((op) => (
                            <Button
                              key={op.value}
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => addToFormula({ type: 'operator', value: op.value })}
                            >
                              {op.value}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-1">Comparison & Logic</div>
                        <div className="flex flex-wrap gap-1">
                          {conditionalOperators.map((op) => (
                            <Button
                              key={op.value}
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => addToFormula({ type: 'operator', value: op.value })}
                            >
                              {op.value}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-1">Boolean Values</div>
                        <div className="flex flex-wrap gap-1">
                          {booleanLiterals.map((lit) => (
                            <Button
                              key={lit.value}
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => addToFormula({ type: 'number', value: lit.value, label: lit.value })}
                            >
                              {lit.value}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-1">Fields</div>
                        <p className="text-xs text-muted-foreground mb-2 p-2 bg-muted/50 rounded">
                          💡 <strong>.value</strong> = numeric value (e.g., cost, count)<br/>
                          💡 <strong>.time</strong> = time in <strong>minutes</strong> (divide by 60 for hours)
                        </p>
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
                            <SelectTrigger className="h-9 text-xs mb-1">
                              <SelectValue placeholder={field.label} />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-background">
                              <SelectItem value="value">Value</SelectItem>
                              <SelectItem value="time">Time (minutes)</SelectItem>
                              <SelectItem value="min_value">Min Value</SelectItem>
                              <SelectItem value="max_value">Max Value</SelectItem>
                            </SelectContent>
                          </Select>
                        ))}
                      </div>
                      
                      {formulas.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground mb-1">Existing Formulas</div>
                          {formulas.filter(f => f.id !== currentFormula.id).map((formula) => (
                            <Button
                              key={formula.id}
                              variant="outline"
                              size="sm"
                              className="w-full h-9 text-xs justify-start mb-1"
                              onClick={() => {
                                const newElement = { 
                                  type: 'field' as const, 
                                  value: formula.name.replace(/\s+/g, ''),
                                  label: formula.name 
                                };
                                setCurrentFormula({
                                  ...currentFormula,
                                  elements: [...(currentFormula.elements || []), newElement]
                                });
                              }}
                            >
                              {formula.name}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Formula Preview</Label>
                  <div className="p-3 border rounded bg-muted/20 min-h-[60px]">
                    {currentFormula.elements && currentFormula.elements.length > 0 ? (
                      <div className="flex flex-wrap gap-1 items-center">
                        {currentFormula.elements.map((el, idx) => {
                          const isConditional = ['===', '!==', '>', '<', '>=', '<=', '&&', '||', '!'].includes(el.value);
                          const isTernary = ['?', ':'].includes(el.value);
                          const isMathOperator = ['+', '-', '*', '/', '(', ')'].includes(el.value);
                          const isBoolean = ['true', 'false'].includes(el.value);
                          
                          return (
                            <span 
                              key={idx} 
                              className={`px-2 py-1 rounded text-sm ${
                                el.type === 'field' 
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' 
                                  : isConditional
                                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 font-semibold'
                                  : isTernary
                                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 font-bold'
                                  : isMathOperator
                                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold' 
                                  : isBoolean
                                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 font-semibold'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                              }`}
                            >
                              {el.label || el.value}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Formula preview will appear here...</span>
                    )}
                  </div>
                </div>

                {/* Formula Tester */}
                {(usedFields.length > 0 || usedFormulaRefs.length > 0) && (
                  <Card className="p-4 border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                    <h3 className="text-lg font-semibold mb-4 text-green-900 dark:text-green-100">
                      🧪 Test Your Formula
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Избери стойности за полетата, които искаш да тестваш. Неизбраните полета автоматично ще имат стойност 0.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Formula References - shown first */}
                      {usedFormulaRefs.map(refName => (
                        <div key={`formula-ref-${refName}`} className="space-y-2">
                          <Label className="text-sm font-semibold">
                            {refName}
                            <span className="text-xs text-purple-600 dark:text-purple-400 ml-2">(formula reference)</span>
                          </Label>
                          <Input
                            type="number"
                            step="any"
                            value={testValues[refName] || 0}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setTestValues(prev => ({
                                ...prev,
                                [refName]: val
                              }));
                            }}
                            placeholder="Enter test value..."
                            className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800"
                          />
                        </div>
                      ))}
                      
                      {/* Regular Fields */}
                      {usedFields.map(fieldName => {
                        const field = availableFields.find(f => f.value === fieldName);
                        // Use the dbCategory to find configs
                        const dbCategory = field?.dbCategory || fieldName;
                        const fieldConfigs = configs.filter(c => c.category === dbCategory);
                        
                        // Check if this field should support multi-select (e.g., Bed Sizes)
                        const isMultiSelectField = fieldConfigs.length > 2 && 
                          (dbCategory.toLowerCase().includes('bed') || 
                           dbCategory.toLowerCase().includes('size') ||
                           dbCategory.toLowerCase().includes('linen'));
                        
                        if (isMultiSelectField) {
                          // Multi-select with quantities
                          const selectedItems = testValues[fieldName]?.items || [];
                          
                          return (
                            <div key={fieldName} className="space-y-2 md:col-span-2">
                              <Label className="text-sm font-semibold">{field?.label || fieldName} <span className="text-xs text-muted-foreground font-normal">(опционално - избери и посочи количество)</span></Label>
                              <div className="border rounded-lg p-3 space-y-2 bg-background">
                                {fieldConfigs.map(config => {
                                  const item = selectedItems.find((i: any) => i.id === config.id);
                                  const isSelected = !!item;
                                  const quantity = item?.quantity || 1;
                                  
                                  return (
                                     <div key={config.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          console.log('Config data:', config); // Debug
                                          setTestValues(prev => {
                                            const currentItems = prev[fieldName]?.items || [];
                                            let newItems;
                                            
                                            if (e.target.checked) {
                                              newItems = [...currentItems, {
                                                id: config.id,
                                                quantity: 1,
                                                value: config.value,
                                                time: config.time,
                                                label: config.label
                                              }];
                                            } else {
                                              newItems = currentItems.filter((i: any) => i.id !== config.id);
                                            }
                                            
                                            // Calculate totals
                                            const totalValue = newItems.reduce((sum: number, i: any) => sum + (i.value * i.quantity), 0);
                                            const totalTime = newItems.reduce((sum: number, i: any) => sum + (i.time * i.quantity), 0);
                                            
                                            console.log('Items:', newItems); // Debug
                                            console.log('Total time:', totalTime, 'Total value:', totalValue); // Debug
                                            
                                            return {
                                              ...prev,
                                              [fieldName]: {
                                                items: newItems,
                                                value: totalValue,
                                                time: totalTime
                                              }
                                            };
                                          });
                                        }}
                                        className="h-4 w-4 rounded border-gray-300"
                                      />
                                      <label className="flex-1 text-sm cursor-pointer">
                                        {config.label}
                                        <span className="text-xs text-muted-foreground ml-2">
                                          (value: {config.value}, time: {config.time} min)
                                        </span>
                                      </label>
                                      {isSelected && (
                                        <>
                                          <input
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => {
                                              const newQty = Math.max(1, parseInt(e.target.value) || 1);
                                              setTestValues(prev => {
                                                const currentItems = prev[fieldName]?.items || [];
                                                const newItems = currentItems.map((i: any) =>
                                                  i.id === config.id ? { ...i, quantity: newQty } : i
                                                );
                                                
                                                const totalValue = newItems.reduce((sum: number, i: any) => sum + (i.value * i.quantity), 0);
                                                const totalTime = newItems.reduce((sum: number, i: any) => sum + (i.time * i.quantity), 0);
                                                
                                                return {
                                                  ...prev,
                                                  [fieldName]: {
                                                    items: newItems,
                                                    value: totalValue,
                                                    time: totalTime
                                                  }
                                                };
                                              });
                                            }}
                                            className="w-16 px-2 py-1 text-sm border rounded"
                                          />
                                          <span className="text-xs text-muted-foreground">
                                            = {(config.value * quantity).toFixed(1)}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                                {selectedItems.length > 0 && (
                                  <div className="pt-2 mt-2 border-t text-xs text-muted-foreground space-y-0.5">
                                    <div>Total Value: {testValues[fieldName]?.value?.toFixed(1) || 0}</div>
                                    <div>Total Time: {testValues[fieldName]?.time || 0} min</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        
                        // Single select (original logic)
                        return (
                          <div key={fieldName} className="space-y-2">
                            <Label className="text-sm font-semibold">{field?.label || fieldName} <span className="text-xs text-muted-foreground font-normal">(опционално)</span></Label>
                            <Select
                              value={testValues[fieldName]?.selectedOption || ''}
                              onValueChange={(optionId) => {
                                if (optionId === 'none') {
                                  // Clear the value if "none" is selected
                                  setTestValues(prev => {
                                    const newValues = { ...prev };
                                    delete newValues[fieldName];
                                    return newValues;
                                  });
                                } else {
                                  const selectedConfig = fieldConfigs.find(c => c.id === optionId);
                                  if (selectedConfig) {
                                    setTestValues(prev => ({
                                      ...prev,
                                      [fieldName]: {
                                        selectedOption: optionId,
                                        value: selectedConfig.value,
                                        option: selectedConfig.option,
                                        time: selectedConfig.time,
                                        min_value: selectedConfig.min_value,
                                        max_value: selectedConfig.max_value
                                      }
                                    }));
                                  }
                                }
                              }}
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder={`Избери или остави празно (= 0)`} />
                              </SelectTrigger>
                              <SelectContent className="z-50 bg-background">
                                <SelectItem value="none">
                                  <span className="text-muted-foreground">Няма избрана стойност (ще се използва 0)</span>
                                </SelectItem>
                                {fieldConfigs.map(config => (
                                  <SelectItem key={config.id} value={config.id}>
                                    {config.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {testValues[fieldName] && (
                              <div className="text-xs text-muted-foreground space-y-0.5 pl-2">
                                <div>Value: {testValues[fieldName].value}</div>
                                <div>Time: {testValues[fieldName].time} min</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {testResult !== null && (
                      <div className="p-4 bg-background border-2 border-green-300 dark:border-green-700 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">Formula Result:</span>
                          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {testResult % 1 === 0 ? testResult.toFixed(0) : testResult.toFixed(1)}
                            {currentFormula.result_type === 'cost' && ' £'}
                            {currentFormula.result_type === 'time' && ' h'}
                            {currentFormula.result_type === 'percentage' && ' %'}
                          </span>
                        </div>
                        {currentFormula.result_type === 'time' && (
                          <div className="text-xs text-muted-foreground border-t pt-2">
                            💡 Note: .time returns <strong>minutes</strong>. For hours use: <code className="bg-muted px-1 rounded">fieldName.time / 60</code>
                            <br />
                            (e.g., {testResult.toFixed(1)} min = {(testResult / 60).toFixed(2)} hours)
                          </div>
                        )}
                      </div>
                    )}

                    {testResult === null && currentFormula.elements.length > 0 && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-800 dark:text-amber-200">
                        ℹ️ Избери стойности за да видиш резултата (неизбраните полета = 0)
                      </div>
                    )}
                  </Card>
                )}

                <div>
                  <Label>Validation</Label>
                  <div className="p-3 border rounded bg-background">
                    {evaluation.ok ? (
                      <span className="text-sm text-green-600 dark:text-green-400">✓ Formula syntax is valid</span>
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
