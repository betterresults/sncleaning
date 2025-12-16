import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface StaffGuardProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

/**
 * STAFF ACCESS GUARD
 * 
 * This component provides protection for staff routes (admin + sales_agent):
 * 1. Frontend role verification
 * 2. Session validation
 * 
 * Used for pages accessible by both admins and sales agents
 */
const StaffGuard: React.FC<StaffGuardProps> = ({ 
  children, 
  fallbackPath = '/auth' 
}) => {
  const { user, userRole, loading } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerifiedStaff, setIsVerifiedStaff] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const allowedRoles = ['admin', 'sales_agent'];

  useEffect(() => {
    const verifyStaffAccess = async () => {
      console.log('StaffGuard: Starting verification...', { user: !!user, userRole, loading });
      
      if (loading) {
        console.log('StaffGuard: Still loading auth, waiting...');
        return;
      }
      
      // Layer 1: Basic checks
      if (!user) {
        console.warn('StaffGuard: No user found, redirecting to auth');
        setIsVerifying(false);
        return;
      }

      if (!userRole || !allowedRoles.includes(userRole)) {
        console.warn('StaffGuard: User role is not staff:', userRole, 'Showing manual navigation options');
        setVerificationError(`Access denied - Current role: ${userRole || 'none'}`);
        setIsVerifying(false);
        return;
      }

      console.log('StaffGuard: Frontend shows staff role, doing minimal verification...');

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('StaffGuard: Session error:', sessionError);
          setVerificationError('Session expired - please log in again');
          setIsVerifying(false);
          return;
        }

        if (!session) {
          console.error('StaffGuard: No active session');
          setVerificationError('No active session - please log in again');
          setIsVerifying(false);
          return;
        }

        console.log('StaffGuard: Session valid, granting access');
        setIsVerifiedStaff(true);
        setIsVerifying(false);

      } catch (error) {
        console.error('StaffGuard: Verification error:', error);
        console.log('StaffGuard: Network error detected, granting access based on frontend role');
        setIsVerifiedStaff(true);
        setIsVerifying(false);
      }
    };

    verifyStaffAccess();
  }, [user?.id, userRole, loading]);

  // Show loading state
  if (loading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-blue-500 mx-auto animate-pulse" />
          <div className="text-lg font-medium">Verifying Access...</div>
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
                onClick={() => window.location.href = '/auth'}
                className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Sign In Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not verified staff
  if (!user || !isVerifiedStaff) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Render protected content
  return <>{children}</>;
};

export default StaffGuard;
