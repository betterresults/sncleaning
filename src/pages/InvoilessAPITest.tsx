import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  
  // Create customer form state
  const [createLoading, setCreateLoading] = useState(false);
  const [createResponse, setCreateResponse] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    address: '',
  });

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
      const { data, error } = await supabase.functions.invoke('invoiless-get-customer', {
        body: { email: selectedCustomer?.email }
      });

      if (error) {
        setApiResponse({
          status: 'error',
          error: error.message,
          details: error
        });
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setApiResponse({
        status: 200,
        statusText: 'OK',
        data: data,
      });

      toast({
        title: 'Success',
        description: 'Customer data fetched successfully',
      });

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

  const handleCreateCustomer = async () => {
    // Validate that either company OR (firstName AND lastName) is provided
    if (!formData.company && (!formData.firstName || !formData.lastName)) {
      toast({
        title: 'Validation Error',
        description: 'Please provide either Company OR both First Name and Last Name',
        variant: 'destructive',
      });
      return;
    }

    setCreateLoading(true);
    setCreateResponse(null);

    try {
      const billTo: any = {};
      
      if (formData.firstName) billTo.firstName = formData.firstName;
      if (formData.lastName) billTo.lastName = formData.lastName;
      if (formData.company) billTo.company = formData.company;
      if (formData.email) billTo.email = formData.email;
      if (formData.phone) billTo.phone = formData.phone;
      if (formData.address) billTo.address = formData.address;

      const { data, error } = await supabase.functions.invoke('invoiless-create-customer', {
        body: { billTo }
      });

      if (error) {
        setCreateResponse({
          status: 'error',
          error: error.message,
          details: error
        });
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setCreateResponse({
        status: 200,
        statusText: 'OK',
        data: data,
      });

      toast({
        title: 'Success',
        description: 'Customer created successfully',
      });

      // Clear form
      setFormData({
        firstName: '',
        lastName: '',
        company: '',
        email: '',
        phone: '',
        address: '',
      });

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setCreateResponse({
        error: error.message,
      });
    } finally {
      setCreateLoading(false);
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
              <Tabs defaultValue="get-customer" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="get-customer">Get Customer</TabsTrigger>
                  <TabsTrigger value="create-customer">Create Customer</TabsTrigger>
                </TabsList>

                <TabsContent value="get-customer" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Test Get Customer API</CardTitle>
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
                </TabsContent>

                <TabsContent value="create-customer" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Create Customer in Invoiless</CardTitle>
                      <CardDescription>
                        Fill in customer information. Either Company OR (First Name AND Last Name) is required.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            placeholder="John"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          placeholder="Acme Corp"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="customer@example.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="202-555-0113"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="4320 Ryder Avenue"
                        />
                      </div>

                      <Button 
                        onClick={handleCreateCustomer} 
                        disabled={createLoading}
                        className="w-full"
                      >
                        {createLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Customer'
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {createResponse && (
                    <Card>
                      <CardHeader>
                        <CardTitle>API Response</CardTitle>
                        <CardDescription>
                          Status: {createResponse.status || 'Error'} {createResponse.statusText || ''}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <pre className="p-4 bg-muted rounded-lg overflow-auto text-xs">
                          {JSON.stringify(createResponse, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
};

export default InvoilessAPITest;
