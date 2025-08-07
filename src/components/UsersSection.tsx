import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, RotateCcw, Mail, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
  refreshKey?: number;
  hideCreateButton?: boolean;
}

const UsersSection = ({ refreshKey, hideCreateButton }: UsersSectionProps) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState<string | null>(null);
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

  const handlePasswordReset = async (email: string, userId: string) => {
    setResetLoading(userId);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "🔐 Password Reset Email Sent",
        description: `Reset link sent to ${email}`,
      });
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast({
        title: "Error Sending Reset Email",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshKey]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h3 className="text-base sm:text-lg font-semibold">System Users ({users.length})</h3>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error fetching users</AlertTitle>
          <AlertDescription className="text-sm">
            {fetchError}
          </AlertDescription>
        </Alert>
      )}

      <div>
        {loading ? (
          <div className="text-center py-8">Loading users...</div>
        ) : (
          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No users found</div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="p-3 sm:p-4 border rounded-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">
                        {user.user_metadata.first_name} {user.user_metadata.last_name}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 break-all">{user.email}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium self-start ${getRoleColor(user.role || 'guest')}`}>
                        {getRoleDisplayName(user.role || 'guest')}
                      </span>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={user.role || 'guest'}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="text-xs sm:text-sm border rounded px-2 py-1 w-full sm:w-auto"
                        >
                          <option value="guest">Customer</option>
                          <option value="user">Cleaner</option>
                          <option value="admin">Administrator</option>
                        </select>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={resetLoading === user.id}>
                              {resetLoading === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                              <span className="hidden sm:inline ml-1">Reset Password</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Send Password Reset Email?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will send a password reset email to <strong>{user.email}</strong>.
                                They'll receive a secure link to reset their password.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handlePasswordReset(user.email, user.id)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Reset Email
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
