
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
    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Show:</span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(parseInt(value))}>
            <SelectTrigger className="w-20 h-8">
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
          <span className="text-sm font-medium">Sort:</span>
          <Select value={sortOrder} onValueChange={onSortOrderChange}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Earliest first</SelectItem>
              <SelectItem value="desc">Latest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalBookings)} of {totalBookings} bookings
      </div>
    </div>
  );
};

export default TableControls;
