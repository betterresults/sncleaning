
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
  };
  role?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user'
  });
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get users from profiles table with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name');
      
      if (profilesError) throw profilesError;

      // Get roles for each user
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      // Combine the data
      const usersWithRoles = profiles?.map(profile => {
        const userRole = userRoles?.find(role => role.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email || '',
          user_metadata: {
            first_name: profile.first_name || '',
            last_name: profile.last_name || ''
          },
          role: userRole?.role || 'guest'
        };
      }) || [];

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

  const createUser = async () => {
    try {
      setCreating(true);
      
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        user_metadata: {
          first_name: newUser.firstName,
          last_name: newUser.lastName,
          role: newUser.role
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User created successfully!',
      });

      setNewUser({ email: '', password: '', firstName: '', lastName: '', role: 'user' });
      setShowCreateForm(false);
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

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

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
    fetchUsers();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>User Management</CardTitle>
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant={showCreateForm ? "outline" : "default"}
          >
            {showCreateForm ? 'Cancel' : 'Create New User'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create User Form */}
        {showCreateForm && (
          <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-4">Create New User</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
            </div>
            <div className="mb-4">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
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
          <h3 className="font-semibold mb-4">All Users</h3>
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
      </CardContent>
    </Card>
  );
};

export default UserManagement;
