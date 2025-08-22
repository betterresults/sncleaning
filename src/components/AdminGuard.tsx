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
      if (loading) return;
      
      // Layer 1: Basic checks
      if (!user) {
        console.warn('AdminGuard: No user found');
        setIsVerifying(false);
        return;
      }

      if (userRole !== 'admin') {
        console.warn('AdminGuard: User role is not admin:', userRole);
        setVerificationError('Access denied - Administrator privileges required');
        setIsVerifying(false);
        return;
      }

      try {
        // Layer 2: Server-side verification
        console.log('AdminGuard: Performing server-side admin verification...');
        
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('AdminGuard: Database verification failed:', error);
          setVerificationError('Failed to verify administrator status');
          setIsVerifying(false);
          return;
        }

        if (!roleData || roleData.role !== 'admin') {
          console.error('AdminGuard: Database role mismatch:', roleData);
          setVerificationError('Administrator privileges not found in database');
          setIsVerifying(false);
          return;
        }

        // Layer 3: Session validation
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('AdminGuard: Session validation failed:', sessionError);
          setVerificationError('Invalid or expired session');
          setIsVerifying(false);
          return;
        }

        console.log('AdminGuard: All verification layers passed');
        setIsVerifiedAdmin(true);
        setIsVerifying(false);

      } catch (error) {
        console.error('AdminGuard: Verification error:', error);
        setVerificationError('Security verification failed');
        setIsVerifying(false);
      }
    };

    verifyAdminAccess();
  }, [user, userRole, loading]);

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
        <div className="max-w-md w-full">
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