import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CustomerWelcome = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const customerId = searchParams.get('customer_id');
  const paymentSuccess = searchParams.get('payment_setup') === 'success';
  
  const [step, setStep] = useState<'loading' | 'set-password' | 'already-has-account' | 'error'>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    if (customerId) {
      checkAndSetupAccount();
    } else {
      setStep('error');
    }
  }, [customerId]);

  const checkAndSetupAccount = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('setup-customer-account', {
        body: { customer_id: parseInt(customerId!) }
      });

      if (error) throw error;

      if (data.alreadyHasAccount) {
        setCustomerEmail(data.email);
        setStep('already-has-account');
      } else if (data.accessToken) {
        setAccessToken(data.accessToken);
        setCustomerEmail(data.email);
        setStep('set-password');
      } else {
        throw new Error('Unexpected response from account setup');
      }
    } catch (error) {
      console.error('Error setting up account:', error);
      setStep('error');
      toast({
        title: "Error",
        description: "There was a problem setting up your account. Please contact support.",
        variant: "destructive"
      });
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Set the session using the access token from the edge function
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: accessToken // The edge function returns a token that works for both
      });

      if (sessionError) throw sessionError;

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      toast({
        title: "Welcome!",
        description: "Your account is ready. Taking you to your dashboard...",
      });

      // Navigate to dashboard
      setTimeout(() => {
        navigate('/customer-dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('Error setting password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to set password. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {paymentSuccess && (
          <div className="bg-green-50 border-b border-green-100 p-4 rounded-t-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Payment method added successfully!</span>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Setting up your account...</p>
            </div>
          </CardContent>
        )}

        {step === 'set-password' && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Create Your Password
              </CardTitle>
              <CardDescription>
                Set a password to access your account and manage your bookings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Create Account & Continue'
                  )}
                </Button>
              </form>
            </CardContent>
          </>
        )}

        {step === 'already-has-account' && (
          <>
            <CardHeader>
              <CardTitle>Welcome Back!</CardTitle>
              <CardDescription>
                You already have an account. Please log in to manage your bookings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={customerEmail}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <Button onClick={handleGoToLogin} className="w-full">
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'error' && (
          <>
            <CardHeader>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                We couldn't set up your account. Please contact support for assistance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleGoToLogin} variant="outline" className="w-full">
                Go to Login
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default CustomerWelcome;
