import React from "react";
import AdminGuard from "@/components/AdminGuard";
import { SidebarProvider } from "@/components/ui/sidebar";
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
        <div className="min-h-screen flex flex-col w-full bg-background">
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
            <div className="flex-1 flex flex-col">
              <main className="flex-1 overflow-auto">
                <div className="container mx-auto p-6">
                  <NotificationManagementDashboard />
                </div>
              </main>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
};

export default AdminNotificationManagement;
