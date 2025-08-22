
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from 'lucide-react';

interface CreateUserFormProps {
  onSuccess: () => void;
}

const CreateUserForm = ({ onSuccess }: CreateUserFormProps) => {
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user' as 'user' | 'admin'
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setCreating(true);
      console.log('Creating user with data:', newUser);
      
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

      console.log('Create user response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to create user');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast({
        title: 'Success',
        description: 'User created successfully! If the email matches an existing cleaner or customer record, they will be automatically linked.',
      });

      setNewUser({ email: '', password: '', firstName: '', lastName: '', role: 'user' });
      
      // Wait a moment for the database to update, then refresh
      setTimeout(() => {
        onSuccess();
      }, 1000);
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Check if it's an "email already exists" error
      if (error.message && error.message.includes('already been registered')) {
        toast({
          title: 'Account Already Exists',
          description: `A user account with email ${newUser.email} already exists in the system. Please use a different email address or check if this user already has access.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create user',
          variant: 'destructive',
        });
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
      <h4 className="font-semibold">Create New System User</h4>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          If the email matches an existing cleaner or customer record, the user will be automatically linked to that record. This allows cleaners and customers to access their bookings when they log in.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="userFirstName">First Name</Label>
            <Input
              id="userFirstName"
              value={newUser.firstName}
              onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="userLastName">Last Name</Label>
            <Input
              id="userLastName"
              value={newUser.lastName}
              onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="userEmail">Email</Label>
            <Input
              id="userEmail"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="Enter email address"
              required
            />
          </div>
          <div>
            <Label htmlFor="userPassword">Password</Label>
            <Input
              id="userPassword"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              placeholder="Enter password"
              required
              minLength={6}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="userRole">Role</Label>
          <select
            id="userRole"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'user' | 'admin' })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="user">Cleaner</option>
            <option value="admin">Administrator</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Cleaners can view and manage their assigned bookings. Administrators have full system access.
          </p>
        </div>
        <Button 
          type="submit" 
          disabled={creating}
          className="w-full"
        >
          {creating ? 'Creating User...' : 'Create User'}
        </Button>
      </form>
    </div>
  );
};

export default CreateUserForm;
