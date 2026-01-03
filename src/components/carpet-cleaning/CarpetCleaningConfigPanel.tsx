import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save, ChevronDown, ChevronRight } from 'lucide-react';
import {
  useEndOfTenancyFieldConfigs,
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

// Categories for carpet cleaning form
const CARPET_CLEANING_CATEGORIES = ['carpet', 'upholstery', 'mattress'];

const CATEGORY_LABELS: Record<string, string> = {
  carpet: 'Carpet & Rug Items',
  upholstery: 'Upholstery Items',
  mattress: 'Mattress Items',
};

export const CarpetCleaningConfigPanel: React.FC = () => {
  const { data: allConfigs = [], isLoading: configsLoading } = useEndOfTenancyFieldConfigs();
  
  // Filter only carpet cleaning related categories
  const configs = allConfigs.filter(c => CARPET_CLEANING_CATEGORIES.includes(c.category));
  
  const createConfig = useCreateEndOfTenancyFieldConfig();
  const updateConfig = useUpdateEndOfTenancyFieldConfig();
  const deleteConfig = useDeleteEndOfTenancyFieldConfig();

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    carpet: true,
    upholstery: false,
    mattress: false,
  });
  const [localChanges, setLocalChanges] = useState<Record<string, Partial<EndOfTenancyFieldConfig>>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);

  // New field form state
  const [newCategory, setNewCategory] = useState('carpet');
  const [newOption, setNewOption] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState(0);
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
      option: newOption.toLowerCase().replace(/\s+/g, '_'),
      label: newLabel || newOption,
      value: newValue,
      value_type: 'fixed',
      time: newTime,
      display_order: maxDisplayOrder + 1,
      is_active: true,
      is_visible: true,
      icon: null,
      min_value: null,
      max_value: null,
      category_order: CARPET_CLEANING_CATEGORIES.indexOf(categoryToUse),
    });

    // Reset form
    setNewOption('');
    setNewLabel('');
    setNewValue(0);
    setNewTime(0);
    setShowAddDialog(false);
    setAddingToCategory(null);
  };

  // Group configs by category
  const groupedConfigs = CARPET_CLEANING_CATEGORIES.reduce((acc, category) => {
    acc[category] = configs.filter((c) => c.category === category)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    return acc;
  }, {} as Record<string, EndOfTenancyFieldConfig[]>);

  if (configsLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading configurations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Carpet Cleaning Form Settings</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure pricing and time estimates for carpet, upholstery, and mattress cleaning items.
              These settings apply to both the standalone Carpet Cleaning form and the End of Tenancy form.
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={addingToCategory || newCategory} onValueChange={(v) => setNewCategory(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CARPET_CLEANING_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_LABELS[cat] || cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Option Key</Label>
                  <Input
                    placeholder="e.g., rug_small"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Label</Label>
                  <Input
                    placeholder="e.g., Small Rug"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price (£)</Label>
                    <Input
                      type="number"
                      value={newValue}
                      onChange={(e) => setNewValue(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time (minutes)</Label>
                    <Input
                      type="number"
                      value={newTime}
                      onChange={(e) => setNewTime(Number(e.target.value))}
                    />
                  </div>
                </div>
                <Button onClick={handleAddField} className="w-full">
                  Add Item
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {CARPET_CLEANING_CATEGORIES.map((category) => (
            <Collapsible
              key={category}
              open={openCategories[category]}
              onOpenChange={() => toggleCategory(category)}
            >
              <Card className="border">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between py-3 cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      {openCategories[category] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <CardTitle className="text-lg capitalize">
                        {CATEGORY_LABELS[category] || category}
                      </CardTitle>
                      <span className="text-sm text-muted-foreground">
                        ({groupedConfigs[category]?.length || 0} items)
                      </span>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {groupedConfigs[category]?.map((config) => (
                        <div
                          key={config.id}
                          className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex-1 grid grid-cols-4 gap-3 items-center">
                            <div>
                              <Label className="text-xs text-muted-foreground">Label</Label>
                              <Input
                                value={getCurrentValue(config.id, 'label', config.label || '')}
                                onChange={(e) => handleLocalChange(config.id, 'label', e.target.value)}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Option Key</Label>
                              <Input
                                value={config.option}
                                disabled
                                className="h-8 bg-muted"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Price (£)</Label>
                              <Input
                                type="number"
                                value={getCurrentValue(config.id, 'value', config.value)}
                                onChange={(e) => handleLocalChange(config.id, 'value', Number(e.target.value))}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Time (min)</Label>
                              <Input
                                type="number"
                                value={getCurrentValue(config.id, 'time', config.time || 0)}
                                onChange={(e) => handleLocalChange(config.id, 'time', Number(e.target.value))}
                                className="h-8"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {localChanges[config.id] && (
                              <Button
                                size="sm"
                                onClick={() => handleSave(config.id)}
                                disabled={updateConfig.isPending}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteConfig.mutate(config.id)}
                              disabled={deleteConfig.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {(!groupedConfigs[category] || groupedConfigs[category].length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No items configured for this category.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
