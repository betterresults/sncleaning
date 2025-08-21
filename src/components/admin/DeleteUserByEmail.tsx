import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2 } from 'lucide-react';

export const DeleteUserByEmail = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDeleteUser = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting to delete user with email:', email);
      
      const { data, error } = await supabase.functions.invoke('delete-user-by-email', {
        body: { email: email.trim() }
      });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      console.log('Function response:', data);

      if (data.success) {
        if (data.found) {
          toast({
            title: "Success",
            description: `User with email ${email} has been deleted`,
          });
        } else {
          toast({
            title: "No User Found",
            description: `No user found with email ${email}`,
          });
        }
        setEmail('');
      } else {
        throw new Error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to delete user',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Delete User by Email
        </CardTitle>
        <CardDescription>
          Search for and delete a user account by email address
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
          />
        </div>
        
        <Button 
          onClick={handleDeleteUser}
          disabled={loading || !email.trim()}
          variant="destructive"
          className="w-full"
        >
          {loading ? 'Searching and Deleting...' : 'Delete User'}
        </Button>
        
        <div className="text-sm text-muted-foreground">
          <p>⚠️ This action cannot be undone.</p>
          <p>This will delete the user from auth.users and all related records.</p>
        </div>
      </CardContent>
    </Card>
  );
};