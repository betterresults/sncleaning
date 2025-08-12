import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Edit2, 
  Save, 
  X, 
  Mail, 
  Shield, 
  UserCheck, 
  Users,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: 'guest' | 'user' | 'admin';
  cleaner_id?: number;
  customer_id?: number;
}

interface ModernUsersTableProps {
  userType?: 'all' | 'admin' | 'cleaner' | 'customer';
}

const ModernUsersTable = ({ userType = 'all' }: ModernUsersTableProps) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [resetLoading, setResetLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      console.log('=== FETCHING USERS WITH ADMIN PRIVILEGES ===');
      console.log('User type filter:', userType);
      
      // Use admin edge function to bypass RLS
      const { data, error } = await supabase.functions.invoke('get-all-users-admin');
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      console.log('Users fetched from admin function:', data.users?.length || 0);
      console.log('All users data:', data.users);

      let processedUsers = data.users || [];

      // Filter by user type
      if (userType !== 'all') {
        console.log('Filtering by user type:', userType);
        processedUsers = processedUsers.filter(user => {
          const shouldInclude = (() => {
            switch (userType) {
              case 'admin':
                return user.role === 'admin';
              case 'cleaner':
                return user.role === 'user';
              case 'customer':
                return user.role === 'guest';
              default:
                return true;
            }
          })();
          
          console.log(`User ${user.email} (role: ${user.role}) - Include: ${shouldInclude}`);
          return shouldInclude;
        });
      }

      console.log('Final filtered users:', processedUsers);
      console.log('Count:', processedUsers.length);

      setUsers(processedUsers);
      setFilteredUsers(processedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.first_name?.toLowerCase().includes(term.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(term.toLowerCase()) ||
        user.email?.toLowerCase().includes(term.toLowerCase()) ||
        user.id.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const startEditing = (user: UserData) => {
    setEditingUser(user.id);
    setEditData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email,
      role: user.role || 'guest',
      password: ''
    });
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setEditData({});
    setShowPassword(false);
  };

  const updateUser = async (userId: string) => {
    try {
      setUpdating(true);
      
      const { data, error } = await supabase.functions.invoke('update-user-admin', {
        body: {
          userId: userId,
          updates: {
            first_name: editData.first_name,
            last_name: editData.last_name,
            email: editData.email,
            role: editData.role,
            password: editData.password
          }
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to update user');

      toast({
        title: 'Success',
        description: editData.password ? 'User details and password updated!' : 'User details updated!',
      });

      cancelEditing();
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
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
        title: "Password Reset Email Sent",
        description: `Reset link sent to ${email}`,
      });
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setResetLoading(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge variant="destructive" className="gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      case 'user':
        return (
          <Badge variant="default" className="gap-1 bg-primary">
            <UserCheck className="h-3 w-3" />
            Cleaner
          </Badge>
        );
      case 'guest':
        return (
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            Customer
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeTitle = () => {
    switch (userType) {
      case 'admin':
        return 'Admin Users';
      case 'cleaner':
        return 'Cleaner Users';
      case 'customer':
        return 'Customer Users';
      default:
        return 'All Users';
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [userType]);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [users]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{getTypeTitle()} ({filteredUsers.length})</span>
        </CardTitle>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading users...</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {editingUser === user.id ? (
                          <div className="flex gap-2">
                            <Input
                              placeholder="First Name"
                              value={editData.first_name}
                              onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                              className="w-24"
                            />
                            <Input
                              placeholder="Last Name"
                              value={editData.last_name}
                              onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                              className="w-24"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {user.id.substring(0, 8)}...
                            </div>
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {editingUser === user.id ? (
                          <div className="space-y-2">
                            <Input
                              type="email"
                              value={editData.email}
                              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                              className="w-48"
                            />
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="New password (optional)"
                                value={editData.password}
                                onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                                className="w-48 pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="font-mono text-sm">{user.email}</div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {editingUser === user.id ? (
                          <Select 
                            value={editData.role} 
                            onValueChange={(value) => setEditData({ ...editData, role: value })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="guest">Customer</SelectItem>
                              <SelectItem value="user">Cleaner</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          getRoleBadge(user.role || 'guest')
                        )}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        {editingUser === user.id ? (
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              onClick={() => updateUser(user.id)}
                              disabled={updating}
                            >
                              {updating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditing}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditing(user)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePasswordReset(user.email, user.id)}
                              disabled={resetLoading === user.id}
                            >
                              {resetLoading === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModernUsersTable;