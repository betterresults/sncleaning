import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WhatsAppContactList from '@/components/chat/WhatsAppContactList';
import WhatsAppMessageList from '@/components/chat/WhatsAppMessageList';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const AdminChatManagement = () => {
  const { user, userRole, signOut } = useAuth();
  const [activeContact, setActiveContact] = React.useState<any>(null);

  const handleContactSelect = (contact: any) => {
    setActiveContact(contact);
  };

  // Allow admin and sales_agent

  return (
    <ShellPage width="wide">
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
              </ShellPage>
  );
};

export default AdminChatManagement;