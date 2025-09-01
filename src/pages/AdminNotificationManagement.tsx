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
        <div className="min-h-screen flex w-full bg-background">
          <UnifiedSidebar 
            navigationItems={adminNavigation}
            user={user}
            userRole={userRole}
            onSignOut={signOut}
          />
          <div className="flex-1 flex flex-col">
            <UnifiedHeader 
              title="Email Notification Management"
              user={user}
              onSignOut={signOut}
              userRole={userRole}
            />
            <main className="flex-1 overflow-auto">
              <div className="container mx-auto p-6">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-foreground">Email Notification Management</h1>
                  <p className="text-muted-foreground mt-2">
                    Configure and manage all email notifications in your system
                  </p>
                </div>
                <NotificationManagementDashboard />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
};

export default AdminNotificationManagement;