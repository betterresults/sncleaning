import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface BookingsViewControlsProps {
  viewMode: 'list' | 'calendar';
  onViewModeChange: (mode: 'list' | 'calendar') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  itemsPerPage: number;
  onItemsPerPageChange: (count: number) => void;
  onBulkEditClick: () => void;
}

export function BookingsViewControls({
  viewMode,
  onViewModeChange,
  sortOrder,
  onSortOrderChange,
  itemsPerPage,
  onItemsPerPageChange,
  onBulkEditClick
}: BookingsViewControlsProps) {
  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* List/Calendar Switch */}
        <div className="flex items-center gap-2">
          <Label htmlFor="view-mode" className="text-sm font-medium whitespace-nowrap">
            View:
          </Label>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${viewMode === 'list' ? 'font-medium' : 'text-gray-500'}`}>
              List
            </span>
            <Switch
              id="view-mode"
              checked={viewMode === 'calendar'}
              onCheckedChange={(checked) => onViewModeChange(checked ? 'calendar' : 'list')}
            />
            <span className={`text-sm ${viewMode === 'calendar' ? 'font-medium' : 'text-gray-500'}`}>
              Calendar
            </span>
          </div>
        </div>

        {/* Items per page */}
        <div className="flex items-center gap-2">
          <Label htmlFor="items-per-page" className="text-sm font-medium whitespace-nowrap">
            Show:
          </Label>
          <Select 
            value={itemsPerPage.toString()} 
            onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
          >
            <SelectTrigger id="items-per-page" className="w-20 h-9 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white shadow-lg rounded-lg z-50">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort order */}
        <div className="flex items-center gap-2">
          <Label htmlFor="sort-order" className="text-sm font-medium whitespace-nowrap">
            Sort:
          </Label>
          <Select 
            value={sortOrder} 
            onValueChange={(value: 'asc' | 'desc') => onSortOrderChange(value)}
          >
            <SelectTrigger id="sort-order" className="w-32 h-9 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white shadow-lg rounded-lg z-50">
              <SelectItem value="asc">Earliest first</SelectItem>
              <SelectItem value="desc">Latest first</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Edit Button */}
        <div className="sm:ml-auto">
          <Button 
            onClick={onBulkEditClick}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg h-9 px-4 w-full sm:w-auto"
          >
            <Settings className="h-4 w-4" />
            <span>Bulk Edit</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
