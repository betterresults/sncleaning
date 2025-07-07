import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import CustomerSidebar from '@/components/CustomerSidebar';
import CustomerContacts from '@/components/chat/CustomerContacts';
import ChatInterface from '@/components/chat/ChatInterface';
import AdminCustomerSelector from '@/components/admin/AdminCustomerSelector';
import { useChat } from '@/hooks/useChat';
import { ChatType } from '@/types/chat';

const CustomerMessages = () => {
  const { user, userRole, customerId, loading } = useAuth();
  const { selectedCustomerId } = useAdminCustomer();
  
  // Use selectedCustomerId for admin, otherwise use authenticated customer's ID
  const effectiveCustomerId = userRole === 'admin' ? selectedCustomerId : customerId;
  const isAdminViewing = userRole === 'admin';

  const {
    chats,
    activeChat,
    setActiveChat,
    messages,
    loading: chatLoading,
    sendingMessage,
    fetchMessages,
    sendMessage,
    createChat
  } = useChat(undefined, effectiveCustomerId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading messages...</div>
      </div>
    );
  }

  if (!user || (userRole !== 'guest' && userRole !== 'admin') || (userRole === 'guest' && !customerId)) {
    return <Navigate to="/auth" replace />;
  }

  const handleSelectContact = async (contact: any, booking?: any) => {
    const chatToSelect = booking?.chat || contact.chat;
    if (chatToSelect) {
      setActiveChat(chatToSelect);
      await fetchMessages(chatToSelect.id);
    }
  };

  const handleCreateChat = async (contact: any, booking?: any) => {
    if (!effectiveCustomerId) return;

    let chatType: ChatType;
    let customerId: number | undefined;
    let cleanerId: number | undefined;
    let bookingId: number | undefined;

    if (contact.type === 'office') {
      chatType = 'customer_office';
      customerId = effectiveCustomerId;
      bookingId = booking?.bookingId;
    } else if (contact.type === 'cleaner') {
      chatType = 'customer_cleaner';
      customerId = effectiveCustomerId;
      cleanerId = contact.cleaner_id;
      bookingId = booking?.bookingId;
    } else {
      return;
    }

    const newChat = await createChat(chatType, customerId, cleanerId, bookingId);
    if (newChat) {
      setActiveChat(newChat);
      await fetchMessages(newChat.id);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (activeChat) {
      await sendMessage(activeChat.id, message);
    }
  };

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Customer';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CustomerSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 shadow-sm">
            <SidebarTrigger className="-ml-1 p-2" />
            <div className="flex-1" />
            <div className="text-base font-semibold text-foreground truncate">
              {isAdminViewing ? 'Chat Management - Customer View' : 'Messages'}
            </div>
          </header>
          
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Admin Customer Selector */}
            {isAdminViewing && (
              <div className="p-4 border-b border-border bg-muted/30">
                <AdminCustomerSelector />
              </div>
            )}

            {!effectiveCustomerId && isAdminViewing ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Select a Customer
                  </h3>
                  <p className="text-muted-foreground">
                    Choose a customer above to view their messages and contacts
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex min-h-0">
                {/* Contacts List */}
                <div className="w-80 flex-shrink-0 h-full overflow-hidden">
                  <CustomerContacts
                    chats={chats}
                    activeChat={activeChat}
                    onSelectContact={handleSelectContact}
                    onCreateChat={handleCreateChat}
                    loading={chatLoading}
                    customerId={effectiveCustomerId}
                  />
                </div>

                {/* Chat Interface */}
                <div className="flex-1 min-h-0">
                  {activeChat ? (
                    <ChatInterface
                      chat={activeChat}
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      sendingMessage={sendingMessage}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-card">
                      <div className="text-center">
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          Welcome to Messages, {firstName}!
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Select a contact to start messaging with cleaners or the office
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CustomerMessages;