import React from 'react';
import AdminGuard from '@/components/AdminGuard';
import ActivityLogsManager from '@/components/admin/ActivityLogsManager';

const AdminActivityLogs = () => {
  return (
    <AdminGuard>
      <div className="container mx-auto p-6">
        <ActivityLogsManager />
      </div>
    </AdminGuard>
  );
};

export default AdminActivityLogs;