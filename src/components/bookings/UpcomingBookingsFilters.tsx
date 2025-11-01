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
  paymentMethod: string;
  paymentStatus: string;
  serviceType: string;
  cleaningType: string;
  bookingStatus: string;
}

interface UpcomingBookingsFiltersProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  cleaners: Cleaner[];
}

export function UpcomingBookingsFilters({ filters, onFiltersChange, cleaners }: UpcomingBookingsFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterType, setFilterType] = useState<'cleaner' | 'paymentMethod' | 'paymentStatus' | 'serviceType' | 'cleaningType' | 'bookingStatus' | ''>('');

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

  const handlePaymentMethodChange = (value: string) => {
    onFiltersChange({ ...filters, paymentMethod: value });
  };

  const handlePaymentStatusChange = (value: string) => {
    onFiltersChange({ ...filters, paymentStatus: value });
  };

  const handleServiceTypeChange = (value: string) => {
    onFiltersChange({ ...filters, serviceType: value });
  };

  const handleCleaningTypeChange = (value: string) => {
    onFiltersChange({ ...filters, cleaningType: value });
  };

  const handleBookingStatusChange = (value: string) => {
    onFiltersChange({ ...filters, bookingStatus: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: '',
      dateFrom: '',
      dateTo: '',
      cleanerId: 'all',
      paymentMethod: 'all',
      paymentStatus: 'all',
      serviceType: 'all',
      cleaningType: 'all',
      bookingStatus: 'all'
    });
    setFilterType('');
    setShowAdvancedFilters(false);
  };

  const hasActiveFilters = filters.searchTerm || filters.dateFrom || filters.dateTo || 
                          (filters.cleanerId && filters.cleanerId !== 'all') ||
                          (filters.paymentMethod && filters.paymentMethod !== 'all') ||
                          (filters.paymentStatus && filters.paymentStatus !== 'all') ||
                          (filters.serviceType && filters.serviceType !== 'all') ||
                          (filters.cleaningType && filters.cleaningType !== 'all') ||
                          (filters.bookingStatus && filters.bookingStatus !== 'all');

  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by customer name, email, phone, or address..."
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-11 text-base rounded-lg"
          />
        </div>

        {/* Date Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-11 rounded-lg whitespace-nowrap",
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
                "h-11 rounded-lg whitespace-nowrap",
                showAdvancedFilters && "border-primary bg-primary/5"
              )}
            >
              <Filter className="mr-2 h-4 w-4" />
              Advanced Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-white shadow-lg rounded-xl z-50" align="start">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Filter by</label>
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select filter type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white shadow-lg rounded-lg z-[100]">
                    <SelectItem value="cleaner">Cleaner</SelectItem>
                    <SelectItem value="paymentMethod">Payment Method</SelectItem>
                    <SelectItem value="paymentStatus">Payment Status</SelectItem>
                    <SelectItem value="serviceType">Service Type</SelectItem>
                    <SelectItem value="cleaningType">Cleaning Type</SelectItem>
                    <SelectItem value="bookingStatus">Booking Status</SelectItem>
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
                    <SelectContent className="bg-white shadow-lg rounded-lg z-[100]">
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

              {filterType === 'paymentMethod' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Payment Method</label>
                  <Select value={filters.paymentMethod} onValueChange={handlePaymentMethodChange}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Choose payment method" />
                    </SelectTrigger>
                    <SelectContent className="bg-white shadow-lg rounded-lg z-[100]">
                      <SelectItem value="all">All methods</SelectItem>
                      <SelectItem value="Stripe">Stripe</SelectItem>
                      <SelectItem value="Invoiless">Invoiless</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filterType === 'paymentStatus' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Payment Status</label>
                  <Select value={filters.paymentStatus} onValueChange={handlePaymentStatusChange}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Choose payment status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white shadow-lg rounded-lg z-[100]">
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                      <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                      <SelectItem value="Collecting">Collecting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filterType === 'serviceType' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Service Type</label>
                  <Select value={filters.serviceType} onValueChange={handleServiceTypeChange}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Choose service type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white shadow-lg rounded-lg z-[100]">
                      <SelectItem value="all">All services</SelectItem>
                      <SelectItem value="Standard Cleaning">Standard Cleaning</SelectItem>
                      <SelectItem value="Deep Cleaning">Deep Cleaning</SelectItem>
                      <SelectItem value="End of Tenancy">End of Tenancy</SelectItem>
                      <SelectItem value="After Builders">After Builders</SelectItem>
                      <SelectItem value="Airbnb">Airbnb</SelectItem>
                      <SelectItem value="Office Cleaning">Office Cleaning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filterType === 'cleaningType' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Cleaning Type</label>
                  <Select value={filters.cleaningType} onValueChange={handleCleaningTypeChange}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Choose cleaning type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white shadow-lg rounded-lg z-[100]">
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="One-off">One-off</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Fortnightly">Fortnightly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filterType === 'bookingStatus' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Booking Status</label>
                  <Select value={filters.bookingStatus} onValueChange={handleBookingStatusChange}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Choose booking status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white shadow-lg rounded-lg z-[100]">
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
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
            className="h-11 rounded-lg text-gray-600 hover:text-gray-900"
          >
            <X className="mr-2 h-4 w-4" />
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
}
