import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Check, ChevronsUpDown, X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

import { cn } from '@/lib/utils';
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
  address?: string;
  postcode?: string;
}

interface CustomerSelectorProps {
  onCustomerSelect: (customer: Customer | null) => void;
  selectedCustomer?: Customer | null;
}

const CustomerSelector = ({ onCustomerSelect, selectedCustomer: externalSelectedCustomer }: CustomerSelectorProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(externalSelectedCustomer || null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Sync with external selected customer
  useEffect(() => {
    setSelectedCustomer(externalSelectedCustomer || null);
  }, [externalSelectedCustomer]);

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    
    const query = searchQuery.toLowerCase().trim();
    return customers.filter((customer) => {
      const firstName = (customer.first_name || '').toLowerCase();
      const lastName = (customer.last_name || '').toLowerCase();
      const email = (customer.email || '').toLowerCase();
      const phone = (customer.phone || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`;
      
      return (
        firstName.includes(query) ||
        lastName.includes(query) ||
        fullName.includes(query) ||
        email.includes(query) ||
        phone.includes(query)
      );
    });
  }, [customers, searchQuery]);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setOpen(false);
    setSearchQuery('');
    onCustomerSelect(customer);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    onCustomerSelect(null);
  };

  const getCustomerDisplayText = (customer: Customer) => {
    return `${customer.first_name || ''} ${customer.last_name || ''} - ${customer.email || ''}`.trim();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) setSearchQuery('');
        }} modal>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="h-16 flex-1 justify-between overflow-hidden text-ellipsis text-lg rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 focus:border-[#185166] px-6 font-medium transition-all duration-200 text-gray-900 hover:text-gray-900"
            >
              {selectedCustomer
                ? getCustomerDisplayText(selectedCustomer)
                : "Search and select a customer..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[520px] p-0 bg-white pointer-events-auto z-50" side="bottom" align="start">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10"
                  autoFocus
                />
              </div>
            </div>
            <ScrollArea className="h-72">
              {filteredCustomers.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  No customers found.
                </div>
              ) : (
                <div className="p-1">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="flex items-center gap-2 px-3 py-3 cursor-pointer hover:bg-gray-100 rounded-md"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">
                          {customer.first_name} {customer.last_name}
                        </span>
                        <span className="text-sm text-gray-500 truncate">
                          {customer.email}
                          {customer.phone && (
                            <span className="ml-2">• {customer.phone}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
        
        {selectedCustomer ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-16 w-16 rounded-2xl border-2 border-gray-200 hover:bg-red-50 hover:border-red-200"
            onClick={handleClearCustomer}
            title="Clear selection and create new customer"
          >
            <X className="h-5 w-5 text-red-500" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-16 w-16 rounded-2xl border-2 border-green-200 bg-green-50 hover:bg-green-100"
            onClick={handleClearCustomer}
            title="Create new customer"
          >
            <Plus className="h-5 w-5 text-green-600" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default CustomerSelector;
