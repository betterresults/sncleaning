import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { CleanerScopeFields } from './CleanerScopeFields';
import { createEmptyNewCleanerData } from './types';

interface ServiceTypeOption {
  key: string;
  label: string;
}

export interface AddCleanerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceTypes: ServiceTypeOption[];
  onSubmit: (data: {
    cleaner: Omit<ReturnType<typeof createEmptyNewCleanerData>, 'password'>;
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
      cleaner,
      password: password.trim() || undefined,
      serviceTypeKeys: newServiceTypeKeys,
      areaIds: newAreaIds,
    });
  };

  // Unmount when closed. Radix Presence can leave a visible shell if the exit
  // animation never fires animationend (seen with this tall dialog layout).
  if (!open) return null;

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 gap-0">
        <div className="flex max-h-[90vh] flex-col">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>Add New Cleaner</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto px-6 flex-1 min-h-0">
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
                type="tel"
                inputMode="tel"
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

          <CleanerScopeFields
            serviceTypes={serviceTypes}
            serviceTypeKeys={newServiceTypeKeys}
            onServiceTypeKeysChange={setNewServiceTypeKeys}
            areaIds={newAreaIds}
            onAreaIdsChange={setNewAreaIds}
          />

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

          <div className="grid grid-cols-3 gap-4 pb-2">
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
        </div>

        <div className="flex justify-end space-x-2 shrink-0 border-t bg-background px-6 py-4">
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
