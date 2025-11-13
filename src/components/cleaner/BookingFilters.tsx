
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CalendarIcon, Search, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface BookingFiltersProps {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  customerSearch: string;
  serviceTypeFilter: string;
  serviceTypes: string[];
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  onCustomerSearchChange: (value: string) => void;
  onServiceTypeFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

const BookingFilters: React.FC<BookingFiltersProps> = ({
  dateFrom,
  dateTo,
  customerSearch,
  serviceTypeFilter,
  serviceTypes,
  onDateFromChange,
  onDateToChange,
  onCustomerSearchChange,
  onServiceTypeFilterChange,
  onClearFilters,
}) => {
  const isMobile = useIsMobile();

  const FilterContent = () => (
    <div className="grid grid-cols-1 gap-4">
      {/* Date filters row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date-from" className="text-sm font-medium">From Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-9",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={onDateFromChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-to" className="text-sm font-medium">To Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-9",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={onDateToChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Search field */}
      <div className="space-y-2">
        <Label htmlFor="customer-search" className="text-sm font-medium">Customer</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="customer-search"
            placeholder="Search customer..."
            value={customerSearch}
            onChange={(e) => onCustomerSearchChange(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Filter dropdowns */}
      <div className="space-y-2">
        <Label htmlFor="service-type-filter" className="text-sm font-medium">Service Type</Label>
        <Select value={serviceTypeFilter} onValueChange={onServiceTypeFilterChange}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {serviceTypes.map((serviceType) => (
                <SelectItem key={serviceType} value={serviceType}>
                  {serviceType}
                </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear filters button */}
      <Button
        variant="outline"
        onClick={onClearFilters}
        className="h-9 w-full sm:w-auto"
      >
        <X className="mr-2 h-4 w-4" />
        Clear Filters
      </Button>
    </div>
  );

  return (
    <Card>
      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="filters" className="border-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filters</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <FilterContent />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default BookingFilters;
