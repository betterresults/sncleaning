import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfitTrackingDashboard } from '@/components/payments/ProfitTrackingDashboard';

const AdminProfitTracking = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading...</div>
      </div>
    );
  }

  return (
<div className="max-w-7xl mx-auto">
                <ProfitTrackingDashboard />
              </div>
  );
};

export default AdminProfitTracking;