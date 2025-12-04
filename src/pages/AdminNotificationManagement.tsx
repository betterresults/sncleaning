import React from "react";
import AdminGuard from "@/components/AdminGuard";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { UnifiedSidebar } from "@/components/UnifiedSidebar";
import { UnifiedHeader } from "@/components/UnifiedHeader";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTracking } from "@/hooks/usePageTracking";
import { NotificationManagementDashboard } from "@/components/notifications/NotificationManagementDashboard";
import { adminNavigation } from "@/lib/navigationItems";

const AdminNotificationManagement = () => {
  usePageTracking("Admin Notification Management");
  const { user, userRole, signOut } = useAuth();

  return (
    <AdminGuard>
      <SidebarProvider>
        <div className="min-h-screen flex flex-col w-full bg-gray-50">
          <UnifiedHeader 
            title=""
            user={user}
            onSignOut={signOut}
            userRole={userRole}
          />
          <div className="flex flex-1 w-full">
            <UnifiedSidebar 
              navigationItems={adminNavigation}
              user={user}
              userRole={userRole}
              onSignOut={signOut}
            />
            <SidebarInset className="flex-1 flex flex-col p-0 m-0 overflow-x-hidden">
              <main className="flex-1 bg-gray-50 m-0 px-4 md:px-6 py-4 md:py-6 w-full">
                <NotificationManagementDashboard />
              </main>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
};

export default AdminNotificationManagement;
