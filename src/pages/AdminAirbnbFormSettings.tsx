import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AirbnbConfigPanel } from '@/components/airbnb/AirbnbConfigPanel';

const AdminAirbnbFormSettings = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return null;
  }

  return (
<div className="max-w-4xl mx-auto">
                <AirbnbConfigPanel />
              </div>
  );
};

export default AdminAirbnbFormSettings;
