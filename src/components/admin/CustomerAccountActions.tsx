import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Mail, RotateCcw, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface CustomerAccountActionsProps {
  customer: Customer;
  onAccountCreated?: () => void;
}

export const CustomerAccountActions = ({ customer, onAccountCreated }: CustomerAccountActionsProps) => {
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [checkingAccount, setCheckingAccount] = useState(true);
  const { toast } = useToast();

  // Check if customer has an account
  useEffect(() => {
    checkCustomerAccount();
  }, [customer.id]);

  const checkCustomerAccount = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('customer_id', customer.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking customer account:', error);
        setHasAccount(false);
      } else {
        setHasAccount(!!data);
      }
    } catch (error) {
      console.error('Error checking customer account:', error);
      setHasAccount(false);
    } finally {
      setCheckingAccount(false);
    }
  };

  const handleCreateAccount = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bulk-create-customer-accounts', {
        body: {
          customer_ids: [customer.id],
          send_emails: true
        }
      });

      if (error) throw error;

      if (data.results && data.results.length > 0) {
        setHasAccount(true);
        toast({
          title: "🎉 Account Created Successfully!",
          description: `Welcome email sent to ${customer.email}`,
        });
        onAccountCreated?.();
      } else if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0].error);
      }
    } catch (error) {
      console.error('Error creating customer account:', error);
      toast({
        title: "Error Creating Account",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(customer.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "🔐 Password Reset Email Sent",
        description: `Reset link sent to ${customer.email}`,
      });
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast({
        title: "Error Sending Reset Email",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  if (checkingAccount) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Checking account...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {hasAccount ? (
        <>
          <Badge variant="secondary" className="bg-green-100 text-green-800 gap-1">
            <CheckCircle className="h-3 w-3" />
            Has Account
          </Badge>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={resetLoading}>
                {resetLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Reset Password
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Send Password Reset Email?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will send a password reset email to <strong>{customer.email}</strong>.
                  They'll receive a secure link to reset their password.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handlePasswordReset}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Reset Email
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <>
          <Badge variant="outline" className="text-orange-600 border-orange-300">
            No Account
          </Badge>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default" size="sm" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Create Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Create Customer Account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will create a login account for <strong>{customer.first_name} {customer.last_name}</strong> 
                  and send a beautiful welcome email to <strong>{customer.email}</strong> with their login credentials.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCreateAccount}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account & Send Email
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};