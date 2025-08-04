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

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  full_name?: string;
}

interface CleanerAccountActionsProps {
  cleaner: Cleaner;
  onAccountCreated?: () => void;
}

export const CleanerAccountActions = ({ cleaner, onAccountCreated }: CleanerAccountActionsProps) => {
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [checkingAccount, setCheckingAccount] = useState(true);
  const { toast } = useToast();

  // Check if cleaner has an account
  useEffect(() => {
    checkCleanerAccount();
  }, [cleaner.id]);

  const checkCleanerAccount = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('cleaner_id', cleaner.id)
        .single();

      setHasAccount(!!data);
    } catch (error) {
      setHasAccount(false);
    } finally {
      setCheckingAccount(false);
    }
  };

  const handleCreateAccount = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-create-cleaner-account', {
        body: {
          cleaner_id: cleaner.id,
          send_email: true
        }
      });

      if (error) throw error;

      if (data.success) {
        setHasAccount(true);
        toast({
          title: "🎉 Cleaner Account Created!",
          description: `Welcome email sent to ${cleaner.email}`,
        });
        onAccountCreated?.();
      } else {
        throw new Error(data.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Error creating cleaner account:', error);
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
      const { error } = await supabase.auth.resetPasswordForEmail(cleaner.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "🔐 Password Reset Email Sent",
        description: `Reset link sent to ${cleaner.email}`,
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

  const cleanerName = cleaner.full_name || `${cleaner.first_name} ${cleaner.last_name}`;

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
                  This will send a password reset email to <strong>{cleaner.email}</strong>.
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
                <AlertDialogTitle>Create Cleaner Account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will create a login account for <strong>{cleanerName}</strong> 
                  and send a beautiful welcome email to <strong>{cleaner.email}</strong> with their login credentials.
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