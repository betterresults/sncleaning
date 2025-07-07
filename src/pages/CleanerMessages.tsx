import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { CleanerSidebar } from '@/components/CleanerSidebar';
import CleanerContacts from '@/components/chat/CleanerContacts';
import ChatInterface from '@/components/chat/ChatInterface';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';
import { useChat } from '@/hooks/useChat';
import { ChatType } from '@/types/chat';

const CleanerMessages = () => {
  const { user, userRole, cleanerId, loading } = useAuth();
  const { selectedCleanerId } = useAdminCleaner();
  
  // Use selectedCleanerId for admin, otherwise use authenticated cleaner's ID
  const effectiveCleanerId = userRole === 'admin' ? selectedCleanerId : cleanerId;
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
  } = useChat(effectiveCleanerId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading messages...</div>
      </div>
    );
  }

  if (!user || (userRole !== 'user' && userRole !== 'admin') || (userRole === 'user' && !cleanerId)) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole === 'admin' && !selectedCleanerId) {
    // Admin needs to select a cleaner first
  }

  const handleSelectContact = async (contact: any, booking?: any) => {
    const chatToSelect = booking?.chat || contact.chat;
    if (chatToSelect) {
      setActiveChat(chatToSelect);
      await fetchMessages(chatToSelect.id);
    }
  };

  const handleCreateChat = async (contact: any, booking?: any) => {
    if (!effectiveCleanerId) return;

    let chatType: ChatType;
    let customerId: number | undefined;
    let cleanerId: number | undefined;
    let bookingId: number | undefined;

    if (contact.type === 'office') {
      chatType = 'office_cleaner';
      cleanerId = effectiveCleanerId;
    } else if (booking) {
      // Booking-specific chat
      chatType = 'customer_cleaner';
      customerId = contact.customer_id;
      cleanerId = effectiveCleanerId;
      bookingId = booking.bookingId;
    } else {
      // General customer chat (fallback)
      chatType = 'customer_cleaner';
      customerId = contact.customer_id;
      cleanerId = effectiveCleanerId;
    }

    const newChat = await createChat(chatType, customerId, cleanerId, bookingId);
    if (newChat) {
      setActiveChat(newChat);
      await fetchMessages(newChat.id);
    }
  };

  const handleSendMessage = async (message: string, fileUrl?: string) => {
    if (activeChat) {
      await sendMessage(activeChat.id, message, fileUrl);
    }
  };

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Cleaner';

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-background overflow-hidden">
        <CleanerSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 shadow-sm">
            <SidebarTrigger className="-ml-1 p-2" />
            <div className="flex-1" />
            <div className="text-base font-semibold text-foreground truncate">
              {isAdminViewing ? 'Chat Management - Cleaner View' : 'Messages'}
            </div>
          </header>
          
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Admin Cleaner Selector */}
            {isAdminViewing && (
              <div className="p-4 border-b border-border bg-muted/30">
                <AdminCleanerSelector />
              </div>
            )}

            {!effectiveCleanerId && isAdminViewing ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Select a Cleaner
                  </h3>
                  <p className="text-muted-foreground">
                    Choose a cleaner above to view their messages and contacts
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex min-h-0">
                {/* Contacts List */}
                <div className="w-80 flex-shrink-0 h-full overflow-hidden">
                  <CleanerContacts
                    chats={chats}
                    activeChat={activeChat}
                    onSelectContact={handleSelectContact}
                    onCreateChat={handleCreateChat}
                    loading={chatLoading}
                    cleanerId={effectiveCleanerId}
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
                          Select a contact to start messaging with customers or the office
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

export default CleanerMessages;