import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import PricingFormulasManager from '@/components/admin/PricingFormulasManager';

const AdminPricingFormulas = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading pricing formulas...</div>
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 shadow-sm">
            <SidebarTrigger className="-ml-1 p-2" />
            <div className="flex-1" />
            <div className="text-base font-semibold text-foreground truncate">
              Pricing Management
            </div>
          </header>
          
          <main className="flex-1 p-4">
            <PricingFormulasManager />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminPricingFormulas;