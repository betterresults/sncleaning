import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarProvider } from '@/components/ui/sidebar';
import CustomerSidebar from '@/components/CustomerSidebar';
import { useToast } from '@/hooks/use-toast';
import { Eye, User } from 'lucide-react';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

const CustomerPortalView = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
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
    return <div className="p-4">Loading customers...</div>;
  }

  if (!selectedCustomer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            View Customer Portal
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a customer to view their portal experience
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select onValueChange={(value) => {
              const customer = customers.find(c => c.id.toString() === value);
              if (customer) setSelectedCustomer(customer);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a customer..." />
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
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Viewing as: {selectedCustomer.first_name} {selectedCustomer.last_name}
            </CardTitle>
            <Button 
              variant="outline" 
              onClick={() => setSelectedCustomer(null)}
            >
              Switch Customer
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            This is what {selectedCustomer.first_name} sees in their customer portal
          </p>
        </CardHeader>
      </Card>

      {/* Customer Portal Preview */}
      <SidebarProvider>
        <div className="min-h-screen flex w-full border rounded-lg">
          <CustomerSidebar customerId={selectedCustomer.id} />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold">Customer Dashboard</h1>
                <p className="text-muted-foreground">
                  Welcome back, {selectedCustomer.first_name}!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Your upcoming cleaning appointments will appear here.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Your booking history will appear here.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button className="w-full" variant="outline">
                        Book New Service
                      </Button>
                      <Button className="w-full" variant="outline">
                        Manage Addresses
                      </Button>
                      <Button className="w-full" variant="outline">
                        Payment Methods
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default CustomerPortalView;