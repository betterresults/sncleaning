import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import CustomerSidebar from '@/components/CustomerSidebar';
import ChatList from '@/components/chat/ChatList';
import ChatInterface from '@/components/chat/ChatInterface';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChatType } from '@/types/chat';

const CustomerMessages = () => {
  const { user, userRole, customerId, loading } = useAuth();
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
  } = useChat();

  const [createChatDialogOpen, setCreateChatDialogOpen] = useState(false);
  const [newChatType, setNewChatType] = useState<ChatType>('customer_office');

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

  const handleSelectChat = async (chat: any) => {
    setActiveChat(chat);
    await fetchMessages(chat.id);
  };

  const handleSendMessage = async (message: string) => {
    if (activeChat) {
      await sendMessage(activeChat.id, message);
    }
  };

  const handleCreateChat = async () => {
    if (!customerId) return;

    if (newChatType === 'customer_office') {
      await createChat('customer_office', customerId);
    }
    // For customer_cleaner chats, we'll need to select a cleaner from upcoming bookings
    // This will be implemented when we add the booking-specific chat functionality

    setCreateChatDialogOpen(false);
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
              Messages
            </div>
          </header>
          
          <main className="flex-1 flex h-[calc(100vh-3.5rem)]">
            {/* Chat List */}
            <div className="w-80 flex-shrink-0">
              <ChatList
                chats={chats}
                activeChat={activeChat}
                onSelectChat={handleSelectChat}
                onCreateChat={() => setCreateChatDialogOpen(true)}
                loading={chatLoading}
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
                <div className="flex items-center justify-center h-full bg-card">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Welcome to Messages, {firstName}!
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Select a conversation or start a new one to get help with your bookings
                    </p>
                    <Button onClick={() => setCreateChatDialogOpen(true)}>
                      Start New Conversation
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>

      {/* Create Chat Dialog */}
      <Dialog open={createChatDialogOpen} onOpenChange={setCreateChatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Chat with:</label>
              <Select value={newChatType} onValueChange={(value: ChatType) => setNewChatType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer_office">SN Cleaning Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCreateChatDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateChat}>
                Start Chat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default CustomerMessages;