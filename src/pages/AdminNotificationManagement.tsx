import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTracking } from "@/hooks/usePageTracking";
import { NotificationManagementDashboard } from "@/components/notifications/NotificationManagementDashboard";
import { ShellLoading, ShellPage } from '@/layouts/shell';

const AdminNotificationManagement = () => {
  usePageTracking("Admin Notification Management");
  const { user, userRole, signOut } = useAuth();

  return (
    <ShellPage width="wide">
      <NotificationManagementDashboard />
    </ShellPage>
  );
};

export default AdminNotificationManagement;
