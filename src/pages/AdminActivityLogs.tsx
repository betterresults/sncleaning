import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ActivityLogsView from '@/components/admin/ActivityLogsView';
import { usePageTracking } from '@/hooks/usePageTracking';

const AdminActivityLogs = () => {
  usePageTracking('Admin Activity Logs');
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading activity logs...</div>
      </div>
    );
  }

  // Only allow admins

  return (
<div className="w-full px-1 sm:px-0 max-w-7xl mx-auto">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-[#185166]">Activity Logs</h1>
                  <p className="text-gray-600 mt-2">
                    Monitor all user activities and system events
                  </p>
                </div>
                <ActivityLogsView />
              </div>
  );
};

export default AdminActivityLogs;