
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, userRole, cleanerId, loading: authLoading } = useAuth();

  console.log('Auth - Current auth state:', { user: !!user, userRole, cleanerId, authLoading });

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      console.log('Auth - User authenticated, checking redirect...');
      // Don't redirect immediately, let the user role determination complete
    }
  }, [user, userRole, cleanerId, authLoading]);

  if (!authLoading && user) {
    console.log('Auth - Redirecting authenticated user:', { userRole, cleanerId });
    
    // Redirect cleaners to cleaner dashboard
    if (userRole === 'user' && cleanerId) {
      return <Navigate to="/cleaner-dashboard" replace />;
    }
    
    // Redirect admins to admin dashboard
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {getCardTitle()}
          </CardTitle>
          <CardDescription>
            {getCardDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isForgotPassword && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {getButtonText()}
            </Button>
          </form>
          
          <div className="mt-4 text-center space-y-2">
            {!isForgotPassword ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-blue-600 hover:underline block w-full"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="text-sm text-blue-600 hover:underline"
              >
                Back to login
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
