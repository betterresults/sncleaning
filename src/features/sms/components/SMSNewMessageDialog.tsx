import { Phone, Search } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Customer } from '../types';
import { getCustomerDisplayName } from '../utils/display';

interface SMSNewMessageDialogProps {
  customerSearch: string;
  onCustomerSearchChange: (value: string) => void;
  customers: Customer[];
  searchingCustomers: boolean;
  manualPhone: string;
  onManualPhoneChange: (value: string) => void;
  manualName: string;
  onManualNameChange: (value: string) => void;
  onStartWithManualPhone: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

export function SMSNewMessageDialog({
  customerSearch,
  onCustomerSearchChange,
  customers,
  searchingCustomers,
  manualPhone,
  onManualPhoneChange,
  manualName,
  onManualNameChange,
  onStartWithManualPhone,
  onSelectCustomer,
}: SMSNewMessageDialogProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Search Customer</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={customerSearch}
            onChange={(e) => onCustomerSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchingCustomers && (
          <div className="flex items-center justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        )}
        {customers.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded-md border">
            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => onSelectCustomer(customer)}
                className="flex w-full items-center gap-3 border-b p-3 text-left last:border-b-0 hover:bg-muted/50"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {(customer.full_name || customer.first_name || '?')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{getCustomerDisplayName(customer)}</p>
                  {customer.phone && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-2 block text-sm font-medium">Phone Number</label>
          <Input
            placeholder="+44..."
            value={manualPhone}
            onChange={(e) => onManualPhoneChange(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Name (optional)</label>
          <Input
            placeholder="Contact name"
            value={manualName}
            onChange={(e) => onManualNameChange(e.target.value)}
          />
        </div>
        <Button onClick={onStartWithManualPhone} disabled={!manualPhone.trim()} className="w-full">
          Start Conversation
        </Button>
      </div>
    </div>
  );
}
