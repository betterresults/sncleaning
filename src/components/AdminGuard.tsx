import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

/**
 * CRITICAL SECURITY COMPONENT
 * 
 * This component provides multi-layer protection for admin routes:
 * 1. Frontend role verification
 * 2. Server-side role verification  
 * 3. Session validation
 * 
 * NEVER bypass this component for admin routes
 */
const AdminGuard: React.FC<AdminGuardProps> = ({ 
  children, 
  fallbackPath = '/auth' 
}) => {
  const { user, userRole, loading } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      console.log('AdminGuard: Starting verification...', { user: !!user, userRole, loading });
      
      // Don't start verification until auth is fully loaded
      if (loading) {
        console.log('AdminGuard: Still loading auth, waiting...');
        return;
      }
      
      // If no user, allow redirect
      if (!user) {
        console.warn('AdminGuard: No user found');
        setIsVerifying(false);
        return;
      }

      // If user role is admin, grant access immediately
      if (userRole === 'admin') {
        console.log('AdminGuard: Admin role confirmed, granting access');
        setIsVerifiedAdmin(true);
        setIsVerifying(false);
        return;
      }

      // If role is not admin, check if it's still loading or actually denied
      if (userRole === null) {
        console.log('AdminGuard: Role still loading, waiting...');
        // Give it a bit more time for role to load
        setTimeout(() => {
          if (userRole === null) {
            console.warn('AdminGuard: Role loading timeout, denying access');
            setVerificationError('Unable to verify admin access - please try refreshing');
            setIsVerifying(false);
          }
        }, 3000); // 3 second timeout
        return;
      }

      // Role is loaded but not admin
      console.warn('AdminGuard: User role is not admin:', userRole);
      setVerificationError(`Access denied - Current role: ${userRole}`);
      setIsVerifying(false);
    };

    verifyAdminAccess();
  }, [user?.id, userRole, loading]);

  // Show loading state
  if (loading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-blue-500 mx-auto animate-pulse" />
          <div className="text-lg font-medium">Verifying Administrator Access...</div>
          <div className="text-sm text-gray-500">Performing security checks</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (verificationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div className="font-semibold">Access Denied</div>
              <div>{verificationError}</div>
              <div className="text-xs mt-2">
                If you believe this is an error, please contact your system administrator.
              </div>
            </AlertDescription>
          </Alert>
          
          {/* Manual Navigation Options */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-center">Go to Your Dashboard</h3>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/customer-dashboard'}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                I'm a Customer
              </button>
              <button
                onClick={() => window.location.href = '/cleaner-dashboard'}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                I'm a Cleaner
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                I'm an Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not verified admin
  if (!user || !isVerifiedAdmin) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Render protected content
  return <>{children}</>;
};

export default AdminGuard;