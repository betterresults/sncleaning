import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save, ChevronDown, ChevronRight } from 'lucide-react';
import {
  useEndOfTenancyFieldConfigs,
  useAllEndOfTenancyCategories,
  useCreateEndOfTenancyFieldConfig,
  useUpdateEndOfTenancyFieldConfig,
  useDeleteEndOfTenancyFieldConfig,
  EndOfTenancyFieldConfig,
} from '@/hooks/useEndOfTenancyFieldConfigs';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const EndOfTenancyConfigPanel: React.FC = () => {
  const { data: configs = [], isLoading: configsLoading } = useEndOfTenancyFieldConfigs();
  const { data: categories = [], isLoading: categoriesLoading } = useAllEndOfTenancyCategories();
  
  const createConfig = useCreateEndOfTenancyFieldConfig();
  const updateConfig = useUpdateEndOfTenancyFieldConfig();
  const deleteConfig = useDeleteEndOfTenancyFieldConfig();

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [localChanges, setLocalChanges] = useState<Record<string, Partial<EndOfTenancyFieldConfig>>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);

  // New field form state
  const [newCategory, setNewCategory] = useState('');
  const [newOption, setNewOption] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState(0);
  const [newValueType, setNewValueType] = useState<'fixed' | 'percentage' | 'none'>('fixed');
  const [newTime, setNewTime] = useState(0);

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleLocalChange = (id: string, field: string, value: any) => {
    setLocalChanges((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const getCurrentValue = (configId: string, field: string, defaultValue: any) => {
    if (localChanges[configId] && localChanges[configId][field as keyof EndOfTenancyFieldConfig] !== undefined) {
      return localChanges[configId][field as keyof EndOfTenancyFieldConfig];
    }
    return defaultValue;
  };

  const handleSave = (id: string) => {
    const changes = localChanges[id];
    if (changes) {
      updateConfig.mutate({ id, ...changes });
      setLocalChanges((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleAddField = () => {
    const categoryToUse = addingToCategory || newCategory;
    if (!categoryToUse || !newOption) return;

    const existingConfigs = configs.filter((c) => c.category === categoryToUse);
    const maxDisplayOrder = existingConfigs.length > 0
      ? Math.max(...existingConfigs.map((c) => c.display_order || 0))
      : 0;

    createConfig.mutate({
      category: categoryToUse,
      option: newOption,
      label: newLabel || newOption,
      value: newValue,
      value_type: newValueType,
      time: newTime,
      icon: null,
      min_value: null,
      max_value: null,
      display_order: maxDisplayOrder + 1,
      category_order: addingToCategory
        ? configs.find((c) => c.category === addingToCategory)?.category_order || 0
        : categories.length,
      is_visible: true,
      is_active: true,
    });

    // Reset form
    setNewOption('');
    setNewLabel('');
    setNewValue(0);
    setNewValueType('fixed');
    setNewTime(0);
    setShowAddDialog(false);
    setAddingToCategory(null);
  };

  const groupedConfigs = configs.reduce<Record<string, EndOfTenancyFieldConfig[]>>((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {});

  if (configsLoading || categoriesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">End of Tenancy Pricing Configuration</CardTitle>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category & Field</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Category Name</Label>
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g., Kitchen Extras"
                />
              </div>
              <div>
                <Label>Option Key</Label>
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="e.g., fridge_cleaning"
                />
              </div>
              <div>
                <Label>Display Label</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g., Fridge Cleaning"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Cost (£)</Label>
                  <Input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={newValueType} onValueChange={(v: any) => setNewValueType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">£ Fixed</SelectItem>
                      <SelectItem value="percentage">% Percent</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Time (min)</Label>
                  <Input
                    type="number"
                    value={newTime}
                    onChange={(e) => setNewTime(Number(e.target.value))}
                  />
                </div>
              </div>
              <Button onClick={handleAddField} className="w-full">
                Add Field
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configure pricing and time estimates for each End of Tenancy cleaning field.
        </p>

        {categories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No configurations found. Add your first category to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => {
              const categoryConfigs = groupedConfigs[category] || [];
              const isOpen = openCategories[category] ?? true;

              return (
                <Collapsible
                  key={category}
                  open={isOpen}
                  onOpenChange={() => toggleCategory(category)}
                >
                  <div className="border rounded-lg">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-medium">{category}</span>
                        <span className="text-sm text-muted-foreground">
                          ({categoryConfigs.length} fields)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddingToCategory(category);
                          setNewCategory(category);
                          setShowAddDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-2">
                        {/* Header Row */}
                        <div className="grid grid-cols-[2fr,1fr,1fr,1fr,80px,60px] gap-3 text-sm font-medium text-muted-foreground px-2">
                          <span>Label</span>
                          <span className="text-center">Cost (£)</span>
                          <span className="text-center">Type</span>
                          <span className="text-center">Time (min)</span>
                          <span className="text-center">Save</span>
                          <span className="text-center">Delete</span>
                        </div>

                        {categoryConfigs.map((config) => (
                          <div
                            key={config.id}
                            className="grid grid-cols-[2fr,1fr,1fr,1fr,80px,60px] gap-3 items-center p-2 border rounded-lg hover:bg-muted/30"
                          >
                            <Input
                              value={getCurrentValue(config.id, 'label', config.label || config.option)}
                              onChange={(e) => handleLocalChange(config.id, 'label', e.target.value)}
                              className="h-9"
                            />
                            <Input
                              type="number"
                              step="0.5"
                              value={getCurrentValue(config.id, 'value', config.value)}
                              onChange={(e) => handleLocalChange(config.id, 'value', Number(e.target.value))}
                              className="h-9 text-center"
                            />
                            <Select
                              value={getCurrentValue(config.id, 'value_type', config.value_type)}
                              onValueChange={(v) => handleLocalChange(config.id, 'value_type', v)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">£ Fixed</SelectItem>
                                <SelectItem value="percentage">% Percent</SelectItem>
                                <SelectItem value="none">None</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              value={getCurrentValue(config.id, 'time', config.time) || 0}
                              onChange={(e) => handleLocalChange(config.id, 'time', Number(e.target.value))}
                              className="h-9 text-center"
                            />
                            <div className="flex justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 w-9 p-0"
                                onClick={() => handleSave(config.id)}
                                disabled={!localChanges[config.id]}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 hover:bg-destructive/10"
                                onClick={() => {
                                  if (confirm('Delete this field?')) {
                                    deleteConfig.mutate(config.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
