import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';
import { User } from 'lucide-react';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

const AdminCustomerSelector = () => {
  const { toast } = useToast();
  const { selectedCustomerId, setSelectedCustomerId } = useAdminCustomer();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email')
        .order('first_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <p className="text-muted-foreground">Loading customers...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Admin View - Select Customer:</span>
          </div>
          <Select 
            value={selectedCustomerId?.toString() || ""} 
            onValueChange={(value) => setSelectedCustomerId(value ? parseInt(value) : null)}
          >
            <SelectTrigger className="w-80">
              <SelectValue placeholder="Choose a customer to view as..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {customer.first_name} {customer.last_name} ({customer.email})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminCustomerSelector;