import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import CreateUserForm from './CreateUserForm';

interface UserData {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
  };
  role?: 'guest' | 'user' | 'admin';
}

interface UsersSectionProps {
  key?: number;
}

const UsersSection = ({ key }: UsersSectionProps) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      console.log('=== FETCHING USERS DEBUG ===');
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      console.log('Profiles:', profiles?.length || 0, profiles);
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setFetchError(`Failed to fetch profiles: ${profilesError.message}`);
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        console.warn('No profiles found in the database');
      }
      
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      console.log('User roles data:', userRoles?.length || 0, userRoles);
      
      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      }

      const roleMap = new Map();
      if (userRoles) {
        userRoles.forEach(role => {
          roleMap.set(role.user_id, role.role);
        });
      }

      const processedUsers = profiles?.map(profile => {
        const userRole = roleMap.get(profile.user_id) || profile.role || 'guest';
        
        console.log(`Processing user ${profile.email}:`, {
          profile_role: profile.role,
          user_roles_role: roleMap.get(profile.user_id),
          final_role: userRole,
          user_id: profile.user_id
        });
        
        return {
          id: profile.user_id,
          email: profile.email || '',
          user_metadata: {
            first_name: profile.first_name || '',
            last_name: profile.last_name || ''
          },
          role: userRole as 'guest' | 'user' | 'admin'
        };
      }) || [];

      console.log('Final processed users:', processedUsers);
      
      if (processedUsers.length === 0) {
        setFetchError("No users found. This might indicate a database issue or that no users have been created yet.");
      }
      
      setUsers(processedUsers);

    } catch (error: any) {
      console.error('Error in fetchUsers:', error);
      setFetchError(`Failed to fetch users: ${error.message}`);
      toast({
        title: 'Error',
        description: 'Failed to fetch users: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      console.log(`Updating user ${userId} role to ${newRole}`);
      
      const validRole = newRole as 'guest' | 'user' | 'admin';
      
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (existingRole) {
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ role: validRole })
          .eq('user_id', userId);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: validRole });
        
        if (insertError) throw insertError;
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: validRole })
        .eq('user_id', userId);
      
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

  const handleCreateUserClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Create user button clicked');
    setShowCreateUserForm(!showCreateUserForm);
  };

  useEffect(() => {
    fetchUsers();
  }, [key]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">System Users ({users.length})</h3>
        <button
          onClick={handleCreateUserClick}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer ${
            showCreateUserForm 
              ? 'bg-slate-600 hover:bg-slate-700 text-white border border-slate-500' 
              : 'bg-blue-900 hover:bg-blue-800 text-white shadow-lg hover:shadow-xl'
          }`}
          type="button"
        >
          <UserPlus className="h-4 w-4" />
          {showCreateUserForm ? 'Cancel' : 'Create New User'}
        </button>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error fetching users</AlertTitle>
          <AlertDescription>
            {fetchError}
          </AlertDescription>
        </Alert>
      )}

      {showCreateUserForm && (
        <CreateUserForm onSuccess={() => {
          fetchUsers();
          setShowCreateUserForm(false);
        }} />
      )}

      <div>
        {loading ? (
          <div className="text-center py-4">Loading users...</div>
        ) : (
          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No users found</div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
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
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersSection;
