import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AddressFilter, UsersTableUserType } from './types';

const filterSelectClass =
  'h-8 min-w-[7.5rem] border-transparent bg-black/[0.04] text-xs shadow-none focus:ring-0';

interface UsersListFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  userType: UsersTableUserType;
  customerTypeFilter: string;
  onCustomerTypeFilterChange: (value: string) => void;
  addressFilter: AddressFilter;
  onAddressFilterChange: (value: AddressFilter) => void;
  uniqueCustomerTypes: string[];
  resultCount?: ReactNode;
  actions?: ReactNode;
}

export function UsersListFilters({
  searchTerm,
  onSearchChange,
  userType,
  customerTypeFilter,
  onCustomerTypeFilterChange,
  addressFilter,
  onAddressFilterChange,
  uniqueCustomerTypes,
  resultCount,
  actions,
}: UsersListFiltersProps) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 border-b border-shell-divider pb-3 md:flex-nowrap">
      <div className="relative min-w-0 flex-1 basis-full md:max-w-xs md:basis-auto">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          placeholder="Search…"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 border-transparent bg-black/[0.04] pl-10 pr-3 text-sm shadow-none focus-visible:border-shell-brand/30 focus-visible:bg-white focus-visible:ring-0"
        />
      </div>

      {userType === 'customer' && (
        <div className="flex shrink-0 items-center gap-1.5">
          <Select value={customerTypeFilter} onValueChange={onCustomerTypeFilterChange}>
            <SelectTrigger className={filterSelectClass} aria-label="Customer type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {uniqueCustomerTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === 'empty' ? '—' : type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={addressFilter}
            onValueChange={(value) => onAddressFilterChange(value as AddressFilter)}
          >
            <SelectTrigger className={filterSelectClass} aria-label="Address filter">
              <SelectValue placeholder="Addresses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="with-addresses">With addresses</SelectItem>
              <SelectItem value="no-addresses">No address</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {(resultCount || actions) && (
        <div className="flex w-full shrink-0 items-center justify-between gap-2 md:ml-auto md:w-auto md:justify-end">
          {resultCount}
          {actions}
        </div>
      )}
    </div>
  );
}
