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
  readOnly?: boolean;
}

export const CustomerAccountActions = ({ customer, onAccountCreated, readOnly = false }: CustomerAccountActionsProps) => {
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
      console.log(`Checking account for customer ID: ${customer.id}`);
      
      // Check if customer has a linked profile
      const { data: linkedProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('customer_id', customer.id)
        .maybeSingle();

      console.log(`Profile check result for customer ${customer.id}:`, { linkedProfile, profileError });

      if (linkedProfile) {
        console.log(`Customer ${customer.id} has linked account`);
        setHasAccount(true);
        return;
      }

      // Check if email already exists in profiles (different user)
      const { data: emailProfile, error: emailError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('email', customer.email)
        .maybeSingle();

      console.log(`Email check result for ${customer.email}:`, { emailProfile, emailError });

      if (emailProfile) {
        console.log(`Email ${customer.email} already has account (belongs to ${emailProfile.first_name} ${emailProfile.last_name})`);
        setHasAccount(true); // Show reset password since email has account
      } else {
        console.log(`Customer ${customer.id} has no account`);
        setHasAccount(false);
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
      const { data, error } = await supabase.functions.invoke('create-customer-account', {
        body: {
          customer_id: customer.id,
          send_email: true
        }
      });

      if (error) throw error;

      if (data.success) {
        setHasAccount(true);
        toast({
          title: "🎉 Account Created Successfully!",
          description: `Password reset email sent to ${customer.email}`,
        });
        onAccountCreated?.();
      } else {
        throw new Error(data.error || 'Failed to create account');
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
      console.log('Attempting password reset for:', customer.email);
      console.log('Redirect URL:', `https://account.sncleaningservices.co.uk/auth`);
      
      // Use Supabase's built-in password reset with custom email template
      const { data, error } = await supabase.auth.resetPasswordForEmail(customer.email, {
        redirectTo: `https://account.sncleaningservices.co.uk/auth`,
      });

      console.log('Password reset response:', { data, error });

      if (error) {
        console.error('Detailed error info:', {
          message: error.message,
          status: error.status,
          code: error.code,
          name: error.name
        });
        throw error;
      }

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

  if (readOnly) {
    return (
      <div className="flex items-center space-x-2">
        <Badge variant={hasAccount ? "secondary" : "outline"} className={hasAccount ? "bg-green-100 text-green-800" : "text-orange-600 border-orange-300"}>
          {hasAccount ? "Has Account" : "No Account"}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {hasAccount ? (
        <Button variant="outline" size="sm" disabled={resetLoading} onClick={handlePasswordReset}>
          {resetLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          Reset Password
        </Button>
      ) : (
        <Button variant="default" size="sm" disabled={loading} onClick={handleCreateAccount}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          Create Account
        </Button>
      )}
    </div>
  );
};