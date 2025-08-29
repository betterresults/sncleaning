
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';

interface CreateCustomerUserDialogProps {
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  onSuccess: () => void;
}

const CreateCustomerUserDialog = ({ customer, onSuccess }: CreateCustomerUserDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('123456');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Creating user account for customer:', customer);
      
      // Call the Edge Function to create user with customer role
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: customer.email,
          password: password,
          firstName: customer.first_name,
          lastName: customer.last_name,
          role: 'guest' // customers have 'guest' role
        }
      });

      console.log('Create user response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to create user account');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create user account');
      }

      toast({
        title: 'Success',
        description: `User account created for ${customer.first_name} ${customer.last_name}! They can now log in and access their bookings.`,
      });

      setOpen(false);
      onSuccess();
      
    } catch (error: any) {
      console.error('Error creating user account:', error);
      
      // Check if it's an "email already exists" error
      if (error.message && error.message.includes('already been registered')) {
        toast({
          title: 'Account Already Exists',
          description: `A user account with email ${customer.email} already exists. This customer may already have login access to the system.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create user account',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <User className="h-4 w-4 mr-2" />
          Create Account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Create a system user account for <strong>{customer.first_name} {customer.last_name}</strong> so they can log in and access their bookings.
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customer.email}
                disabled
                className="bg-gray-50"
              />
            </div>
            
            <div>
              <Label htmlFor="customerPassword">Password</Label>
              <PasswordInput
                id="customerPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                minLength={6}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCustomerUserDialog;
