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

interface UsersListFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  userType: UsersTableUserType;
  customerTypeFilter: string;
  onCustomerTypeFilterChange: (value: string) => void;
  addressFilter: AddressFilter;
  onAddressFilterChange: (value: AddressFilter) => void;
  uniqueCustomerTypes: string[];
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
}: UsersListFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search users by name, email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {userType === 'customer' && (
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Customer Type</label>
            <Select value={customerTypeFilter} onValueChange={onCustomerTypeFilterChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueCustomerTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === 'empty' ? '—' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Addresses</label>
            <Select value={addressFilter} onValueChange={(value) => onAddressFilterChange(value as AddressFilter)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="with-addresses">With Addresses</SelectItem>
                <SelectItem value="no-addresses">No Address</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
