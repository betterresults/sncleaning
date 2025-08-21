
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';
import InstallPrompt from '@/components/InstallPrompt';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, userRole, cleanerId, customerId, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();

  console.log('Auth - Current auth state:', { user: !!user, userRole, cleanerId, customerId, authLoading });

  // Check for payment-related success messages
  useEffect(() => {
    const paymentSetup = searchParams.get('payment_setup');
    const paymentSuccess = searchParams.get('payment_success');
    
    if (paymentSetup === 'success') {
      toast({
        title: 'Payment Method Added!',
        description: 'Your payment method has been successfully added. Please log in to access your account.',
      });
    }
    
    if (paymentSuccess === 'true') {
      toast({
        title: 'Payment Successful!',
        description: 'Your payment has been processed successfully. Please log in to access your account.',
      });
    }
  }, [searchParams, toast]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      console.log('Auth - User authenticated, checking redirect...');
      // Don't redirect immediately, let the user role determination complete
    }
  }, [user, userRole, cleanerId, authLoading]);

  if (!authLoading && user) {
    console.log('Auth - Redirecting authenticated user:', { userRole, cleanerId, customerId });
    
    // Check if there's a specific redirect requested
    const redirectParam = searchParams.get('redirect');
    
    if (redirectParam === 'customer' && customerId) {
      return <Navigate to="/customer-dashboard" replace />;
    }
    
    // Redirect cleaners to cleaner dashboard
    if (userRole === 'user' && cleanerId) {
      return <Navigate to="/cleaner-dashboard" replace />;
    }
    
    // Redirect users with customer ID to customer dashboard  
    if (userRole === 'user' && customerId) {
      return <Navigate to="/customer-dashboard" replace />;
    }
    
    // Redirect admins to dashboard
    if (userRole === 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    
    // Default redirect to main dashboard
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (error) throw error;

        toast({
          title: 'Password Reset Email Sent',
          description: 'Check your email for a link to reset your password.',
        });
        setIsForgotPassword(false);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Logged in successfully!',
        });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              role: 'guest', // Default role for public signups
            },
          },
        });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Account created successfully!',
        });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCardTitle = () => {
    if (isForgotPassword) return 'Reset Password';
    return isLogin ? 'Welcome Back' : 'Create Account';
  };

  const getCardDescription = () => {
    if (isForgotPassword) return 'Enter your email to receive a password reset link';
    return isLogin ? 'Sign in to your account' : 'Sign up for SN Cleaning';
  };

  const getButtonText = () => {
    if (loading) return 'Loading...';
    if (isForgotPassword) return 'Send Reset Email';
    return isLogin ? 'Sign In' : 'Sign Up';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18A5A5] via-[#185166] to-[#18A5A5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Modern Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white mb-8 tracking-tight">
            SN CLEANING
            <span className="block text-3xl font-light mt-2 opacity-90">SERVICES</span>
          </h1>
        </div>

        {/* Modern Glass Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {getCardTitle()}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && !isForgotPassword && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 rounded-xl focus:bg-white/30 focus:border-white/50 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
                <Input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 rounded-xl focus:bg-white/30 focus:border-white/50 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
              </div>
            )}
            
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 rounded-xl focus:bg-white/30 focus:border-white/50 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              required
            />
            
            {!isForgotPassword && (
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 rounded-xl focus:bg-white/30 focus:border-white/50 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                required
              />
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-white text-[#18A5A5] hover:bg-white/90 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 transform hover:scale-[1.02]" 
              disabled={loading}
            >
              {getButtonText()}
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-3">
            {!isForgotPassword ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
                {isLogin && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-white/80 hover:text-white transition-colors text-sm"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                Back to login
              </button>
            )}
          </div>
        </div>
      </div>
      
      <InstallPrompt />
    </div>
  );
};

export default Auth;
