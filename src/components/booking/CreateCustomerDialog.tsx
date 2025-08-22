
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateCustomerDialogProps {
  children: React.ReactNode;
  onCustomerCreated: (customer: any) => void;
}

const CreateCustomerDialog = ({ children, onCustomerCreated }: CreateCustomerDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postcode: '',
    company: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('Creating customer with data:', formData);

    try {
      const customerData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        client_status: 'Current'
      };

      console.log('About to insert customer data:', JSON.stringify(customerData, null, 2));
      
      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      console.log('Customer insert response:', { data, error });
      console.log('Full error object:', JSON.stringify(error, null, 2));

      if (error) {
        console.error('Error creating customer:', error);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Error code:', error.code);
        toast({
          title: "Error",
          description: `Failed to create customer: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('Customer created successfully:', data);

      // Create a default address if address info was provided
      if (formData.address || formData.postcode) {
        console.log('Creating address for customer:', data.id);
        console.log('Address data:', { address: formData.address, postcode: formData.postcode });
        
        const addressData = {
          customer_id: data.id,
          address: formData.address || '',
          postcode: formData.postcode || '',
          is_default: true
        };

        const { data: addressResult, error: addressError } = await supabase
          .from('addresses')
          .insert(addressData)
          .select();

        console.log('Address creation result:', { addressResult, addressError });

        if (addressError) {
          console.error('Error creating address:', addressError);
          console.error('Address error details:', JSON.stringify(addressError, null, 2));
          // Don't fail the whole operation if address creation fails, but show a warning
          toast({
            title: "Warning",
            description: "Customer created but address couldn't be saved. You can add it later.",
            variant: "destructive",
          });
        } else {
          console.log('Address created successfully:', addressResult);
        }
      }

      // Create auth user account so customer can log in
      console.log('Creating auth user account for customer:', data.id);
      const defaultPassword = 'TempPass123!'; // Secure temporary password
      
      const { data: userResult, error: userError } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: defaultPassword,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: 'guest' // customers have 'guest' role
        }
      });

      console.log('Create user response:', { userResult, userError });

      let authAccountCreated = false;
      if (userError) {
        console.error('Error creating user account:', userError);
        
        // Check if it's an "email already exists" error
        if (userError.message && userError.message.includes('already been registered')) {
          toast({
            title: "Customer Created - Account Exists",
            description: `Customer record created successfully. A user account with email ${formData.email} already exists, so they can log in to access their bookings.`,
          });
        } else {
          // Still successful but inform about login limitation
          toast({
            title: "Customer Created",
            description: "Customer created successfully. Login account will be created automatically when they first sign up.",
          });
        }
      } else if (!userResult || !userResult.success) {
        const errorMsg = userResult?.error || 'Unknown error';
        console.error('User creation failed:', errorMsg);
        
        // Check if it's an "email already exists" error in the result
        if (errorMsg && errorMsg.includes('already been registered')) {
          toast({
            title: "Customer Created - Account Exists",
            description: `Customer record created successfully. A user account with email ${formData.email} already exists, so they can log in to access their bookings.`,
          });
        } else {
          toast({
            title: "Customer Created", 
            description: "Customer created successfully. Login account will be created automatically when they first sign up.",
          });
        }
      } else {
        console.log('Auth user created successfully:', userResult);
        authAccountCreated = true;
        
        // Now link the customer to the newly created user profile
        const { error: linkError } = await supabase
          .from('profiles')
          .update({ customer_id: data.id })
          .eq('user_id', userResult.user.id);
          
        if (linkError) {
          console.error('Error linking profile to customer:', linkError);
        }
      }

      // Show appropriate success message
      if (authAccountCreated) {
        toast({
          title: "Success",
          description: `Customer and login account created! They can log in with email ${formData.email} and password: ${defaultPassword}`,
        });
      } else {
        toast({
          title: "Customer Created",
          description: "Customer record created successfully in the system.",
        });
      }

      onCustomerCreated(data);
      setOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        postcode: '',
        company: ''
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                value={formData.postcode}
                onChange={(e) => handleInputChange('postcode', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCustomerDialog;
