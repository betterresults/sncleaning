import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BulkLinkRecordsUtility from '@/components/admin/BulkLinkRecordsUtility';
import BulkAccountCreationUtility from '@/components/admin/BulkAccountCreationUtility';
import { DeleteUserByEmail } from '@/components/admin/DeleteUserByEmail';
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
import { Label } from '@/components/ui/label';
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
  Loader2,
  CalendarPlus,
  MapPin,
  Plus,
  Trash2,
  UserPlus,
  CreditCard
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';
import CreateBookingDialogWithCustomer from '@/components/booking/CreateBookingDialogWithCustomer';
import CustomerAddressDialog from '@/components/customer/CustomerAddressDialog';
import CustomerPaymentDialog from '@/components/customer/CustomerPaymentDialog';
import PaymentMethodStatusIcon from '@/components/customer/PaymentMethodStatusBadge';
import { useCustomerPaymentMethods } from '@/hooks/useCustomerPaymentMethods';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CollectPaymentMethodDialog } from '@/components/payments/CollectPaymentMethodDialog';

interface UserData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: 'guest' | 'user' | 'admin' | 'customer';
  cleaner_id?: number;
  customer_id?: number;
  // Extended for customers view
  type?: 'auth_user' | 'business_customer';
  business_id?: number;
  phone?: string;
  address?: string;
  postcode?: string;
  client_status?: string;
  client_type?: string | null;
  addressCount?: number;
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
  
  // Customer filters
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>('all');
  const [addressFilter, setAddressFilter] = useState<'all' | 'with-addresses' | 'no-addresses'>('all');
  
  // Add new user state
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: userType === 'customer' ? 'guest' : userType === 'cleaner' ? 'user' : 'guest'
  });
  const [addingUser, setAddingUser] = useState(false);
  
  // Delete user state
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [collectPaymentDialogUser, setCollectPaymentDialogUser] = useState<UserData | null>(null);
  
  // Payment management state
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<UserData | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Get customer IDs for payment data fetching
  const customerIds = users
    .filter(user => user.type === 'business_customer' && user.business_id)
    .map(user => user.business_id!);
    
  console.log('=== PAYMENT DEBUG ===');
  console.log('Customer IDs for payment data:', customerIds);
  console.log('Users with business_customer type:', users.filter(user => user.type === 'business_customer').length);
    
  const { paymentData, loading: paymentLoading, refetch: refetchPaymentData } = useCustomerPaymentMethods(customerIds);
  
  console.log('Payment data received:', paymentData);
  console.log('Payment loading:', paymentLoading);

  // Selection and bulk edit state for Customers view
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<number[]>([]);
  const [bulkType, setBulkType] = useState<string | 'no-change' | 'empty'>('no-change');
  const [bulkStatus, setBulkStatus] = useState<string | 'no-change'>('no-change');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      console.log('=== FETCHING DATA ===');
      console.log('User type filter:', userType);
      
      // Use admin edge function to bypass RLS
      const { data, error } = await supabase.functions.invoke('get-all-users-admin');
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      console.log('Auth users fetched:', data.authUsers?.length || 0);
      console.log('Business customers fetched:', data.businessCustomers?.length || 0);

      let processedUsers = [];

      // Filter and combine data based on user type
      if (userType === 'customer') {
        // For customers: ONLY show customers from the customers table (business customers)
        const businessCustomers = (data.businessCustomers || []).map(customer => {
          console.log('Processing business customer:', customer.id, customer.first_name, customer.last_name, 'type will be set to: business_customer');
          return {
            ...customer,
            type: 'business_customer',
            business_id: customer.id,
            role: 'customer' // Display as 'customer' for clarity
          };
        });
        processedUsers = businessCustomers;
        
        // Get address counts for customers
        const customerIds = businessCustomers.map(customer => customer.id).filter(Boolean);
        let addressCounts: { [key: number]: number } = {};
        
        if (customerIds.length > 0) {
          const { data: addressData } = await supabase
            .from('addresses')
            .select('customer_id')
            .in('customer_id', customerIds);
          
          if (addressData) {
            addressCounts = addressData.reduce((acc: { [key: number]: number }, addr: any) => {
              acc[addr.customer_id] = (acc[addr.customer_id] || 0) + 1;
              return acc;
            }, {});
          }
        }

        // Add address counts to processed users and ensure type is set
        processedUsers = processedUsers.map(user => {
          console.log('Final user processing:', user.id, user.first_name, 'type:', user.type, 'addressCount will be:', user.type === 'business_customer' || !user.type ? (addressCounts[user.id] || 0) : 0);
          return {
            ...user,
            type: user.type || 'business_customer', // Ensure all customers have correct type
            addressCount: user.type === 'business_customer' || !user.type ? (addressCounts[user.id] || 0) : 0
          };
        });
        
      } else if (userType === 'all') {
        // For all: show everything
        const allAuthUsers = (data.authUsers || []).map(user => ({
          ...user,
          type: 'auth_user'
        }));
        const allBusinessCustomers = (data.businessCustomers || []).map(customer => ({
          ...customer,
          type: 'business_customer',
          business_id: customer.id,
          role: 'customer'
        }));
        processedUsers = [...allAuthUsers, ...allBusinessCustomers];
        
      } else {
        // For admins/cleaners: only show auth users with matching roles
        processedUsers = (data.authUsers || []).filter(user => {
          switch (userType) {
            case 'admin':
              return user.role === 'admin';
            case 'cleaner':
              return user.role === 'user';
            default:
              return true;
          }
        });
      }

      console.log('Final processed users for', userType, ':', processedUsers);
      console.log('Count:', processedUsers.length);

      setUsers(processedUsers);
      setFilteredUsers(processedUsers);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch data: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = () => {
    // Refresh the data to get updated address counts
    fetchUsers();
  };

  // Get unique customer types from actual data
  const getUniqueCustomerTypes = () => {
    const types = new Set<string>();
    users.forEach(user => {
      if (user.type === 'business_customer') {
        if (user.client_type) {
          types.add(user.client_type);
        } else {
          types.add('empty');
        }
      }
    });
    return Array.from(types);
  };

  const applyFilters = (usersData: UserData[], searchTerm: string) => {
    let filtered = usersData;

    // Apply search filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(user => 
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply customer-specific filters only for customer view
    if (userType === 'customer') {
      // Customer type filter
      if (customerTypeFilter !== 'all') {
        filtered = filtered.filter(user => {
          if (user.type === 'business_customer') {
            if (customerTypeFilter === 'empty') {
              return !user.client_type;
            }
            return user.client_type === customerTypeFilter;
          }
          return false;
        });
      }

      // Address filter
      if (addressFilter === 'with-addresses') {
        filtered = filtered.filter(user => (user.addressCount || 0) > 0);
      } else if (addressFilter === 'no-addresses') {
        filtered = filtered.filter(user => (user.addressCount || 0) === 0);
      }
    }

    return filtered;
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setFilteredUsers(applyFilters(users, term));
  };

  const handleFilterChange = () => {
    setFilteredUsers(applyFilters(users, searchTerm));
  };

  const handleAddUser = async () => {
    if (!newUserData.first_name || !newUserData.last_name || !newUserData.email || !newUserData.password) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setAddingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUserData.email,
          password: newUserData.password,
          firstName: newUserData.first_name,
          lastName: newUserData.last_name,
          role: newUserData.role
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User created successfully'
      });

      setShowAddUserDialog(false);
      setNewUserData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: userType === 'customer' ? 'guest' : userType === 'cleaner' ? 'user' : 'guest'
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive'
      });
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeletingUser(true);
    try {
      const { error } = await supabase.functions.invoke('delete-user-account', {
        body: {
          user_id: userToDelete.id
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User deleted successfully'
      });

      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive'
      });
    } finally {
      setDeletingUser(false);
    }
  };

  const startEditing = (user: UserData) => {
    setEditingUser(user.id);
    setEditData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email,
      role: user.role || 'guest',
      password: '',
      client_type: user.client_type ?? null,
      client_status: user.client_status || ''
    });
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setEditData({});
    setShowPassword(false);
  };

  const updateUser = async (userId: string) => {
    console.log('=== UPDATE USER DEBUG ===');
    console.log('User ID:', userId);
    console.log('User Type:', userType);
    console.log('Edit Data:', editData);
    
    try {
      setUpdating(true);

      if (userType === 'customer') {
        const row = users.find(u => u.id === userId);
        console.log('Found user row:', row);
        
        if (row?.type === 'business_customer' && row.business_id) {
          // Update customer table for business customers
          const customerUpdates: any = {};
          if ('client_type' in editData) {
            customerUpdates.clent_type = editData.client_type === 'empty' ? null : editData.client_type;
          }
          if ('client_status' in editData) {
            customerUpdates.client_status = editData.client_status;
          }
          if ('first_name' in editData) {
            customerUpdates.first_name = editData.first_name;
          }
          if ('last_name' in editData) {
            customerUpdates.last_name = editData.last_name;
          }
          if ('email' in editData) {
            customerUpdates.email = editData.email;
          }
          
          console.log('Customer updates:', customerUpdates);
          
          const { error: custErr } = await supabase
            .from('customers')
            .update(customerUpdates)
            .eq('id', row.business_id);
          if (custErr) {
            console.error('Customer update error:', custErr);
            throw custErr;
          }
          console.log('Customer table updated successfully');
        }
        
        // Always update auth user for customers (both business and regular)
        // Fall through to the auth user update below
      }
      
      // Default path: update auth user via admin function
      console.log('Calling update-user-admin with:', {
        userId: userId,
        updates: {
          first_name: editData.first_name,
          last_name: editData.last_name,
          email: editData.email,
          role: editData.role,
          password: editData.password
        }
      });
      
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

      console.log('update-user-admin response:', { data, error });

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
      case 'customer':
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

  const getCustomerTypeBadge = (user: UserData) => {
    const t = user.client_type?.toLowerCase();
    if (t === 'business') {
      return <Badge variant="secondary" className="gap-1">Business</Badge>;
    }
    if (t === 'client') {
      return <Badge variant="default" className="gap-1">Client</Badge>;
    }
    return <Badge variant="outline">—</Badge>;
  };

  const getTypeTitle = () => {
    switch (userType) {
      case 'admin':
        return 'Admin Users';
      case 'cleaner':
        return 'Cleaner Users';
      case 'customer':
        return 'Customers';
      default:
        return 'All Users';
    }
  };

  const getCustomerStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">—</Badge>;
    const s = status.toLowerCase();
    if (s === 'current') return <Badge variant="default">Current</Badge>;
    if (s === 'new') return <Badge variant="secondary">New</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const isSelected = (id: string) => selectedIds.has(id);

  const toggleSelect = (user: UserData) => {
    if (user.type !== 'business_customer' || !user.business_id) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(user.id)) next.delete(user.id); else next.add(user.id);
      return next;
    });
    setSelectedBusinessIds(prev => {
      const exists = prev.includes(user.business_id!);
      if (exists) return prev.filter(v => v !== user.business_id);
      return [...prev, user.business_id!];
    });
  };

  const toggleSelectAll = () => {
    const allBusiness = filteredUsers.filter(u => u.type === 'business_customer' && u.business_id);
    const allIds = allBusiness.map(u => u.id);
    const allBizIds = allBusiness.map(u => u.business_id!) as number[];
    const allSelected = allIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
      setSelectedBusinessIds([]);
    } else {
      setSelectedIds(new Set(allIds));
      setSelectedBusinessIds(allBizIds);
    }
  };

  const applyBulkUpdate = async () => {
    try {
      if (selectedBusinessIds.length === 0) return;
      const updates: any = {};
      if (bulkType !== 'no-change') updates.clent_type = bulkType === 'empty' ? null : bulkType;
      if (Object.keys(updates).length === 0) {
        toast({ title: 'Nothing to update', description: 'Choose Type to apply', variant: 'destructive' });
        return;
      }
      setBulkUpdating(true);
      const { error } = await supabase.from('customers').update(updates).in('id', selectedBusinessIds);
      if (error) throw error;
      toast({ title: 'Updated', description: `Updated ${selectedBusinessIds.length} customers` });
      setSelectedIds(new Set());
      setSelectedBusinessIds([]);
      setBulkType('no-change');
      fetchUsers();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Bulk update failed', variant: 'destructive' });
    } finally {
      setBulkUpdating(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [userType]);

  useEffect(() => {
    handleFilterChange();
  }, [users, customerTypeFilter, addressFilter]);

  const isCustomerView = userType === 'customer';
  const showBulkEdit = isCustomerView && selectedBusinessIds.length > 0;

  return (
    <div className="space-y-6">
      {userType === 'all' && (
        <>
          <BulkAccountCreationUtility />
          <BulkLinkRecordsUtility />
          <DeleteUserByEmail />
        </>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{getTypeTitle()} ({filteredUsers.length})</span>
            <div className="flex gap-2">
              <Button onClick={() => setShowAddUserDialog(true)} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add {userType === 'customer' ? 'Customer' : userType === 'cleaner' ? 'Cleaner' : userType === 'admin' ? 'Admin' : 'User'}
              </Button>
            </div>
          </CardTitle>
        
        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users by name, email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Customer Filters */}
          {userType === 'customer' && (
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Customer Type</label>
                <Select value={customerTypeFilter} onValueChange={(value: string) => setCustomerTypeFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {getUniqueCustomerTypes().map(type => (
                      <SelectItem key={type} value={type}>
                        {type === 'empty' ? '—' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Addresses</label>
                <Select value={addressFilter} onValueChange={(value: any) => setAddressFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="with-addresses">With Addresses</SelectItem>
                    <SelectItem value="no-addresses">No Address</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Edit Controls for Customers */}
        {showBulkEdit && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">{selectedBusinessIds.length} selected:</span>
            <Select value={bulkType} onValueChange={setBulkType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-change">No change</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="empty">Clear</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={applyBulkUpdate} disabled={bulkUpdating} size="sm">
              {bulkUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setSelectedIds(new Set()); setSelectedBusinessIds([]); }}>
              Clear
            </Button>
          </div>
        )}
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
                   {isCustomerView && (
                     <TableHead className="w-12">
                       <Checkbox
                         checked={filteredUsers.filter(u => u.type === 'business_customer').length > 0 && 
                                  filteredUsers.filter(u => u.type === 'business_customer').every(u => isSelected(u.id))}
                         onCheckedChange={toggleSelectAll}
                       />
                     </TableHead>
                   )}
                   <TableHead>Customer</TableHead>
                   <TableHead>Email</TableHead>
                   {isCustomerView ? (
                     <>
                       <TableHead>Type</TableHead>
                       <TableHead>Payment Methods</TableHead>
                       <TableHead>Addresses</TableHead>
                     </>
                   ) : (
                     <TableHead>Role</TableHead>
                   )}
                   <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                   {filteredUsers.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={isCustomerView ? 6 : 4} className="text-center py-8 text-muted-foreground">
                         {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                       </TableCell>
                     </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      {isCustomerView && (
                        <TableCell>
                          {user.type === 'business_customer' ? (
                            <Checkbox
                              checked={isSelected(user.id)}
                              onCheckedChange={() => toggleSelect(user)}
                            />
                          ) : null}
                        </TableCell>
                      )}
                      
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
                          <div className="font-medium">
                            {user.first_name} {user.last_name}
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
                            {!isCustomerView && (
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
                            )}
                          </div>
                        ) : (
                          <div className="font-mono text-sm">{user.email}</div>
                        )}
                      </TableCell>
                      
                       {isCustomerView ? (
                         <>
                           <TableCell>
                             {editingUser === user.id && user.type === 'business_customer' ? (
                               <Select 
                                 value={editData.client_type ?? 'empty'} 
                                 onValueChange={(value) => setEditData({ ...editData, client_type: value === 'empty' ? null : value })}
                               >
                                 <SelectTrigger className="w-32">
                                   <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="empty">—</SelectItem>
                                   <SelectItem value="client">Client</SelectItem>
                                   <SelectItem value="business">Business</SelectItem>
                                 </SelectContent>
                               </Select>
                             ) : (
                               getCustomerTypeBadge(user)
                             )}
                           </TableCell>
                            <TableCell>
                              {user.type === 'business_customer' && user.business_id ? (
                                <PaymentMethodStatusIcon
                                  paymentMethodCount={paymentData[user.business_id]?.payment_method_count || 0}
                                  hasStripeAccount={paymentData[user.business_id]?.has_stripe_account || false}
                                  onClick={() => {
                                    setSelectedCustomerForPayment(user);
                                    setShowPaymentDialog(true);
                                  }}
                                />
                              ) : (
                                <span className="text-sm text-muted-foreground">–</span>
                              )}
                            </TableCell>
                           <TableCell>
                             {user.type === 'business_customer' ? (
                               <CustomerAddressDialog
                                 customerId={Number(user.business_id || user.id)}
                                 addressCount={user.addressCount || 0}
                                 onAddressChange={handleAddressChange}
                               >
                                 <Button variant="outline" size="sm">
                                   <MapPin className="h-4 w-4 mr-2" />
                                   {user.addressCount || 0}
                                 </Button>
                               </CustomerAddressDialog>
                             ) : (
                               <span className="text-sm text-muted-foreground">–</span>
                             )}
                           </TableCell>
                         </>
                      ) : (
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
                      )}
                      
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
                              onClick={() => {
                                console.log('Edit button clicked for user:', user.id, user.first_name, user.last_name, 'type:', user.type);
                                startEditing(user);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {isCustomerView && (user.type === 'business_customer' || !user.type) && (
                              <CreateBookingDialogWithCustomer customer={{
                                id: Number(user.business_id || user.id),
                                first_name: user.first_name || '',
                                last_name: user.last_name || '',
                                email: user.email || '',
                                phone: user.phone || ''
                              }}>
                                <Button size="sm" variant="outline" onClick={() => console.log('Add booking clicked for:', user.first_name, user.last_name)}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </CreateBookingDialogWithCustomer>
                            )}
                            {isCustomerView && (user.type === 'business_customer' || !user.type) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  console.log('Collect payment clicked for:', user.first_name, user.last_name, 'user object:', user);
                                  setCollectPaymentDialogUser(user);
                                }}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                            {!isCustomerView && (
                              <>
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
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setUserToDelete(user)}
                                  className="hover:border-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {isCustomerView && (user.type === 'business_customer' || !user.type) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  console.log('Delete button clicked for:', user.first_name, user.last_name, 'type:', user.type);
                                  setUserToDelete(user);
                                }}
                                className="hover:border-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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
      
      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {userType === 'customer' ? 'Customer' : userType === 'cleaner' ? 'Cleaner' : userType === 'admin' ? 'Admin' : 'User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={newUserData.first_name}
                  onChange={(e) => setNewUserData({...newUserData, first_name: e.target.value})}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={newUserData.last_name}
                  onChange={(e) => setNewUserData({...newUserData, last_name: e.target.value})}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                placeholder="Enter password"
              />
            </div>
            {userType === 'all' && (
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newUserData.role} onValueChange={(value) => setNewUserData({...newUserData, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guest">Customer</SelectItem>
                    <SelectItem value="user">Cleaner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>Cancel</Button>
              <Button onClick={handleAddUser} disabled={addingUser}>
                {addingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add {userType === 'customer' ? 'Customer' : userType === 'cleaner' ? 'Cleaner' : userType === 'admin' ? 'Admin' : 'User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.first_name} {userToDelete?.last_name}? This action cannot be undone and will permanently remove the user account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deletingUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Customer Payment Dialog */}
      {selectedCustomerForPayment && (
        <CustomerPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          customerId={Number(selectedCustomerForPayment.business_id || selectedCustomerForPayment.id)}
          customerName={`${selectedCustomerForPayment.first_name} ${selectedCustomerForPayment.last_name}`}
          customerEmail={selectedCustomerForPayment.email}
          onPaymentMethodsChange={() => {
            refetchPaymentData();
            fetchUsers();
          }}
        />
      )}

      {/* Collect Payment Method Dialog */}
      {collectPaymentDialogUser && (
        <CollectPaymentMethodDialog
          open={!!collectPaymentDialogUser}
          onOpenChange={(open) => !open && setCollectPaymentDialogUser(null)}
          customer={{
            id: collectPaymentDialogUser.business_id || parseInt(collectPaymentDialogUser.id),
            first_name: collectPaymentDialogUser.first_name || '',
            last_name: collectPaymentDialogUser.last_name || '',
            email: collectPaymentDialogUser.email
          }}
        />
      )}
      </Card>
    </div>
  );
};

export default ModernUsersTable;