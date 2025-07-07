
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import CreateCustomerUserDialog from './CreateCustomerUserDialog';
import { Search, User } from 'lucide-react';

const CustomerAccountCreator = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
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


  const filteredCustomers = customers.filter(customer =>
    customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-4">Loading customers...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Create Customer Accounts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                <div>
                  <div className="font-medium">
                    {customer.first_name} {customer.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {customer.email}
                  </div>
                </div>
                <CreateCustomerUserDialog
                  customer={customer}
                  onSuccess={fetchCustomers}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerAccountCreator;
