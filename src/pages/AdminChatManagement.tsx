import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WhatsAppContactList from '@/components/chat/WhatsAppContactList';
import WhatsAppMessageList from '@/components/chat/WhatsAppMessageList';

const AdminChatManagement = () => {
  const { user, userRole, signOut } = useAuth();
  const [activeContact, setActiveContact] = React.useState<any>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleContactSelect = (contact: any) => {
    setActiveContact(contact);
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
            title=""
            user={user}
            userRole={userRole}
          />
          
          <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
                {/* Contacts List */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>WhatsApp Contacts</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      WhatsApp Contact List (Component needs props update)
                    </div>
                  </CardContent>
                </Card>

                {/* Messages */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>
                      {activeContact ? `Messages with ${activeContact.name}` : 'Select a contact'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      {activeContact ? 'WhatsApp Message List (Component needs props update)' : 'Select a contact to view messages'}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminChatManagement;