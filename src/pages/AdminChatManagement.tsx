import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import ChatList from '@/components/chat/ChatList';
import ChatInterface from '@/components/chat/ChatInterface';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, MessageSquare, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminChatManagement = () => {
  const { user, userRole, loading } = useAuth();
  const {
    chats,
    activeChat,
    setActiveChat,
    messages,
    loading: chatLoading,
    sendingMessage,
    fetchMessages,
    sendMessage,
    fetchChats
  } = useChat();

  const [chatStats, setChatStats] = useState({
    totalChats: 0,
    activeChats: 0,
    customerOfficeChats: 0,
    customerCleanerChats: 0,
    officeCleanerChats: 0
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading chat management...</div>
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
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

  const fetchChatStats = async () => {
    try {
      const { data: allChats, error } = await supabase
        .from('chats')
        .select('chat_type, is_active');

      if (error) throw error;

      const stats = {
        totalChats: allChats?.length || 0,
        activeChats: allChats?.filter(chat => chat.is_active).length || 0,
        customerOfficeChats: allChats?.filter(chat => chat.chat_type === 'customer_office').length || 0,
        customerCleanerChats: allChats?.filter(chat => chat.chat_type === 'customer_cleaner').length || 0,
        officeCleanerChats: allChats?.filter(chat => chat.chat_type === 'office_cleaner').length || 0
      };

      setChatStats(stats);
    } catch (error) {
      console.error('Error fetching chat stats:', error);
    }
  };

  useEffect(() => {
    fetchChatStats();
  }, [chats]);

  const getChatTypeDisplay = (chatType: string) => {
    switch (chatType) {
      case 'customer_office': return 'Customer ↔ Office';
      case 'customer_cleaner': return 'Customer ↔ Cleaner';
      case 'office_cleaner': return 'Office ↔ Cleaner';
      default: return chatType;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 shadow-sm">
            <SidebarTrigger className="-ml-1 p-2" />
            <div className="flex-1" />
            <div className="text-base font-semibold text-foreground truncate">
              Chat Management
            </div>
          </header>
          
          <main className="flex-1 p-4">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="conversations">Live Conversations</TabsTrigger>
                <TabsTrigger value="management">Chat Management</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{chatStats.totalChats}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{chatStats.activeChats}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Customer ↔ Office</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{chatStats.customerOfficeChats}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Customer ↔ Cleaner</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{chatStats.customerCleanerChats}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Office ↔ Cleaner</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{chatStats.officeCleanerChats}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {chats.slice(0, 5).map((chat) => (
                        <div key={chat.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <MessageSquare className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {chat.customer?.first_name} {chat.customer?.last_name}
                                {chat.cleaner && ` ↔ ${chat.cleaner.first_name} ${chat.cleaner.last_name}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {getChatTypeDisplay(chat.chat_type)}
                              </p>
                            </div>
                          </div>
                          <Badge variant={chat.is_active ? "default" : "secondary"}>
                            {chat.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="conversations" className="h-[calc(100vh-12rem)]">
                <div className="flex h-full space-x-4">
                  <div className="w-80 flex-shrink-0">
                    <ChatList
                      chats={chats}
                      activeChat={activeChat}
                      onSelectChat={handleSelectChat}
                      onCreateChat={() => {}} // Admins don't create chats directly
                      loading={chatLoading}
                    />
                  </div>

                  <div className="flex-1">
                    {activeChat ? (
                      <ChatInterface
                        chat={activeChat}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        sendingMessage={sendingMessage}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-card rounded-lg">
                        <div className="text-center">
                          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">
                            Select a conversation
                          </h3>
                          <p className="text-muted-foreground">
                            Choose a chat from the list to view and participate in the conversation
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="management" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Chat Management Tools</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button variant="outline" className="h-20 flex-col">
                        <Eye className="h-6 w-6 mb-2" />
                        View All Chats
                      </Button>
                      <Button variant="outline" className="h-20 flex-col">
                        <Edit className="h-6 w-6 mb-2" />
                        Moderate Messages
                      </Button>
                      <Button variant="outline" className="h-20 flex-col">
                        <Trash2 className="h-6 w-6 mb-2" />
                        Archive Chats
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>All Conversations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {chats.map((chat) => (
                        <div key={chat.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <MessageSquare className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {chat.customer?.first_name} {chat.customer?.last_name}
                                {chat.cleaner && ` ↔ ${chat.cleaner.first_name} ${chat.cleaner.last_name}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {getChatTypeDisplay(chat.chat_type)} • 
                                {chat.last_message_at && ` Last active: ${new Date(chat.last_message_at).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={chat.is_active ? "default" : "secondary"}>
                              {chat.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectChat(chat)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminChatManagement;