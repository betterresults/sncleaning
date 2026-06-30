import type { ReactNode } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShellFilterBar, shellFilterSelectClass } from '@/layouts/shell';
import type { AddressFilter, UsersTableUserType } from './types';

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
    <ShellFilterBar
      searchValue={searchTerm}
      onSearchChange={onSearchChange}
      filters={
        userType === 'customer' ? (
          <>
            <Select value={customerTypeFilter} onValueChange={onCustomerTypeFilterChange}>
              <SelectTrigger className={shellFilterSelectClass} aria-label="Customer type">
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
              <SelectTrigger className={shellFilterSelectClass} aria-label="Address filter">
                <SelectValue placeholder="Addresses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="with-addresses">With addresses</SelectItem>
                <SelectItem value="no-addresses">No address</SelectItem>
              </SelectContent>
            </Select>
          </>
        ) : undefined
      }
      trailing={
        resultCount || actions ? (
          <>
            {resultCount}
            {actions}
          </>
        ) : undefined
      }
    />
  );
}
