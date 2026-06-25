import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ActivityLogsView from '@/components/admin/ActivityLogsView';
import { usePageTracking } from '@/hooks/usePageTracking';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const AdminActivityLogs = () => {
  usePageTracking('Admin Activity Logs');
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return <ShellLoading />;
  }

  // Only allow admins

  return (
    <ShellPage width="wide">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-[#185166]">Activity Logs</h1>
                  <p className="text-gray-600 mt-2">
                    Monitor all user activities and system events
                  </p>
                </div>
                <ActivityLogsView />
              </ShellPage>
  );
};

export default AdminActivityLogs;