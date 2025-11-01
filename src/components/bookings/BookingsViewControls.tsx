import React from 'react';
import { List, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface BookingsViewControlsProps {
  viewMode: 'list' | 'calendar';
  onViewModeChange: (mode: 'list' | 'calendar') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  itemsPerPage: number;
  onItemsPerPageChange: (count: number) => void;
  totalItems: number;
  currentRange: { start: number; end: number };
}

export function BookingsViewControls({
  viewMode,
  onViewModeChange,
  sortOrder,
  onSortOrderChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
  currentRange
}: BookingsViewControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-white border rounded-xl shadow-sm">
      {/* Left side - View toggle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className={cn(
              "h-9 px-4 rounded-md transition-all",
              viewMode === 'list' && "shadow-sm"
            )}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('calendar')}
            className={cn(
              "h-9 px-4 rounded-md transition-all",
              viewMode === 'calendar' && "shadow-sm"
            )}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </Button>
        </div>

        {/* Sort order toggle */}
        <div className="flex items-center gap-2 px-3 py-2 border rounded-lg">
          <Label htmlFor="sort-order" className="text-sm font-medium whitespace-nowrap">
            Sort:
          </Label>
          <Switch
            id="sort-order"
            checked={sortOrder === 'desc'}
            onCheckedChange={(checked) => onSortOrderChange(checked ? 'desc' : 'asc')}
          />
          <span className="text-sm text-gray-600">
            {sortOrder === 'asc' ? 'Earliest first' : 'Latest first'}
          </span>
        </div>
      </div>

      {/* Right side - Items per page and count */}
      <div className="flex items-center gap-4">
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

        <div className="text-sm text-gray-600 border-l pl-4">
          Showing <span className="font-semibold">{currentRange.start}-{currentRange.end}</span> of{' '}
          <span className="font-semibold">{totalItems}</span>
        </div>
      </div>
    </div>
  );
}
