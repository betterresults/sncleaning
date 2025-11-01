import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import {
  useCompanySettings,
  useCreateCompanySetting,
  useUpdateCompanySetting,
  useDeleteCompanySetting,
  CompanySetting,
} from '@/hooks/useCompanySettings';
import { Switch } from '@/components/ui/switch';

const CompanySettingsManager = () => {
  const { data: serviceTypes, isLoading: loadingServiceTypes } = useCompanySettings('service_type');
  const { data: cleaningTypes, isLoading: loadingCleaningTypes } = useCompanySettings('cleaning_type');
  const { data: companyInfo, isLoading: loadingCompanyInfo } = useCompanySettings('company_info');

  const createMutation = useCreateCompanySetting();
  const updateMutation = useUpdateCompanySetting();
  const deleteMutation = useDeleteCompanySetting();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemCategory, setNewItemCategory] = useState<'service_type' | 'cleaning_type'>('service_type');

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

  const renderSettingRow = (setting: CompanySetting, category: string) => {
    const isEditing = editingId === setting.id;

    return (
      <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                  onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                />
              </div>
            </div>
            {category === 'service_type' && (
              <>
                <div>
                  <Label>Badge Color (Tailwind classes)</Label>
                  <Input
                    value={editForm.badge_color}
                    onChange={(e) => setEditForm({ ...editForm, badge_color: e.target.value })}
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
                          setEditForm({ ...editForm, allowed_cleaning_types: updated });
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
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={editForm.display_order || ''}
                  onChange={(e) => setEditForm({ ...editForm, display_order: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editForm.is_active}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleSave(setting.id, category)}>
                <Save className="w-4 h-4 mr-1" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
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
              <Button size="sm" variant="outline" onClick={() => handleEdit(setting)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(setting.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="service_types" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="service_types">Service Types</TabsTrigger>
          <TabsTrigger value="cleaning_types">Cleaning Types</TabsTrigger>
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
                    setEditForm({ label: '', badge_color: '', display_order: 0 });
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
                serviceTypes?.map((setting) => renderSettingRow(setting, 'service_type'))
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
                    setEditForm({ label: '', description: '', display_order: 0 });
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
                cleaningTypes?.map((setting) => renderSettingRow(setting, 'cleaning_type'))
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
