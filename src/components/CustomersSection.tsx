import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2 } from 'lucide-react';

interface CustomerData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string;
  postcode?: string;
  client_status: string;
  full_name: string;
}

interface CustomersSectionProps {
  hideCreateButton?: boolean;
  showCreateForm?: boolean;
  onCreateSuccess?: () => void;
}

const CustomersSection = ({ hideCreateButton, showCreateForm, onCreateSuccess }: CustomersSectionProps) => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<number | null>(null);
  const [editCustomerData, setEditCustomerData] = useState<Partial<CustomerData>>({});
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postcode: ''
  });
  const { toast } = useToast();

  const fetchCustomers = async () => {
    try {
      console.log('Fetching customers...');
      
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .order('id', { ascending: false });
      
      console.log('Customers data:', customers, 'Error:', error);
      
      if (error) throw error;

      setCustomers(customers || []);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch customers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async () => {
    try {
      setCreating(true);
      
      const { data, error } = await supabase
        .from('customers')
        .insert({
          first_name: newCustomer.firstName,
          last_name: newCustomer.lastName,
          email: newCustomer.email,
          phone: newCustomer.phone,
          address: newCustomer.address,
          postcode: newCustomer.postcode,
          client_status: 'New'
        })
        .select();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Customer created successfully!',
      });

      setNewCustomer({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        phone: '', 
        address: '', 
        postcode: '' 
      });
      fetchCustomers();
    } catch (error: any) {
      console.error('Error creating customer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create customer',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const updateCustomer = async (customerId: number) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update(editCustomerData)
        .eq('id', customerId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Customer updated successfully!',
      });

      setEditingCustomer(null);
      setEditCustomerData({});
      fetchCustomers();
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update customer',
        variant: 'destructive',
      });
    }
  };

  const deleteCustomer = async (customerId: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Customer deleted successfully!',
      });

      fetchCustomers();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete customer',
        variant: 'destructive',
      });
    }
  };

  const startEditingCustomer = (customer: CustomerData) => {
    setEditingCustomer(customer.id);
    setEditCustomerData({
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      postcode: customer.postcode,
      client_status: customer.client_status
    });
  };

  const cancelEditing = () => {
    setEditingCustomer(null);
    setEditCustomerData({});
  };

  const handleCreateCustomerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Create customer button clicked');
    
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h3 className="text-base sm:text-lg font-semibold">Customers</h3>
      </div>

      {/* Create Customer Form - Mobile Responsive */}
      {showCreateForm && (
        <div className="p-3 sm:p-4 border rounded-lg bg-gray-50">
          <h4 className="font-semibold mb-4 text-sm sm:text-base">Create New Customer</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div>
              <Label htmlFor="customerFirstName" className="text-sm">First Name</Label>
              <Input
                id="customerFirstName"
                value={newCustomer.firstName}
                onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="customerLastName" className="text-sm">Last Name</Label>
              <Input
                id="customerLastName"
                value={newCustomer.lastName}
                onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div>
              <Label htmlFor="customerEmail" className="text-sm">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="customerPhone" className="text-sm">Phone</Label>
              <Input
                id="customerPhone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div>
              <Label htmlFor="customerAddress" className="text-sm">Address</Label>
              <Input
                id="customerAddress"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="customerPostcode" className="text-sm">Postcode</Label>
              <Input
                id="customerPostcode"
                value={newCustomer.postcode}
                onChange={(e) => setNewCustomer({ ...newCustomer, postcode: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>
          <Button
            onClick={async () => {
              await createCustomer();
              if (onCreateSuccess) onCreateSuccess();
            }}
            disabled={creating}
            className="bg-blue-900 hover:bg-blue-800 text-white text-sm w-full sm:w-auto"
            size="sm"
          >
            {creating ? 'Creating...' : 'Create Customer'}
          </Button>
        </div>
      )}

      {/* Customers List - Mobile Responsive */}
      <div>
        {loading ? (
          <div className="text-center py-8">Loading customers...</div>
        ) : (
          <div className="space-y-3">
            {customers.map((customer) => (
              <div key={customer.id} className="p-3 sm:p-4 border rounded-lg">
                {editingCustomer === customer.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <Input
                          placeholder="First Name"
                          value={editCustomerData.first_name || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, first_name: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Last Name"
                          value={editCustomerData.last_name || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, last_name: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Email"
                          value={editCustomerData.email || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, email: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Phone"
                          value={editCustomerData.phone || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, phone: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Address"
                          value={editCustomerData.address || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, address: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Postcode"
                          value={editCustomerData.postcode || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, postcode: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        onClick={() => updateCustomer(customer.id)}
                        size="sm"
                        className="text-sm w-full sm:w-auto"
                      >
                        Save
                      </Button>
                      <Button 
                        onClick={cancelEditing}
                        variant="outline"
                        size="sm"
                        className="text-sm w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">
                        {customer.first_name} {customer.last_name}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 break-all">{customer.email}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{customer.phone}</div>
                      <div className="text-xs text-gray-400">
                        {customer.address}, {customer.postcode}
                      </div>
                      <div className="text-xs text-gray-400">ID: {customer.id}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2 lg:items-end">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium self-start ${
                        customer.client_status === 'Current' ? 'bg-green-100 text-green-800' : 
                        customer.client_status === 'New' ? 'bg-blue-100 text-blue-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.client_status}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => startEditingCustomer(customer)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-xs flex-1 sm:flex-none"
                        >
                          <Edit className="h-3 w-3" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                          onClick={() => deleteCustomer(customer.id)}
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-1 text-xs flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersSection;
