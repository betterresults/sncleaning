
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Navigate, Link } from 'react-router-dom';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Redirect authenticated users to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md mx-auto px-6">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">Welcome to SN Cleaning</h1>
        <p className="text-xl text-gray-600 mb-8">Professional cleaning services at your fingertips</p>
        <div className="space-y-4">
          <Link to="/auth">
            <Button size="lg" className="w-full">
              Sign In / Sign Up
            </Button>
          </Link>
          <p className="text-sm text-gray-500">
            Create an account or sign in to access your cleaning dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
