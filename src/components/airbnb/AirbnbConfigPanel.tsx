import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Plus, Trash2, Edit } from 'lucide-react';
import { 
  useAirbnbFieldConfigs, 
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

export const AirbnbConfigPanel: React.FC = () => {
  const { data: configs = [], isLoading: configsLoading } = useAirbnbFieldConfigs();
  const { data: formulas = [], isLoading: formulasLoading } = useAirbnbPricingFormulas();
  
  const createConfig = useCreateFieldConfig();
  const updateConfig = useUpdateFieldConfig();
  const deleteConfig = useDeleteFieldConfig();
  
  const createFormula = useCreatePricingFormula();
  const updateFormula = useUpdatePricingFormula();
  const deleteFormula = useDeletePricingFormula();

  const [newCategory, setNewCategory] = useState('');
  const [newOption, setNewOption] = useState('');
  const [newValue, setNewValue] = useState(0);
  const [newValueType, setNewValueType] = useState<'fixed' | 'percentage'>('fixed');
  const [newTime, setNewTime] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

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

  const categories = Object.keys(groupedConfigs).sort();

  const handleAddField = () => {
    const category = selectedCategory || newCategory;
    if (!category || !newOption) return;

    createConfig.mutate({
      category,
      option: newOption,
      value: newValue,
      value_type: newValueType,
      time: newTime,
    });

    setNewCategory('');
    setNewOption('');
    setNewValue(0);
    setNewTime(0);
    setSelectedCategory('');
    setShowAddDialog(false);
  };

  const handleUpdateConfig = (id: string, field: 'value' | 'time' | 'value_type', value: number | string) => {
    updateConfig.mutate({ 
      id, 
      updates: { [field]: value } 
    });
  };

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

  if (configsLoading || formulasLoading) {
    return <div className="p-4">Зареждане...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="fields" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fields">Конфигурация на полетата</TabsTrigger>
          <TabsTrigger value="formulas">Формули за изчисление</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Полета на формата</h2>
                <p className="text-muted-foreground">Управление на категории и опции</p>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Добави ново поле
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Добави ново поле</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Категория</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Избери съществуваща..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-1">или създай нова:</p>
                      <Input
                        value={newCategory}
                        onChange={(e) => {
                          setNewCategory(e.target.value);
                          setSelectedCategory('');
                        }}
                        placeholder="Нова категория..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Опция</Label>
                      <Input
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder="Име на опцията..."
                      />
                    </div>
                    <div>
                      <Label>Стойност</Label>
                      <Input
                        type="number"
                        value={newValue}
                        onChange={(e) => setNewValue(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Тип стойност</Label>
                      <Select value={newValueType} onValueChange={(v: any) => setNewValueType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Фиксирана</SelectItem>
                          <SelectItem value="percentage">Процент</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Време (часове)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={newTime}
                        onChange={(e) => setNewTime(Number(e.target.value))}
                      />
                    </div>
                    <Button onClick={handleAddField} className="w-full">
                      Добави
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-6">
              {categories.map((category) => (
                <Card key={category} className="p-4">
                  <h3 className="font-bold text-lg mb-4">{category}</h3>
                  <div className="space-y-2">
                    {groupedConfigs[category].map((config) => (
                      <div key={config.id} className="grid grid-cols-12 gap-2 items-center p-2 border rounded">
                        <div className="col-span-3 font-medium">{config.option}</div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={config.value}
                            onChange={(e) => handleUpdateConfig(config.id, 'value', Number(e.target.value))}
                            className="h-8"
                          />
                        </div>
                        <div className="col-span-2">
                          <Select 
                            value={config.value_type} 
                            onValueChange={(v) => handleUpdateConfig(config.id, 'value_type', v)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Фиксирана</SelectItem>
                              <SelectItem value="percentage">Процент</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            step="0.5"
                            value={config.time || 0}
                            onChange={(e) => handleUpdateConfig(config.id, 'time', Number(e.target.value))}
                            placeholder="Време"
                            className="h-8"
                          />
                        </div>
                        <div className="col-span-3 flex justify-end gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteConfig.mutate(config.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
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
                      <Edit className="h-4 w-4" />
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
