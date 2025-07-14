import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import CreateNewBookingDialog from '@/components/booking/CreateNewBookingDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarPlus } from 'lucide-react';

const AdminAddBooking = () => {
  const { user, userRole, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user || userRole !== 'admin') {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <UnifiedSidebar 
          navigationItems={adminNavigation}
          user={user}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1">
          <UnifiedHeader 
            title="Add New Booking 📅"
            user={user}
            userRole={userRole}
          />
          
          <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
            <div className="max-w-4xl mx-auto space-y-6">
              <Card className="border shadow-sm">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <CalendarPlus className="h-6 w-6" />
                    Create New Booking
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <CreateNewBookingDialog>
                    <div className="w-full bg-[#185166] hover:bg-[#185166]/90 text-white rounded-lg p-8 text-center cursor-pointer transition-colors">
                      <CalendarPlus className="h-12 w-12 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Create New Booking</h3>
                      <p className="text-white/80">Click here to add a new booking to the system</p>
                    </div>
                  </CreateNewBookingDialog>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminAddBooking;