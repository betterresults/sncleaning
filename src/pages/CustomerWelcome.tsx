import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Loader2, Lock, AlertCircle, RefreshCw, CreditCard, UserPlus, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Step = 'loading' | 'set-password' | 'already-has-account' | 'error' | 'timeout';

interface ProgressStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'completed' | 'error';
}

const CustomerWelcome = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const customerId = searchParams.get('customer_id');
  const paymentSuccess = searchParams.get('payment_setup') === 'success';
  
  const [step, setStep] = useState<Step>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Connecting...');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([
    { id: 'payment', label: 'Card Saved', icon: <CreditCard className="h-4 w-4" />, status: paymentSuccess ? 'completed' : 'pending' },
    { id: 'account', label: 'Setting up account', icon: <UserPlus className="h-4 w-4" />, status: 'pending' },
    { id: 'password', label: 'Create password', icon: <KeyRound className="h-4 w-4" />, status: 'pending' },
  ]);

  useEffect(() => {
    if (customerId) {
      checkAndSetupAccount();
    } else {
      setStep('error');
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [customerId]);

  const updateProgressStep = (stepId: string, status: ProgressStep['status']) => {
    setProgressSteps(prev => prev.map(s => 
      s.id === stepId ? { ...s, status } : s
    ));
  };

  const checkAndSetupAccount = async () => {
    // Update progress
    updateProgressStep('account', 'active');
    setLoadingMessage('Setting up your account...');

    // Set timeout for slow connections
    timeoutRef.current = setTimeout(() => {
      setLoadingMessage('This is taking longer than expected...');
    }, 5000);

    // Set longer timeout for failure
    const failureTimeout = setTimeout(() => {
      if (step === 'loading') {
        setStep('timeout');
        updateProgressStep('account', 'error');
      }
    }, 15000);

    try {
      abortControllerRef.current = new AbortController();
      
      const { data, error } = await supabase.functions.invoke('setup-customer-account', {
        body: { customer_id: parseInt(customerId!) }
      });

      clearTimeout(failureTimeout);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (error) throw error;

      updateProgressStep('account', 'completed');

      if (data.alreadyHasAccount) {
        setCustomerEmail(data.email);
        setStep('already-has-account');
      } else if (data.accessToken) {
        setAccessToken(data.accessToken);
        setCustomerEmail(data.email);
        updateProgressStep('password', 'active');
        setStep('set-password');
      } else {
        throw new Error('Unexpected response from account setup');
      }
    } catch (error: any) {
      clearTimeout(failureTimeout);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      console.error('Error setting up account:', error);
      updateProgressStep('account', 'error');
      
      // Check if it's a network error
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        setStep('timeout');
      } else {
        setStep('error');
        toast({
          title: "Error",
          description: "There was a problem setting up your account. Please contact support.",
          variant: "destructive"
        });
      }
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setStep('loading');
    updateProgressStep('account', 'pending');
    updateProgressStep('password', 'pending');
    checkAndSetupAccount();
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
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: accessToken
      });

      if (sessionError) throw sessionError;

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      updateProgressStep('password', 'completed');

      toast({
        title: "Welcome!",
        description: "Your account is ready. Taking you to your dashboard...",
      });

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

  const ProgressIndicator = () => (
    <div className="flex items-center justify-center gap-2 py-4">
      {progressSteps.map((progressStep, index) => (
        <div key={progressStep.id} className="flex items-center">
          <div className={`
            flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300
            ${progressStep.status === 'completed' ? 'bg-green-500 text-white' : ''}
            ${progressStep.status === 'active' ? 'bg-primary text-primary-foreground animate-pulse' : ''}
            ${progressStep.status === 'pending' ? 'bg-muted text-muted-foreground' : ''}
            ${progressStep.status === 'error' ? 'bg-destructive text-destructive-foreground' : ''}
          `}>
            {progressStep.status === 'completed' ? (
              <CheckCircle className="h-4 w-4" />
            ) : progressStep.status === 'active' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : progressStep.status === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              progressStep.icon
            )}
          </div>
          {index < progressSteps.length - 1 && (
            <div className={`w-8 h-0.5 mx-1 transition-all duration-300 ${
              progressStep.status === 'completed' ? 'bg-green-500' : 'bg-muted'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {paymentSuccess && (
          <div className="bg-green-50 dark:bg-green-950/30 border-b border-green-100 dark:border-green-900 p-4 rounded-t-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Payment method added successfully!</span>
            </div>
          </div>
        )}

        <ProgressIndicator />

        {step === 'loading' && (
          <CardContent className="pt-4 pb-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">{loadingMessage}</p>
                {loadingMessage.includes('longer') && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Please wait, we're still working on it...
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        )}

        {step === 'timeout' && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                Connection Issue
              </CardTitle>
              <CardDescription>
                We're having trouble connecting. This might be due to a slow network.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                <p>Don't worry - if your card was saved, it's still saved!</p>
                <p className="mt-2">You can try again or contact support if the problem persists.</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRetry} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again {retryCount > 0 && `(${retryCount})`}
                </Button>
                <Button onClick={handleGoToLogin} variant="outline" className="flex-1">
                  Go to Login
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Need help? Contact us at support@sncleaningservices.co.uk
              </p>
            </CardContent>
          </>
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
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Something went wrong
              </CardTitle>
              <CardDescription>
                We couldn't set up your account. Please contact support for assistance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleRetry} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={handleGoToLogin} variant="outline" className="w-full">
                Go to Login
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Need help? Contact us at support@sncleaningservices.co.uk
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default CustomerWelcome;
