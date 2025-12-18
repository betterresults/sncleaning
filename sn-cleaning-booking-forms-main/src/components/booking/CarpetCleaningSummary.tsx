import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { CarpetCleaningData, CarpetCleaningItem } from './CarpetCleaningForm';
import { Layers, Clock, Calendar, PoundSterling, ChevronDown, ChevronUp, Edit2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface CarpetCleaningSummaryProps {
  data: CarpetCleaningData;
  isAdminMode?: boolean;
  onUpdate?: (updates: Partial<CarpetCleaningData>) => void;
}

export const CarpetCleaningSummary: React.FC<CarpetCleaningSummaryProps> = ({
  data,
  isAdminMode = false,
  onUpdate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingPricing, setIsEditingPricing] = useState(false);

  const getTotalItemCount = () => {
    const carpetCount = data.carpetItems.reduce((sum, item) => sum + item.quantity, 0);
    const upholsteryCount = data.upholsteryItems.reduce((sum, item) => sum + item.quantity, 0);
    const mattressCount = data.mattressItems.reduce((sum, item) => sum + item.quantity, 0);
    return carpetCount + upholsteryCount + mattressCount;
  };

  const getItemsSubtotal = () => {
    const carpetTotal = data.carpetItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const upholsteryTotal = data.upholsteryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const mattressTotal = data.mattressItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return carpetTotal + upholsteryTotal + mattressTotal;
  };

  const getShortNoticeInfo = () => {
    if (!data.selectedDate) {
      return { charge: 0, notice: '', hoursUntil: 0 };
    }
    const now = new Date();
    const cleaningDate = new Date(data.selectedDate);
    const isToday = cleaningDate.getDate() === now.getDate() && 
                    cleaningDate.getMonth() === now.getMonth() && 
                    cleaningDate.getFullYear() === now.getFullYear();
    
    if (data.selectedTime) {
      const timeStr = data.selectedTime.replace(/[AP]M/, '').trim();
      const [hours, minutes] = timeStr.split(':').map(Number);
      let adjustedHours = hours;
      if (data.selectedTime.includes('PM') && hours !== 12) adjustedHours += 12;
      if (data.selectedTime.includes('AM') && hours === 12) adjustedHours = 0;
      cleaningDate.setHours(adjustedHours, minutes || 0, 0, 0);
    } else {
      cleaningDate.setHours(9, 0, 0, 0);
    }
    
    const hoursUntilCleaning = (cleaningDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (isToday || hoursUntilCleaning <= 12) {
      return { charge: 50, notice: 'Same day booking (within 12 hours)', hoursUntil: hoursUntilCleaning };
    }
    if (hoursUntilCleaning <= 24) {
      return { charge: 30, notice: 'Short notice booking (within 24 hours)', hoursUntil: hoursUntilCleaning };
    }
    if (hoursUntilCleaning <= 48) {
      return { charge: 15, notice: 'Short notice booking (within 48 hours)', hoursUntil: hoursUntilCleaning };
    }
    return { charge: 0, notice: '', hoursUntil: hoursUntilCleaning };
  };

  const shortNoticeInfo = getShortNoticeInfo();
  const hasShortNoticeCharge = shortNoticeInfo.charge > 0 && !(isAdminMode && data.adminRemoveShortNoticeCharge);

  const calculateTotal = () => {
    if (data.adminTotalCostOverride !== undefined && data.adminTotalCostOverride !== null && data.adminTotalCostOverride > 0) {
      return data.adminTotalCostOverride;
    }
    
    let total = getItemsSubtotal();
    
    if (!(isAdminMode && data.adminRemoveShortNoticeCharge)) {
      total += shortNoticeInfo.charge;
    }
    
    if (isAdminMode && data.adminDiscountPercentage) {
      total -= total * data.adminDiscountPercentage / 100;
    }
    if (isAdminMode && data.adminDiscountAmount) {
      total -= data.adminDiscountAmount;
    }
    
    return Math.max(0, total);
  };

  useEffect(() => {
    if (onUpdate) {
      const calculatedTotal = calculateTotal();
      const updates: Partial<CarpetCleaningData> = {};
      
      if (calculatedTotal !== data.totalCost) {
        updates.totalCost = calculatedTotal;
      }
      
      if (shortNoticeInfo.charge !== data.shortNoticeCharge) {
        updates.shortNoticeCharge = shortNoticeInfo.charge;
      }
      
      if (Object.keys(updates).length > 0) {
        onUpdate(updates);
      }
    }
  }, [
    data.carpetItems,
    data.upholsteryItems,
    data.mattressItems,
    data.adminTotalCostOverride,
    data.adminDiscountPercentage,
    data.adminDiscountAmount,
    data.adminRemoveShortNoticeCharge,
    shortNoticeInfo.charge,
  ]);

  const renderItemsList = (items: CarpetCleaningItem[], title: string) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center pl-2">
            <span className="text-sm text-foreground">
              {item.name} {item.size && `(${item.size})`} x{item.quantity}
            </span>
            <span className="text-sm font-medium text-foreground">
              £{(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="p-4 sm:p-5 lg:p-6 bg-white sticky top-4 border border-border">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Booking Summary</h3>
        {isAdminMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditingPricing(!isEditingPricing)}
            className="text-primary hover:bg-primary/10"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            {isEditingPricing ? 'Done' : 'Edit'}
          </Button>
        )}
      </div>

      {/* Items Count */}
      {getTotalItemCount() > 0 && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{getTotalItemCount()} item{getTotalItemCount() !== 1 ? 's' : ''} selected</p>
          </div>
        </div>
      )}

      {/* Date/Time */}
      {data.selectedDate && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              {data.selectedDate.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
              })}
              {data.selectedTime && ` at ${data.selectedTime}`}
            </p>
          </div>
        </div>
      )}

      {/* Items breakdown */}
      {getTotalItemCount() > 0 && (
        <div className="mb-4 pb-4 border-b border-border space-y-3">
          {renderItemsList(data.carpetItems, 'Carpet Cleaning')}
          {renderItemsList(data.upholsteryItems, 'Upholstery Cleaning')}
          {renderItemsList(data.mattressItems, 'Mattress Cleaning')}
        </div>
      )}

      {/* Short Notice Charge */}
      {shortNoticeInfo.charge > 0 && (
        <div className="mb-4 pb-4 border-b border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{shortNoticeInfo.notice}</span>
            <span className={`text-sm font-semibold ${isAdminMode && data.adminRemoveShortNoticeCharge ? 'line-through text-gray-400' : 'text-foreground'}`}>
              {isAdminMode && data.adminRemoveShortNoticeCharge && (
                <span className="text-green-600 mr-2 no-underline">WAIVED</span>
              )}
              £{shortNoticeInfo.charge.toFixed(2)}
            </span>
          </div>
        </div>
      )}
      
      {/* Admin Discounts Display */}
      {isAdminMode && data.adminDiscountPercentage && data.adminDiscountPercentage > 0 && (
        <div className="flex justify-between items-center text-red-600 mb-2">
          <span className="text-sm">Discount ({data.adminDiscountPercentage}%)</span>
          <span className="text-sm font-semibold">
            -£{((calculateTotal() / (1 - data.adminDiscountPercentage / 100)) * data.adminDiscountPercentage / 100).toFixed(2)}
          </span>
        </div>
      )}
      
      {isAdminMode && data.adminDiscountAmount && data.adminDiscountAmount > 0 && (
        <div className="flex justify-between items-center text-red-600 mb-2">
          <span className="text-sm">Fixed Discount</span>
          <span className="text-sm font-semibold">-£{data.adminDiscountAmount.toFixed(2)}</span>
        </div>
      )}

      {/* Admin Pricing Controls */}
      {isAdminMode && isEditingPricing && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <h4 className="text-sm font-semibold text-amber-800 mb-3">Admin Pricing Controls</h4>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-amber-700">Total Cost Override (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={data.adminTotalCostOverride || ''}
                onChange={(e) => onUpdate?.({ adminTotalCostOverride: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="Leave empty for calculated"
                className="h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-amber-700">Discount %</Label>
                <Input
                  type="number"
                  step="1"
                  value={data.adminDiscountPercentage || ''}
                  onChange={(e) => onUpdate?.({ adminDiscountPercentage: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="0"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-amber-700">Fixed Discount (£)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={data.adminDiscountAmount || ''}
                  onChange={(e) => onUpdate?.({ adminDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="0"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="removeShortNotice"
                checked={data.adminRemoveShortNoticeCharge || false}
                onChange={(e) => onUpdate?.({ adminRemoveShortNoticeCharge: e.target.checked })}
                className="rounded border-amber-300"
              />
              <Label htmlFor="removeShortNotice" className="text-xs text-amber-700 cursor-pointer">
                Waive short notice charge
              </Label>
            </div>
          </div>
        </div>
      )}

      {/* Total */}
      <div className="pt-4 border-t border-border">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <PoundSterling className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">Total</span>
          </div>
          <span className="text-2xl font-bold text-primary">
            £{calculateTotal().toFixed(2)}
          </span>
        </div>
      </div>
    </Card>
  );
};
