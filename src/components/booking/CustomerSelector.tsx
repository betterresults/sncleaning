
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import CreateCustomerDialog from './CreateCustomerDialog';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface CustomerSelectorProps {
  onCustomerSelect: (customer: Customer | null) => void;
}

const CustomerSelector = ({ onCustomerSelect }: CustomerSelectorProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [loading, setLoading] = useState(true);

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

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    
    if (customerId === 'new') {
      onCustomerSelect(null);
      return;
    }

    const customer = customers.find(c => c.id.toString() === customerId);
    if (customer) {
      onCustomerSelect(customer);
    }
  };

  const handleCustomerCreated = (newCustomer: Customer) => {
    setCustomers(prev => [...prev, newCustomer]);
    setSelectedCustomerId(newCustomer.id.toString());
    onCustomerSelect(newCustomer);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="customerSelect">Select Customer</Label>
        <div className="flex gap-2">
          <Select value={selectedCustomerId} onValueChange={handleCustomerSelect}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Choose an existing customer or create new" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">+ Create New Customer</SelectItem>
              {loading ? (
                <SelectItem value="loading" disabled>Loading customers...</SelectItem>
              ) : customers.length === 0 ? (
                <SelectItem value="no-customers" disabled>No customers found</SelectItem>
              ) : (
                customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.first_name} {customer.last_name} - {customer.email}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
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
