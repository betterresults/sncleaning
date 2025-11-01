import React, { useState } from 'react';
import { Search, Calendar, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
}

interface FiltersState {
  searchTerm: string;
  dateFrom: string;
  dateTo: string;
  cleanerId: string;
}

interface UpcomingBookingsFiltersProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  cleaners: Cleaner[];
}

export function UpcomingBookingsFilters({ filters, onFiltersChange, cleaners }: UpcomingBookingsFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterType, setFilterType] = useState<'cleaner' | ''>('');

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchTerm: value });
  };

  const handleDateFromChange = (date: Date | undefined) => {
    onFiltersChange({ 
      ...filters, 
      dateFrom: date ? date.toISOString().split('T')[0] : '' 
    });
  };

  const handleDateToChange = (date: Date | undefined) => {
    onFiltersChange({ 
      ...filters, 
      dateTo: date ? date.toISOString().split('T')[0] : '' 
    });
  };

  const handleCleanerChange = (value: string) => {
    onFiltersChange({ ...filters, cleanerId: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: '',
      dateFrom: '',
      dateTo: '',
      cleanerId: 'all'
    });
    setFilterType('');
    setShowAdvancedFilters(false);
  };

  const hasActiveFilters = filters.searchTerm || filters.dateFrom || filters.dateTo || 
                          (filters.cleanerId && filters.cleanerId !== 'all');

  return (
    <Card className="border shadow-md rounded-xl">
      <div className="p-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by customer name, email, phone, or address..."
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-12 text-base rounded-lg shadow-sm"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 rounded-lg shadow-sm",
                  (filters.dateFrom || filters.dateTo) && "border-primary bg-primary/5"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {filters.dateFrom && filters.dateTo 
                  ? `${format(new Date(filters.dateFrom), 'dd/MM/yy')} - ${format(new Date(filters.dateTo), 'dd/MM/yy')}`
                  : filters.dateFrom
                  ? `From ${format(new Date(filters.dateFrom), 'dd/MM/yy')}`
                  : filters.dateTo
                  ? `Until ${format(new Date(filters.dateTo), 'dd/MM/yy')}`
                  : 'Select date range'
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4 bg-white shadow-lg rounded-xl" align="start">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">From Date</label>
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                    onSelect={handleDateFromChange}
                    className="p-3 pointer-events-auto rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">To Date</label>
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                    onSelect={handleDateToChange}
                    className="p-3 pointer-events-auto rounded-lg"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Advanced Filters Button */}
          <Popover open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 rounded-lg shadow-sm",
                  showAdvancedFilters && "border-primary bg-primary/5"
                )}
              >
                <Filter className="mr-2 h-4 w-4" />
                Advanced Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-white shadow-lg rounded-xl" align="start">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Filter by</label>
                  <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select filter type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white shadow-lg rounded-lg z-50">
                      <SelectItem value="cleaner">Cleaner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filterType === 'cleaner' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Cleaner</label>
                    <Select value={filters.cleanerId} onValueChange={handleCleanerChange}>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Choose cleaner" />
                      </SelectTrigger>
                      <SelectContent className="bg-white shadow-lg rounded-lg z-50">
                        <SelectItem value="all">All cleaners</SelectItem>
                        {cleaners.map((cleaner) => (
                          <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                            {cleaner.first_name} {cleaner.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="h-10 rounded-lg text-gray-600 hover:text-gray-900"
            >
              <X className="mr-2 h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
