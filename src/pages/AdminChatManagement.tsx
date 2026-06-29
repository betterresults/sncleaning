import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ChatList from '@/components/chat/ChatList';
import ChatInterface from '@/components/chat/ChatInterface';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, MessageSquare, Trash2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ShellLoading, ShellPage } from '@/layouts/shell';
import type { ChatWithLastMessage } from '@/types/chat';

interface ChatStats {
  totalChats: number;
  activeChats: number;
  customerOfficeChats: number;
  customerCleanerChats: number;
  officeCleanerChats: number;
}

interface RecentMessage {
  id: string;
  message: string;
  created_at: string;
  sender_type: string;
  sender_id: number;
  chats: {
    id: string;
    chat_type: string;
    customer?: { first_name: string; last_name: string } | null;
    cleaner?: { first_name: string; last_name: string } | null;
  };
}

const AdminChatManagement = () => {
  const { loading: authLoading } = useAuth();
  const {
    chats,
    activeChat,
    setActiveChat,
    messages,
    loading: chatLoading,
    sendingMessage,
    fetchMessages,
    sendMessage,
  } = useChat();

  const [activeTab, setActiveTab] = useState('overview');
  const [chatStats, setChatStats] = useState<ChatStats>({
    totalChats: 0,
    activeChats: 0,
    customerOfficeChats: 0,
    customerCleanerChats: 0,
    officeCleanerChats: 0,
  });
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [selectedChatType, setSelectedChatType] = useState<string | null>(null);

  const fetchChatStats = useCallback(async () => {
    try {
      const { data: allChats, error } = await supabase
        .from('chats')
        .select('chat_type, is_active');

      if (error) throw error;

      setChatStats({
        totalChats: allChats?.length || 0,
        activeChats: allChats?.filter((chat) => chat.is_active).length || 0,
        customerOfficeChats:
          allChats?.filter((chat) => chat.chat_type === 'customer_office').length || 0,
        customerCleanerChats:
          allChats?.filter((chat) => chat.chat_type === 'customer_cleaner').length || 0,
        officeCleanerChats:
          allChats?.filter((chat) => chat.chat_type === 'office_cleaner').length || 0,
      });
    } catch (error) {
      console.error('Error fetching chat stats:', error);
    }
  }, []);

  const fetchRecentMessages = useCallback(async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          message,
          created_at,
          sender_type,
          sender_id,
          chats!inner(
            id,
            chat_type,
            customer:customers(first_name, last_name),
            cleaner:cleaners(first_name, last_name)
          )
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentMessages((messagesData as RecentMessage[]) || []);
    } catch (error) {
      console.error('Error fetching recent messages:', error);
    }
  }, []);

  useEffect(() => {
    fetchChatStats();
    fetchRecentMessages();
  }, [fetchChatStats, fetchRecentMessages, chats]);

  const handleSelectChat = async (chat: ChatWithLastMessage) => {
    setActiveChat(chat);
    await fetchMessages(chat.id);
  };

  const handleSendMessage = async (message: string) => {
    if (activeChat) {
      await sendMessage(activeChat.id, message);
    }
  };

  const handleCardClick = (chatType: string) => {
    setSelectedChatType(chatType);
    setActiveTab('management');
  };

  const filteredChats = selectedChatType
    ? selectedChatType === 'all' || selectedChatType === 'active'
      ? chats
      : chats.filter((chat) => chat.chat_type === selectedChatType)
    : chats;

  const managementChats =
    selectedChatType === 'active'
      ? filteredChats.filter((chat) => chat.is_active)
      : filteredChats;

  const getChatTypeDisplay = (chatType: string) => {
    switch (chatType) {
      case 'customer_office':
        return 'Customer ↔ Office';
      case 'customer_cleaner':
        return 'Customer ↔ Cleaner';
      case 'office_cleaner':
        return 'Office ↔ Cleaner';
      default:
        return chatType;
    }
  };

  const getManagementTitle = () => {
    switch (selectedChatType) {
      case 'all':
        return 'All Conversations';
      case 'active':
        return 'Active Conversations';
      case 'customer_office':
        return 'Customer ↔ Office Conversations';
      case 'customer_cleaner':
        return 'Customer ↔ Cleaner Conversations';
      case 'office_cleaner':
        return 'Office ↔ Cleaner Conversations';
      default:
        return 'All Conversations';
    }
  };

  if (authLoading) {
    return <ShellLoading />;
  }

  return (
    <ShellPage width="wide">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversations">Live Conversations</TabsTrigger>
          <TabsTrigger value="management">Chat Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => handleCardClick('all')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chatStats.totalChats}</div>
                <p className="text-xs text-muted-foreground">Click to view all</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => handleCardClick('active')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chatStats.activeChats}</div>
                <p className="text-xs text-muted-foreground">Click to view active</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => handleCardClick('customer_office')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer ↔ Office</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chatStats.customerOfficeChats}</div>
                <p className="text-xs text-muted-foreground">Click to view</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => handleCardClick('customer_cleaner')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer ↔ Cleaner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chatStats.customerCleanerChats}</div>
                <p className="text-xs text-muted-foreground">Click to view</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => handleCardClick('office_cleaner')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Office ↔ Cleaner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chatStats.officeCleanerChats}</div>
                <p className="text-xs text-muted-foreground">Click to view</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMessages.slice(0, 5).map((msg) => (
                  <div
                    key={msg.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50"
                    onClick={() => {
                      const chat = chats.find((c) => c.id === msg.chats.id);
                      if (chat) {
                        handleSelectChat(chat);
                        setActiveTab('conversations');
                      }
                    }}
                  >
                    <div className="flex min-w-0 items-center space-x-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {msg.chats.customer?.first_name} {msg.chats.customer?.last_name}
                          {msg.chats.cleaner &&
                            ` ↔ ${msg.chats.cleaner.first_name} ${msg.chats.cleaner.last_name}`}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          <span className="font-medium">
                            {msg.sender_type === 'customer'
                              ? 'Customer'
                              : msg.sender_type === 'cleaner'
                                ? 'Cleaner'
                                : 'Office'}
                            :
                          </span>{' '}
                          {msg.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{getChatTypeDisplay(msg.chats.chat_type)}</Badge>
                  </div>
                ))}
                {recentMessages.length === 0 && (
                  <p className="py-4 text-center text-muted-foreground">No recent messages</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="h-[calc(100vh-12rem)]">
          <div className="flex h-full space-x-4">
            <div className="w-80 shrink-0 overflow-hidden rounded-lg border border-border">
              <ChatList
                chats={chats}
                activeChat={activeChat}
                onSelectChat={handleSelectChat}
                onCreateChat={() => {}}
                loading={chatLoading}
              />
            </div>

            <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-border">
              {activeChat ? (
                <ChatInterface
                  chat={activeChat}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  sendingMessage={sendingMessage}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-card">
                  <div className="text-center">
                    <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-medium text-foreground">
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Button variant="outline" className="h-20 flex-col">
                  <Eye className="mb-2 h-6 w-6" />
                  View All Chats
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Edit className="mb-2 h-6 w-6" />
                  Moderate Messages
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Trash2 className="mb-2 h-6 w-6" />
                  Archive Chats
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{getManagementTitle()}</CardTitle>
              {selectedChatType && (
                <Button variant="outline" size="sm" onClick={() => setSelectedChatType(null)}>
                  Clear Filter
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {managementChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex min-w-0 items-center space-x-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium">
                          {chat.customer?.first_name} {chat.customer?.last_name}
                          {chat.cleaner &&
                            ` ↔ ${chat.cleaner.first_name} ${chat.cleaner.last_name}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getChatTypeDisplay(chat.chat_type)}
                          {chat.last_message_at &&
                            ` · Last active: ${new Date(chat.last_message_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center space-x-2">
                      <Badge variant={chat.is_active ? 'default' : 'secondary'}>
                        {chat.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => handleSelectChat(chat)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {managementChats.length === 0 && (
                  <p className="py-4 text-center text-muted-foreground">No conversations found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ShellPage>
  );
};

export default AdminChatManagement;
