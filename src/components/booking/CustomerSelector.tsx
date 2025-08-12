
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Check, ChevronsUpDown, Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import CreateCustomerDialog from './CreateCustomerDialog';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  client_type?: string;
}

interface CustomerSelectorProps {
  onCustomerSelect: (customer: Customer | null) => void;
}

const CustomerSelector = ({ onCustomerSelect }: CustomerSelectorProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('first_name');

      if (error) {
        console.error('Error fetching customers:', error);
        return;
      }

      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setOpen(false);
    onCustomerSelect(customer);
  };

  const handleCustomerCreated = (newCustomer: Customer) => {
    setCustomers(prev => [...prev, newCustomer]);
    setSelectedCustomer(newCustomer);
    onCustomerSelect(newCustomer);
  };

  const getCustomerDisplayText = (customer: Customer) => {
    return `${customer.first_name} ${customer.last_name} - ${customer.email}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="customerSelect">Select Customer</Label>
        <div className="flex gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="flex-1 justify-between"
              >
                {selectedCustomer
                  ? getCustomerDisplayText(selectedCustomer)
                  : "Search and select a customer..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-white" side="bottom" align="start">
              <Command className="bg-white">
                <CommandInput placeholder="Search customers by name or email..." />
                <CommandList className="max-h-[200px] overflow-auto">
                  <CommandEmpty>No customers found.</CommandEmpty>
                  <CommandGroup>
                    {customers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={getCustomerDisplayText(customer)}
                        onSelect={() => handleCustomerSelect(customer)}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {customer.first_name} {customer.last_name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {customer.email}
                            {customer.client_type && (
                              <span className="ml-2 px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                {customer.client_type}
                              </span>
                            )}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          <CreateCustomerDialog onCustomerCreated={handleCustomerCreated}>
            <Button type="button" variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </CreateCustomerDialog>
        </div>
      </div>
    </div>
  );
};

export default CustomerSelector;
