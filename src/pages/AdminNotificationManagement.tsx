import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTracking } from "@/hooks/usePageTracking";
import { NotificationManagementDashboard } from "@/components/notifications/NotificationManagementDashboard";

const AdminNotificationManagement = () => {
  usePageTracking("Admin Notification Management");
  const { user, userRole, signOut } = useAuth();

  return (
<NotificationManagementDashboard />
  );
};

export default AdminNotificationManagement;
