
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
    <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 bg-gray-50 p-3 sm:p-4 rounded-lg">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
        <div className="flex items-center space-x-2">
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Show:</span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(parseInt(value))}>
            <SelectTrigger className="w-20 h-8 text-sm">
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
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Sort:</span>
          <Select value={sortOrder} onValueChange={onSortOrderChange}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Earliest first</SelectItem>
              <SelectItem value="desc">Latest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-right">
        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalBookings)} of {totalBookings} bookings
      </div>
    </div>
  );
};

export default TableControls;
