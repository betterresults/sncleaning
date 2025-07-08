import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { CleanerSidebar } from '@/components/CleanerSidebar';
import WhatsAppMessageList from '@/components/chat/WhatsAppMessageList';
import WhatsAppContactList from '@/components/chat/WhatsAppContactList';
import ChatInterface from '@/components/chat/ChatInterface';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';
import { MessageCircle, Users, ArrowLeft } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { ChatType } from '@/types/chat';

const CleanerMessages = () => {
  const { user, userRole, cleanerId, loading } = useAuth();
  const { selectedCleanerId } = useAdminCleaner();
  const [currentView, setCurrentView] = useState<'messages' | 'contacts' | 'chat'>('messages');
  
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

  const handleSelectChat = async (chat: any) => {
    setActiveChat(chat);
    await fetchMessages(chat.id);
    setCurrentView('chat');
  };

  const handleSelectContact = async (contact: any, booking?: any) => {
    const chatToSelect = booking?.chat || contact.chat;
    if (chatToSelect) {
      setActiveChat(chatToSelect);
      await fetchMessages(chatToSelect.id);
      setCurrentView('chat');
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
      setCurrentView('chat');
    }
  };

  const handleSendMessage = async (message: string, fileUrl?: string) => {
    if (activeChat) {
      await sendMessage(activeChat.id, message, fileUrl);
    }
  };

  const handleBackToMessages = () => {
    setCurrentView('messages');
    setActiveChat(null);
  };

  const handleBackToContacts = () => {
    setCurrentView('contacts');
  };

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-background overflow-hidden">
        <CleanerSidebar />
        <SidebarInset className="flex-1">
          {/* Header with navigation */}
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 shadow-sm">
            <SidebarTrigger className="-ml-1 p-2" />
            
            {/* Back button for chat and contacts view */}
            {currentView === 'chat' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToMessages}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            {currentView === 'contacts' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToMessages}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div className="flex-1" />
            
            {/* Header actions */}
            {currentView === 'messages' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('contacts')}
                className="p-2"
              >
                <Users className="h-4 w-4" />
              </Button>
            )}
            
            <div className="text-sm sm:text-base font-semibold text-foreground truncate">
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
              <div className="flex-1 overflow-hidden">
                {/* Mobile WhatsApp-like views */}
                <div className="h-full sm:hidden">
                  {currentView === 'messages' && (
                    <WhatsAppMessageList
                      chats={chats}
                      activeChat={activeChat}
                      onSelectChat={handleSelectChat}
                      loading={chatLoading}
                    />
                  )}
                  
                  {currentView === 'contacts' && (
                    <WhatsAppContactList
                      chats={chats}
                      onSelectContact={handleSelectContact}
                      onCreateChat={handleCreateChat}
                      onBack={handleBackToMessages}
                      loading={chatLoading}
                      cleanerId={effectiveCleanerId}
                    />
                  )}
                  
                  {currentView === 'chat' && activeChat && (
                    <ChatInterface
                      chat={activeChat}
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      sendingMessage={sendingMessage}
                    />
                  )}
                </div>

                {/* Desktop: Split view */}
                <div className="hidden sm:flex h-full">
                  {/* Message List */}
                  <div className="w-80 flex-shrink-0 h-full border-r border-border">
                    <WhatsAppMessageList
                      chats={chats}
                      activeChat={activeChat}
                      onSelectChat={handleSelectChat}
                      loading={chatLoading}
                    />
                  </div>

                  {/* Chat Interface or Welcome */}
                  <div className="flex-1 h-full">
                    {activeChat ? (
                      <ChatInterface
                        chat={activeChat}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        sendingMessage={sendingMessage}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full bg-card p-8 text-center">
                        <MessageCircle className="h-16 w-16 text-muted-foreground/40 mb-4" />
                        <h3 className="text-xl font-medium text-foreground mb-2">
                          Welcome to Messages
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Select a conversation to start messaging
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentView('contacts')}
                          className="hidden sm:inline-flex"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Browse Contacts
                        </Button>
                      </div>
                    )}
                  </div>
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