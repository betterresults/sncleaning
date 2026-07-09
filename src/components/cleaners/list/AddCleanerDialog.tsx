import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { AreaCoverageSelector } from './AreaCoverageSelector';
import { createEmptyNewCleanerData, toggleSelectionKey } from './types';

interface ServiceTypeOption {
  key: string;
  label: string;
}

export interface AddCleanerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceTypes: ServiceTypeOption[];
  onSubmit: (data: {
    cleaner: ReturnType<typeof createEmptyNewCleanerData>;
    password?: string;
    serviceTypeKeys: string[];
    areaIds: string[];
  }) => void;
  isSubmitting?: boolean;
}

export const AddCleanerDialog: React.FC<AddCleanerDialogProps> = ({
  open,
  onOpenChange,
  serviceTypes,
  onSubmit,
  isSubmitting,
}) => {
  const [newCleanerData, setNewCleanerData] = useState(createEmptyNewCleanerData);
  const [newServiceTypeKeys, setNewServiceTypeKeys] = useState<string[]>([]);
  const [newAreaIds, setNewAreaIds] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const resetForm = () => {
    setNewCleanerData(createEmptyNewCleanerData());
    setNewServiceTypeKeys([]);
    setNewAreaIds([]);
    setShowPassword(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handleSubmit = () => {
    const { password, ...cleaner } = newCleanerData;
    onSubmit({
      cleaner: newCleanerData,
      password: password || undefined,
      serviceTypeKeys: newServiceTypeKeys,
      areaIds: newAreaIds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Cleaner</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={newCleanerData.first_name}
                onChange={(e) => setNewCleanerData({ ...newCleanerData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={newCleanerData.last_name}
                onChange={(e) => setNewCleanerData({ ...newCleanerData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newCleanerData.email}
                onChange={(e) => setNewCleanerData({ ...newCleanerData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newCleanerData.phone}
                onChange={(e) => setNewCleanerData({ ...newCleanerData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Password (Optional - for creating user account)</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={newCleanerData.password}
                onChange={(e) => setNewCleanerData({ ...newCleanerData, password: e.target.value })}
                placeholder="Leave empty to skip account creation"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newCleanerData.address}
                onChange={(e) => setNewCleanerData({ ...newCleanerData, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                value={newCleanerData.postcode}
                onChange={(e) => setNewCleanerData({ ...newCleanerData, postcode: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hourlyRate">Hourly Rate (£) *</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                value={newCleanerData.hourly_rate}
                onChange={(e) =>
                  setNewCleanerData({ ...newCleanerData, hourly_rate: Number(e.target.value) })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="percentageRate">Percentage Rate (%) *</Label>
              <Input
                id="percentageRate"
                type="number"
                min="0"
                max="100"
                value={newCleanerData.presentage_rate}
                onChange={(e) =>
                  setNewCleanerData({ ...newCleanerData, presentage_rate: Number(e.target.value) })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Services offered</Label>
            <p className="text-xs text-gray-500 mb-2">
              Leave all unchecked to treat this cleaner as offering every service (default).
            </p>
            <div className="flex flex-wrap gap-3">
              {serviceTypes.map((st) => (
                <label
                  key={st.key}
                  className="flex items-center gap-2 text-sm border rounded-md px-2 py-1.5 cursor-pointer"
                >
                  <Checkbox
                    checked={newServiceTypeKeys.includes(st.key)}
                    onCheckedChange={() =>
                      toggleSelectionKey(newServiceTypeKeys, setNewServiceTypeKeys, st.key)
                    }
                  />
                  {st.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Areas covered</Label>
            <p className="text-xs text-gray-500 mb-2">
              Leave all unchecked to treat this cleaner as covering every area (default).
            </p>
            <AreaCoverageSelector
              selectedIds={newAreaIds}
              onToggle={(boroughId) => toggleSelectionKey(newAreaIds, setNewAreaIds, boroughId)}
            />
          </div>

          <div className="flex items-center justify-between border rounded-md px-3 py-2">
            <div>
              <Label className="mb-1 block">Has own equipment</Label>
              <p className="text-xs text-gray-500">
                On by default — toggle off if this cleaner does not bring their own vacuum/mop/supplies.
              </p>
            </div>
            <Switch
              checked={newCleanerData.has_equipment}
              onCheckedChange={(checked) =>
                setNewCleanerData({ ...newCleanerData, has_equipment: checked })
              }
            />
          </div>

          <div>
            <Label htmlFor="services">Notes (optional)</Label>
            <Input
              id="services"
              value={newCleanerData.services}
              onChange={(e) => setNewCleanerData({ ...newCleanerData, services: e.target.value })}
              placeholder="Free-text notes, e.g. own equipment, prefers weekends..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="years">Years Experience</Label>
              <Input
                id="years"
                type="number"
                min="0"
                value={newCleanerData.years}
                onChange={(e) =>
                  setNewCleanerData({ ...newCleanerData, years: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label htmlFor="dbs">DBS Status</Label>
              <Select
                value={newCleanerData.DBS}
                onValueChange={(value) => setNewCleanerData({ ...newCleanerData, DBS: value })}
              >
                <SelectTrigger>
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
              <Label htmlFor="dbsDate">DBS Date</Label>
              <Input
                id="dbsDate"
                type="date"
                value={newCleanerData.DBS_date}
                onChange={(e) => setNewCleanerData({ ...newCleanerData, DBS_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Cleaner'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
