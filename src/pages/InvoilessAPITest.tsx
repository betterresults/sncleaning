import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import AdminGuard from '@/components/AdminGuard';

interface Customer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

const InvoilessAPITest = () => {
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email')
      .order('first_name');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch customers',
        variant: 'destructive',
      });
      return;
    }

    setCustomers(data || []);
  };

  const handleGetCustomer = async () => {
    if (!selectedCustomerId) {
      toast({
        title: 'Error',
        description: 'Please select a customer',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setApiResponse(null);

    try {
      const apiKey = 'invls_ak_t8T4u8dBDChqn2NudkHKzAi-Yqvk2wj6wPf31VKNTt-9XDjfWfwrMbSf6a6RXpSQ';
      
      const response = await fetch('https://api.invoiless.com/v1/customers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      setApiResponse({
        status: response.status,
        statusText: response.statusText,
        data: data,
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Customer data fetched successfully',
        });
      } else {
        toast({
          title: 'API Error',
          description: `Status ${response.status}: ${response.statusText}`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setApiResponse({
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const selectedCustomer = customers.find(c => c.id.toString() === selectedCustomerId);

  return (
    <AdminGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <UnifiedSidebar 
            navigationItems={adminNavigation}
            user={user}
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1">
            <UnifiedHeader 
              title="Invoiless API Test 🧪"
              user={user}
              userRole={userRole}
            />
            
            <main className="flex-1 p-4 space-y-4 max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Test Invoiless Customer API</CardTitle>
                  <CardDescription>
                    Select a customer from your database and test fetching their data from Invoiless
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Customer</label>
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.first_name} {customer.last_name} - {customer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCustomer && (
                    <div className="p-4 bg-muted rounded-lg space-y-1">
                      <p className="text-sm"><strong>Name:</strong> {selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                      <p className="text-sm"><strong>Email:</strong> {selectedCustomer.email}</p>
                    </div>
                  )}

                  <Button 
                    onClick={handleGetCustomer} 
                    disabled={loading || !selectedCustomerId}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      'Get Customer Info from Invoiless'
                    )}
                  </Button>
                </CardContent>
              </Card>

              {apiResponse && (
                <Card>
                  <CardHeader>
                    <CardTitle>API Response</CardTitle>
                    <CardDescription>
                      Status: {apiResponse.status || 'Error'} {apiResponse.statusText || ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 bg-muted rounded-lg overflow-auto text-xs">
                      {JSON.stringify(apiResponse, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
};

export default InvoilessAPITest;
