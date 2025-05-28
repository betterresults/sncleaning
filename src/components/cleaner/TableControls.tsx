

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TableControlsProps {
  itemsPerPage: number;
  sortOrder: 'asc' | 'desc';
  startIndex: number;
  totalBookings: number;
  onItemsPerPageChange: (value: number) => void;
  onSortOrderChange: (value: 'asc' | 'desc') => void;
}

const TableControls: React.FC<TableControlsProps> = ({
  itemsPerPage,
  sortOrder,
  startIndex,
  totalBookings,
  onItemsPerPageChange,
  onSortOrderChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 bg-gray-50 p-3 sm:p-4 rounded-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
        <div className="flex items-center space-x-2">
          <span className="text-xs sm:text-sm font-medium">Show:</span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(parseInt(value))}>
            <SelectTrigger className="w-16 sm:w-20 h-7 sm:h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs sm:text-sm font-medium">Sort:</span>
          <Select value={sortOrder} onValueChange={onSortOrderChange}>
            <SelectTrigger className="w-28 sm:w-32 h-7 sm:h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Earliest first</SelectItem>
              <SelectItem value="desc">Latest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="text-xs sm:text-sm text-gray-600 w-full sm:w-auto text-left sm:text-right">
        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalBookings)} of {totalBookings} bookings
      </div>
    </div>
  );
};

export default TableControls;

