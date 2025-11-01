import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Save, X, GripVertical } from 'lucide-react';
import {
  useCompanySettings,
  useCreateCompanySetting,
  useUpdateCompanySetting,
  useDeleteCompanySetting,
  CompanySetting,
} from '@/hooks/useCompanySettings';
import { Switch } from '@/components/ui/switch';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  setting: CompanySetting;
  category: string;
  editingId: string | null;
  editForm: any;
  cleaningTypes?: CompanySetting[];
  onEdit: (setting: CompanySetting) => void;
  onSave: (id: string, category: string) => void;
  onDelete: (id: string) => void;
  onFormChange: (updates: any) => void;
  onCancelEdit: () => void;
}

const SortableItem = ({ setting, category, editingId, editForm, cleaningTypes, onEdit, onSave, onDelete, onFormChange, onCancelEdit }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: setting.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = editingId === setting.id;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex-1 flex items-center justify-between p-4 border rounded-lg">
        {isEditing ? (
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Key (ID)</Label>
                <Input value={setting.setting_key} disabled className="bg-gray-100" />
              </div>
              <div>
                <Label>Label</Label>
                <Input
                  value={editForm.label}
                  onChange={(e) => onFormChange({ ...editForm, label: e.target.value })}
                />
              </div>
            </div>
            {category === 'service_type' && (
              <>
                <div>
                  <Label>Badge Color (Tailwind classes)</Label>
                  <Input
                    value={editForm.badge_color}
                    onChange={(e) => onFormChange({ ...editForm, badge_color: e.target.value })}
                    placeholder="bg-blue-500/10 text-blue-700 border-blue-200"
                  />
                </div>
                <div>
                  <Label>Allowed Cleaning Types</Label>
                  <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-lg">
                    {cleaningTypes?.map((ct) => (
                      <Badge
                        key={ct.id}
                        variant={editForm.allowed_cleaning_types?.includes(ct.setting_key) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const current = editForm.allowed_cleaning_types || [];
                          const updated = current.includes(ct.setting_key)
                            ? current.filter((k: string) => k !== ct.setting_key)
                            : [...current, ct.setting_key];
                          onFormChange({ ...editForm, allowed_cleaning_types: updated });
                        }}
                      >
                        {ct.setting_value.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
            {category === 'cleaning_type' && (
              <div>
                <Label>Description</Label>
                <Input
                  value={editForm.description}
                  onChange={(e) => onFormChange({ ...editForm, description: e.target.value })}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={editForm.display_order || ''}
                  onChange={(e) => onFormChange({ ...editForm, display_order: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editForm.is_active}
                  onCheckedChange={(checked) => onFormChange({ ...editForm, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onSave(setting.id, category)}>
                <Save className="w-4 h-4 mr-1" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-gray-600">{setting.setting_key}</span>
                <span className="font-semibold">{setting.setting_value.label}</span>
                {category === 'service_type' && setting.setting_value.badge_color && (
                  <Badge className={setting.setting_value.badge_color}>Preview</Badge>
                )}
                {!setting.is_active && <Badge variant="secondary">Inactive</Badge>}
              </div>
              {setting.setting_value.description && (
                <p className="text-sm text-gray-600 mt-1">{setting.setting_value.description}</p>
              )}
              {category === 'service_type' && setting.setting_value.allowed_cleaning_types && (
                <div className="text-xs text-gray-500 mt-1">
                  Allowed: {setting.setting_value.allowed_cleaning_types.join(', ')}
                </div>
              )}
              <span className="text-xs text-gray-400">Order: {setting.display_order}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(setting)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(setting.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const CompanySettingsManager = () => {
  const { data: serviceTypes, isLoading: loadingServiceTypes } = useCompanySettings('service_type');
  const { data: cleaningTypes, isLoading: loadingCleaningTypes } = useCompanySettings('cleaning_type');
  const { data: companyInfo, isLoading: loadingCompanyInfo } = useCompanySettings('company_info');
  const { data: paymentMethods, isLoading: loadingPaymentMethods } = useCompanySettings('payment_method');

  const createMutation = useCreateCompanySetting();
  const updateMutation = useUpdateCompanySetting();
  const deleteMutation = useDeleteCompanySetting();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemCategory, setNewItemCategory] = useState<'service_type' | 'cleaning_type' | 'payment_method'>('service_type');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleEdit = (setting: CompanySetting) => {
    setEditingId(setting.id);
    setEditForm({
      key: setting.setting_key,
      label: setting.setting_value.label,
      badge_color: setting.setting_value.badge_color || '',
      description: setting.setting_value.description || '',
      allowed_cleaning_types: setting.setting_value.allowed_cleaning_types || [],
      display_order: setting.display_order,
      is_active: setting.is_active,
    });
  };

  const handleSave = (id: string, category: string) => {
    const setting_value = category === 'service_type'
      ? { 
          label: editForm.label, 
          badge_color: editForm.badge_color,
          allowed_cleaning_types: editForm.allowed_cleaning_types || []
        }
      : category === 'payment_method'
      ? { label: editForm.label }
      : { label: editForm.label, description: editForm.description };

    updateMutation.mutate({
      id,
      updates: {
        setting_value,
        display_order: editForm.display_order,
        is_active: editForm.is_active,
      },
    });
    setEditingId(null);
  };

  const handleAddNew = () => {
    if (!editForm.key || !editForm.label) {
      return;
    }

    const setting_value = newItemCategory === 'service_type'
      ? { label: editForm.label, badge_color: editForm.badge_color || 'bg-gray-500/10 text-gray-700 border-gray-200' }
      : newItemCategory === 'payment_method'
      ? { label: editForm.label }
      : { label: editForm.label, description: editForm.description || '' };

    createMutation.mutate({
      setting_category: newItemCategory,
      setting_key: editForm.key,
      setting_value,
      display_order: editForm.display_order || 0,
      is_active: true,
    });
    
    setIsAddingNew(false);
    setEditForm({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this setting?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDragEnd = (event: DragEndEvent, items: CompanySetting[] | undefined) => {
    const { active, over } = event;

    if (!over || !items || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const reorderedItems = arrayMove(items, oldIndex, newIndex);

    // Update display_order for all affected items
    reorderedItems.forEach((item, index) => {
      if (item.display_order !== index) {
        updateMutation.mutate({
          id: item.id,
          updates: { display_order: index },
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="service_types" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="service_types">Service Types</TabsTrigger>
          <TabsTrigger value="cleaning_types">Cleaning Types</TabsTrigger>
          <TabsTrigger value="payment_methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="company_info">Company Info</TabsTrigger>
        </TabsList>

        <TabsContent value="service_types">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Service Types</CardTitle>
                  <CardDescription>Manage available service types for bookings</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setIsAddingNew(true);
                    setNewItemCategory('service_type');
                    const maxOrder = Math.max(0, ...(serviceTypes?.map(s => s.display_order) || []));
                    setEditForm({ label: '', badge_color: '', display_order: maxOrder + 1 });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Service Type
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isAddingNew && newItemCategory === 'service_type' && (
                <div className="p-4 border-2 border-dashed rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Key (ID) *</Label>
                      <Input
                        value={editForm.key || ''}
                        onChange={(e) => setEditForm({ ...editForm, key: e.target.value })}
                        placeholder="airbnb"
                      />
                    </div>
                    <div>
                      <Label>Label *</Label>
                      <Input
                        value={editForm.label || ''}
                        onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                        placeholder="Airbnb Cleaning"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Badge Color (Tailwind classes)</Label>
                    <Input
                      value={editForm.badge_color || ''}
                      onChange={(e) => setEditForm({ ...editForm, badge_color: e.target.value })}
                      placeholder="bg-green-500/10 text-green-700 border-green-200"
                    />
                  </div>
                  <div>
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={editForm.display_order || ''}
                      onChange={(e) => setEditForm({ ...editForm, display_order: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddNew}>
                      <Save className="w-4 h-4 mr-1" /> Create
                    </Button>
                    <Button variant="outline" onClick={() => { setIsAddingNew(false); setEditForm({}); }}>
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              )}
              {loadingServiceTypes ? (
                <div>Loading...</div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, serviceTypes)}
                >
                  <SortableContext
                    items={serviceTypes?.map(s => s.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {serviceTypes?.map((setting) => (
                      <SortableItem
                        key={setting.id}
                        setting={setting}
                        category="service_type"
                        editingId={editingId}
                        editForm={editForm}
                        cleaningTypes={cleaningTypes}
                        onEdit={handleEdit}
                        onSave={handleSave}
                        onDelete={handleDelete}
                        onFormChange={setEditForm}
                        onCancelEdit={() => setEditingId(null)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleaning_types">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Cleaning Types</CardTitle>
                  <CardDescription>Manage available cleaning types</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setIsAddingNew(true);
                    setNewItemCategory('cleaning_type');
                    const maxOrder = Math.max(0, ...(cleaningTypes?.map(s => s.display_order) || []));
                    setEditForm({ label: '', description: '', display_order: maxOrder + 1 });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Cleaning Type
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isAddingNew && newItemCategory === 'cleaning_type' && (
                <div className="p-4 border-2 border-dashed rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Key (ID) *</Label>
                      <Input
                        value={editForm.key || ''}
                        onChange={(e) => setEditForm({ ...editForm, key: e.target.value })}
                        placeholder="standard_cleaning"
                      />
                    </div>
                    <div>
                      <Label>Label *</Label>
                      <Input
                        value={editForm.label || ''}
                        onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                        placeholder="Standard Cleaning"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Regular cleaning service"
                    />
                  </div>
                  <div>
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={editForm.display_order || ''}
                      onChange={(e) => setEditForm({ ...editForm, display_order: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddNew}>
                      <Save className="w-4 h-4 mr-1" /> Create
                    </Button>
                    <Button variant="outline" onClick={() => { setIsAddingNew(false); setEditForm({}); }}>
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              )}
              {loadingCleaningTypes ? (
                <div>Loading...</div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, cleaningTypes)}
                >
                  <SortableContext
                    items={cleaningTypes?.map(s => s.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {cleaningTypes?.map((setting) => (
                      <SortableItem
                        key={setting.id}
                        setting={setting}
                        category="cleaning_type"
                        editingId={editingId}
                        editForm={editForm}
                        onEdit={handleEdit}
                        onSave={handleSave}
                        onDelete={handleDelete}
                        onFormChange={setEditForm}
                        onCancelEdit={() => setEditingId(null)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment_methods">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Manage available payment methods for bookings</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setIsAddingNew(true);
                    setNewItemCategory('payment_method');
                    const maxOrder = Math.max(0, ...(paymentMethods?.map(s => s.display_order) || []));
                    setEditForm({ label: '', display_order: maxOrder + 1 });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Payment Method
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isAddingNew && newItemCategory === 'payment_method' && (
                <div className="p-4 border-2 border-dashed rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Key (ID) *</Label>
                      <Input
                        value={editForm.key || ''}
                        onChange={(e) => setEditForm({ ...editForm, key: e.target.value })}
                        placeholder="stripe"
                      />
                    </div>
                    <div>
                      <Label>Label *</Label>
                      <Input
                        value={editForm.label || ''}
                        onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                        placeholder="Stripe"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={editForm.display_order || ''}
                      onChange={(e) => setEditForm({ ...editForm, display_order: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddNew}>
                      <Save className="w-4 h-4 mr-1" /> Create
                    </Button>
                    <Button variant="outline" onClick={() => { setIsAddingNew(false); setEditForm({}); }}>
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              )}
              {loadingPaymentMethods ? (
                <div>Loading...</div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, paymentMethods)}
                >
                  <SortableContext
                    items={paymentMethods?.map(s => s.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {paymentMethods?.map((setting) => (
                      <SortableItem
                        key={setting.id}
                        setting={setting}
                        category="payment_method"
                        editingId={editingId}
                        editForm={editForm}
                        onEdit={handleEdit}
                        onSave={handleSave}
                        onDelete={handleDelete}
                        onFormChange={setEditForm}
                        onCancelEdit={() => setEditingId(null)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company_info">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Basic company details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingCompanyInfo ? (
                <div>Loading...</div>
              ) : (
                companyInfo?.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label>{setting.setting_value.label || setting.setting_key}</Label>
                      <Input
                        value={setting.setting_value.value || ''}
                        onChange={(e) => {
                          updateMutation.mutate({
                            id: setting.id,
                            updates: {
                              setting_value: { ...setting.setting_value, value: e.target.value },
                            },
                          });
                        }}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanySettingsManager;
