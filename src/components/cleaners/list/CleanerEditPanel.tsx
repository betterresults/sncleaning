import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';
import type { CleanerData } from './types';
import { CleanerScopeFields } from './CleanerScopeFields';

interface ServiceTypeOption {
  key: string;
  label: string;
}

export interface CleanerEditPanelProps {
  editData: Partial<CleanerData>;
  onEditDataChange: (data: Partial<CleanerData>) => void;
  serviceTypeKeys: string[];
  onServiceTypeKeysChange: (keys: string[]) => void;
  areaIds: string[];
  onAreaIdsChange: (ids: string[]) => void;
  serviceTypes: ServiceTypeOption[];
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export const CleanerEditPanel: React.FC<CleanerEditPanelProps> = ({
  editData,
  onEditDataChange,
  serviceTypeKeys,
  onServiceTypeKeysChange,
  areaIds,
  onAreaIdsChange,
  serviceTypes,
  onSave,
  onCancel,
  isSaving,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <div>
        <Label className="text-xs font-medium text-muted-foreground">First Name</Label>
        <Input
          value={editData.first_name || ''}
          onChange={(e) => onEditDataChange({ ...editData, first_name: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Last Name</Label>
        <Input
          value={editData.last_name || ''}
          onChange={(e) => onEditDataChange({ ...editData, last_name: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Email</Label>
        <Input
          type="email"
          value={editData.email || ''}
          onChange={(e) => onEditDataChange({ ...editData, email: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
        <Input
          type="tel"
          inputMode="tel"
          value={editData.phone != null ? String(editData.phone) : ''}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            onEditDataChange({
              ...editData,
              phone: digits ? Number(digits) : undefined,
            });
          }}
          className="mt-1"
          placeholder="07…"
        />
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Hourly Rate (£)</Label>
        <Input
          type="number"
          step="0.01"
          value={editData.hourly_rate || ''}
          onChange={(e) => onEditDataChange({ ...editData, hourly_rate: Number(e.target.value) })}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Percentage Rate (%)</Label>
        <Input
          type="number"
          min="0"
          max="100"
          value={editData.presentage_rate || ''}
          onChange={(e) => onEditDataChange({ ...editData, presentage_rate: Number(e.target.value) })}
          className="mt-1"
        />
      </div>
      <div className="md:col-span-2">
        <Label className="text-xs font-medium text-muted-foreground">Address</Label>
        <Input
          value={editData.address || ''}
          onChange={(e) => onEditDataChange({ ...editData, address: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Postcode</Label>
        <Input
          value={editData.postcode || ''}
          onChange={(e) => onEditDataChange({ ...editData, postcode: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Years Experience</Label>
        <Input
          type="number"
          min="0"
          value={editData.years ?? ''}
          onChange={(e) => onEditDataChange({ ...editData, years: Number(e.target.value) })}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground">DBS Status</Label>
        <Select
          value={editData.DBS || 'No'}
          onValueChange={(value) => onEditDataChange({ ...editData, DBS: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="No">No</SelectItem>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground">DBS Date</Label>
        <Input
          type="date"
          value={editData.DBS_date || ''}
          onChange={(e) => onEditDataChange({ ...editData, DBS_date: e.target.value })}
          className="mt-1"
        />
      </div>
      <div className="md:col-span-2 lg:col-span-3">
        <Label className="text-xs font-medium text-muted-foreground">Notes (optional)</Label>
        <Input
          value={editData.services || ''}
          onChange={(e) => onEditDataChange({ ...editData, services: e.target.value })}
          placeholder="Free-text notes, e.g. own equipment, prefers weekends..."
          className="mt-1"
        />
      </div>
    </div>

    <CleanerScopeFields
      serviceTypes={serviceTypes}
      serviceTypeKeys={serviceTypeKeys}
      onServiceTypeKeysChange={onServiceTypeKeysChange}
      areaIds={areaIds}
      onAreaIdsChange={onAreaIdsChange}
      chipClassName="flex items-center gap-2 text-sm bg-white/60 border rounded-md px-2 py-1.5 cursor-pointer"
    />

    <div className="flex items-center justify-between bg-white/60 border rounded-md px-3 py-2">
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Has own equipment</Label>
        <p className="text-xs text-muted-foreground">
          Toggle off if this cleaner does not bring their own vacuum/mop/supplies.
        </p>
      </div>
      <Switch
        checked={editData.has_equipment ?? true}
        onCheckedChange={(checked) => onEditDataChange({ ...editData, has_equipment: checked })}
      />
    </div>
    <div className="flex gap-2">
      <Button onClick={onSave} size="sm" disabled={isSaving}>
        <Save className="h-4 w-4 mr-2" />
        Save
      </Button>
      <Button onClick={onCancel} variant="outline" size="sm" disabled={isSaving}>
        <X className="h-4 w-4 mr-2" />
        Cancel
      </Button>
    </div>
  </div>
);
