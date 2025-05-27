
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Edit, Trash2 } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
  };
  role?: 'guest' | 'user' | 'admin';
}

interface CustomerData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  postcode: string;
  client_status: string;
  full_name: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [showCreateCustomerForm, setShowCreateCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<number | null>(null);
  const [editCustomerData, setEditCustomerData] = useState<Partial<CustomerData>>({});
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user' as 'user' | 'admin'
  });
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postcode: ''
  });
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users for UserManagement...');
      
      // Get users from profiles table with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role');
      
      console.log('Profiles data:', profiles, 'Error:', profilesError);
      
      if (profilesError) throw profilesError;

      // Get additional roles from user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      console.log('User roles data:', userRoles, 'Error:', rolesError);
      
      if (rolesError) {
        console.warn('Could not fetch user_roles:', rolesError);
      }

      // Combine the data
      const usersWithRoles = profiles?.map(profile => {
        // First check user_roles table, then fall back to profiles table
        const userRole = userRoles?.find(role => role.user_id === profile.id);
        const finalRole = userRole?.role || profile.role || 'guest';
        
        console.log(`User ${profile.email}: profile role = ${profile.role}, user_roles = ${userRole?.role}, final = ${finalRole}`);
        
        return {
          id: profile.id,
          email: profile.email || '',
          user_metadata: {
            first_name: profile.first_name || '',
            last_name: profile.last_name || ''
          },
          role: finalRole as 'guest' | 'user' | 'admin'
        };
      }) || [];

      console.log('Final users with roles:', usersWithRoles);
      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const createUser = async () => {
    try {
      setCreating(true);
      
      // Call the Edge Function to create user with admin privileges
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUser.email,
          password: newUser.password,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to create user');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast({
        title: 'Success',
        description: 'User created successfully!',
      });

      setNewUser({ email: '', password: '', firstName: '', lastName: '', role: 'user' });
      setShowCreateUserForm(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
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
      setShowCreateCustomerForm(false);
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

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      console.log(`Updating user ${userId} role to ${newRole}`);
      
      // Ensure the role is one of the valid types
      const validRole = newRole as 'guest' | 'user' | 'admin';
      
      // First try to update user_roles table
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (existingRole) {
        // Update existing role in user_roles
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ role: validRole })
          .eq('user_id', userId);
        
        if (updateError) throw updateError;
      } else {
        // Insert new role in user_roles
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: validRole });
        
        if (insertError) throw insertError;
      }
      
      // Also update profiles table for consistency
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: validRole })
        .eq('id', userId);
      
      if (profileError) {
        console.warn('Could not update profile role:', profileError);
      }

      toast({
        title: 'Success',
        description: 'User role updated successfully!',
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'guest':
        return 'Customer';
      case 'user':
        return 'Cleaner';
      case 'admin':
        return 'Administrator';
      default:
        return 'Customer';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'user':
        return 'bg-yellow-100 text-yellow-800';
      case 'guest':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchUsers(), fetchCustomers()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User & Customer Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">System Users</h3>
              <Button 
                onClick={() => setShowCreateUserForm(!showCreateUserForm)}
                variant={showCreateUserForm ? "outline" : "default"}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {showCreateUserForm ? 'Cancel' : 'Create New User'}
              </Button>
            </div>

            {/* Create User Form */}
            {showCreateUserForm && (
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold mb-4">Create New System User</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="userFirstName">First Name</Label>
                    <Input
                      id="userFirstName"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="userLastName">Last Name</Label>
                    <Input
                      id="userLastName"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="userEmail">Email</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="userPassword">Password</Label>
                    <Input
                      id="userPassword"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <Label htmlFor="userRole">Role</Label>
                  <select
                    id="userRole"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'user' | 'admin' })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="user">Cleaner</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <Button onClick={createUser} disabled={creating}>
                  {creating ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            )}

            {/* Users List */}
            <div>
              {loading ? (
                <div className="text-center py-4">Loading users...</div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {user.user_metadata.first_name} {user.user_metadata.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">ID: {user.id}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role || 'guest')}`}>
                          {getRoleDisplayName(user.role || 'guest')}
                        </span>
                        <select
                          value={user.role || 'guest'}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="guest">Customer</option>
                          <option value="user">Cleaner</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Customers</h3>
              <Button 
                onClick={() => setShowCreateCustomerForm(!showCreateCustomerForm)}
                variant={showCreateCustomerForm ? "outline" : "default"}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {showCreateCustomerForm ? 'Cancel' : 'Create New Customer'}
              </Button>
            </div>

            {/* Create Customer Form */}
            {showCreateCustomerForm && (
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold mb-4">Create New Customer</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="customerFirstName">First Name</Label>
                    <Input
                      id="customerFirstName"
                      value={newCustomer.firstName}
                      onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerLastName">Last Name</Label>
                    <Input
                      id="customerLastName"
                      value={newCustomer.lastName}
                      onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone</Label>
                    <Input
                      id="customerPhone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="customerAddress">Address</Label>
                    <Input
                      id="customerAddress"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPostcode">Postcode</Label>
                    <Input
                      id="customerPostcode"
                      value={newCustomer.postcode}
                      onChange={(e) => setNewCustomer({ ...newCustomer, postcode: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={createCustomer} disabled={creating}>
                  {creating ? 'Creating...' : 'Create Customer'}
                </Button>
              </div>
            )}

            {/* Customers List */}
            <div>
              {loading ? (
                <div className="text-center py-4">Loading customers...</div>
              ) : (
                <div className="space-y-3">
                  {customers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                      {editingCustomer === customer.id ? (
                        <div className="flex-1 grid grid-cols-3 gap-4">
                          <div>
                            <Input
                              placeholder="First Name"
                              value={editCustomerData.first_name || ''}
                              onChange={(e) => setEditCustomerData({ ...editCustomerData, first_name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Input
                              placeholder="Last Name"
                              value={editCustomerData.last_name || ''}
                              onChange={(e) => setEditCustomerData({ ...editCustomerData, last_name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Input
                              placeholder="Email"
                              value={editCustomerData.email || ''}
                              onChange={(e) => setEditCustomerData({ ...editCustomerData, email: e.target.value })}
                            />
                          </div>
                          <div>
                            <Input
                              placeholder="Phone"
                              value={editCustomerData.phone || ''}
                              onChange={(e) => setEditCustomerData({ ...editCustomerData, phone: e.target.value })}
                            />
                          </div>
                          <div>
                            <Input
                              placeholder="Address"
                              value={editCustomerData.address || ''}
                              onChange={(e) => setEditCustomerData({ ...editCustomerData, address: e.target.value })}
                            />
                          </div>
                          <div>
                            <Input
                              placeholder="Postcode"
                              value={editCustomerData.postcode || ''}
                              onChange={(e) => setEditCustomerData({ ...editCustomerData, postcode: e.target.value })}
                            />
                          </div>
                          <div className="col-span-3 flex gap-2">
                            <Button 
                              onClick={() => updateCustomer(customer.id)}
                              size="sm"
                            >
                              Save
                            </Button>
                            <Button 
                              onClick={cancelEditing}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <div className="font-medium">
                              {customer.first_name} {customer.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                            <div className="text-sm text-gray-500">{customer.phone}</div>
                            <div className="text-xs text-gray-400">
                              {customer.address}, {customer.postcode}
                            </div>
                            <div className="text-xs text-gray-400">ID: {customer.id}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              customer.client_status === 'Current' ? 'bg-green-100 text-green-800' : 
                              customer.client_status === 'New' ? 'bg-blue-100 text-blue-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {customer.client_status}
                            </span>
                            <Button
                              onClick={() => startEditingCustomer(customer)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => deleteCustomer(customer.id)}
                              variant="destructive"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
