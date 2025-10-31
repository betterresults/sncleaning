import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { cleanerNavigation } from '@/lib/navigationItems';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';
import CleanerContacts from '@/components/chat/CleanerContacts';
import ChatInterface from '@/components/chat/ChatInterface';
import { useChat } from '@/hooks/useChat';
import { ChatType } from '@/types/chat';

const CleanerMessages = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();
  const { selectedCleanerId } = useAdminCleaner();
  
  // Use selected cleaner ID if admin is viewing, otherwise use authenticated cleaner's ID
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
  } = useChat(effectiveCleanerId, undefined);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSelectContact = async (contact: any, booking?: any) => {
    if (contact.chat) {
      setActiveChat(contact.chat);
      await fetchMessages(contact.chat.id);
    }
  };

  const handleCreateChat = async (contact: any, booking?: any) => {
    const chatType: ChatType = 'office_cleaner';
    
    const newChat = await createChat(
      chatType,
      undefined, // customerId
      effectiveCleanerId, // cleanerId
      booking?.id || undefined // bookingId
    );
    
    if (newChat) {
      setActiveChat(newChat);
    }
  };

  const handleSendMessage = async (message: string, fileUrl?: string) => {
    if (!activeChat || !effectiveCleanerId) return;
    
    await sendMessage(activeChat.id, message, fileUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading messages...</div>
      </div>
    );
  }

  // Allow users with role 'user' who have a cleanerId, or admins
  if (!user || (userRole !== 'user' && userRole !== 'admin') || (userRole === 'user' && !cleanerId)) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <UnifiedSidebar 
          navigationItems={cleanerNavigation}
          user={user}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1">
          <UnifiedHeader 
            title="Messages 💬"
            user={user}
            userRole={userRole}
            showBackToAdmin={userRole === 'admin'}
          />
          
          <main className="flex-1 overflow-hidden">
            <div className="h-full max-w-7xl mx-auto p-4">
              {userRole === 'admin' && (
                <div className="mb-4">
                  <AdminCleanerSelector />
                </div>
              )}
              
              {effectiveCleanerId ? (
                <div className="flex h-[calc(100vh-8rem)] bg-card border border-border rounded-lg overflow-hidden">
                  {/* Contacts Sidebar */}
                  <div className="w-80 border-r border-border">
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
                  <div className="flex-1">
                    {activeChat ? (
                      <ChatInterface
                        chat={activeChat}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        sendingMessage={sendingMessage}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-center">
                        <div>
                          <h3 className="text-lg font-medium text-foreground mb-2">
                            Select a conversation
                          </h3>
                          <p className="text-muted-foreground">
                            Choose a chat from the sidebar to start messaging
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-center">
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No Cleaner Selected
                    </h3>
                    <p className="text-muted-foreground">
                      {isAdminViewing ? 'Please select a cleaner to view messages' : 'Unable to load cleaner information'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CleanerMessages;