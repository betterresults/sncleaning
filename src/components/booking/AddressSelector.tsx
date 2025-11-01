import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Check, ChevronsUpDown, MapPin } from 'lucide-react';
import CreateAddressDialog from './CreateAddressDialog';
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

interface Address {
  id: string;
  customer_id: number;
  address: string;
  postcode: string;
  access?: string;
  deatails?: string;
  is_default?: boolean;
}

interface AddressSelectorProps {
  customerId: number;
  onAddressSelect: (address: Address | null) => void;
}

const AddressSelector = ({ customerId, onAddressSelect }: AddressSelectorProps) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching addresses:', error);
        return;
      }

      setAddresses(data || []);
      
      // Auto-select default address if available
      const defaultAddress = data?.find(addr => addr.is_default);
      if (defaultAddress && !selectedAddress) {
        setSelectedAddress(defaultAddress);
        onAddressSelect(defaultAddress);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchAddresses();
    }
  }, [customerId]);

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setOpen(false);
    onAddressSelect(address);
  };

  const handleAddressCreated = (newAddress: Address) => {
    setAddresses(prev => [newAddress, ...prev]);
    setSelectedAddress(newAddress);
    onAddressSelect(newAddress);
  };

  const getAddressDisplayText = (address: Address) => {
    return `${address.address}, ${address.postcode}${address.deatails ? ' - ' + address.deatails : ''}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen} modal>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="h-16 flex-1 justify-between overflow-hidden text-ellipsis text-lg rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 focus:border-[#185166] px-6 font-medium transition-all duration-200"
              disabled={!customerId}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <MapPin className="h-5 w-5 flex-shrink-0 text-gray-400" />
                <span className="truncate">
                  {selectedAddress
                    ? getAddressDisplayText(selectedAddress)
                    : "Search and select an address..."}
                </span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[520px] p-0 bg-white pointer-events-auto z-50" side="bottom" align="start">
            <Command className="bg-white">
              <CommandInput placeholder="Search addresses..." className="h-12" />
              <CommandList className="max-h-72 overflow-y-auto pointer-events-auto">
                <CommandEmpty>No addresses found.</CommandEmpty>
                <CommandGroup>
                  {addresses.map((address) => (
                    <CommandItem
                      key={address.id}
                      value={getAddressDisplayText(address)}
                      onSelect={() => handleAddressSelect(address)}
                      className="cursor-pointer hover:bg-gray-100 py-3"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedAddress?.id === address.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col flex-1">
                        <span className="font-medium flex items-center gap-2">
                          {address.address}, {address.postcode}
                          {address.is_default && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                              Default
                            </span>
                          )}
                        </span>
                        {address.deatails && (
                          <span className="text-sm text-gray-500">
                            {address.deatails}
                          </span>
                        )}
                        {address.access && (
                          <span className="text-xs text-gray-400 mt-1">
                            Access: {address.access}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        <CreateAddressDialog 
          customerId={customerId}
          onAddressCreated={handleAddressCreated}
        >
          <Button type="button" variant="outline" size="icon" className="h-16 w-16 rounded-2xl border-2 border-gray-200 hover:bg-gray-50" disabled={!customerId}>
            <Plus className="h-5 w-5" />
          </Button>
        </CreateAddressDialog>
      </div>
    </div>
  );
};

export default AddressSelector;
