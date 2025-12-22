import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation, salesAgentNavigation } from '@/lib/navigationItems';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Search, Phone, ArrowLeft, MessageCircle, Check, CheckCheck, Plus, User } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Customer {
  id: number;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

interface SMSConversation {
  id: string;
  phone_number: string;
  customer_id: number | null;
  customer_name: string | null;
  direction: 'incoming' | 'outgoing';
  message: string;
  status: string;
  created_at: string;
  read_at: string | null;
}

interface ConversationThread {
  phone_number: string;
  customer_id: number | null;
  customer_name: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  messages: SMSConversation[];
}

const AdminSMSMessages = () => {
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ConversationThread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [manualPhone, setManualPhone] = useState('');
  const [manualName, setManualName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Search customers for new message
  const searchCustomers = async (term: string) => {
    if (term.length < 2) {
      setCustomers([]);
      return;
    }
    
    setSearchingCustomers(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, first_name, last_name, phone')
        .or(`full_name.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.ilike.%${term}%`)
        .limit(10);
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setSearchingCustomers(false);
    }
  };

  // Debounced customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCustomers(customerSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const handleStartNewConversation = (phone: string, name: string | null, customerId: number | null) => {
    // Check if thread already exists
    const existingThread = threads.find(t => t.phone_number === phone);
    if (existingThread) {
      setSelectedThread(existingThread);
    } else {
      // Create a temporary thread for new conversation
      setSelectedThread({
        phone_number: phone,
        customer_id: customerId,
        customer_name: name,
        last_message: '',
        last_message_at: new Date().toISOString(),
        unread_count: 0,
        messages: [],
      });
    }
    setShowNewMessageDialog(false);
    setCustomerSearch('');
    setManualPhone('');
    setManualName('');
  };

  const handleStartWithManualPhone = () => {
    if (!manualPhone.trim()) return;
    handleStartNewConversation(manualPhone.trim(), manualName.trim() || null, null);
  };

  // Fetch all SMS conversations grouped by phone number
  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_conversations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by phone number
      const grouped = (data || []).reduce((acc: Record<string, ConversationThread>, msg: any) => {
        const conversation: SMSConversation = {
          ...msg,
          direction: msg.direction as 'incoming' | 'outgoing',
        };
        const phone = conversation.phone_number;
        if (!acc[phone]) {
          acc[phone] = {
            phone_number: phone,
            customer_id: conversation.customer_id,
            customer_name: conversation.customer_name,
            last_message: conversation.message,
            last_message_at: conversation.created_at,
            unread_count: 0,
            messages: [],
          };
        }
        acc[phone].messages.push(conversation);
        if (conversation.direction === 'incoming' && !conversation.read_at) {
          acc[phone].unread_count++;
        }
        // Update customer info if available
        if (conversation.customer_name && !acc[phone].customer_name) {
          acc[phone].customer_name = conversation.customer_name;
          acc[phone].customer_id = conversation.customer_id;
        }
        return acc;
      }, {});

      // Sort threads by last message date and reverse messages for display
      const sortedThreads = Object.values(grouped)
        .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
        .map(thread => ({
          ...thread,
          messages: thread.messages.reverse(), // Oldest first for display
        }));

      setThreads(sortedThreads);
      
      // Update selected thread if it exists
      if (selectedThread) {
        const updated = sortedThreads.find(t => t.phone_number === selectedThread.phone_number);
        if (updated) setSelectedThread(updated);
      }
    } catch (error) {
      console.error('Error fetching SMS conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Set up real-time subscription
    const channel = supabase
      .channel('sms-conversations-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sms_conversations' },
        (payload) => {
          console.log('New SMS received:', payload);
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedThread?.messages]);

  // Mark messages as read when opening a thread
  const handleSelectThread = async (thread: ConversationThread) => {
    setSelectedThread(thread);
    
    // Mark incoming messages as read
    const unreadIds = thread.messages
      .filter(m => m.direction === 'incoming' && !m.read_at)
      .map(m => m.id);

    if (unreadIds.length > 0) {
      await supabase
        .from('sms_conversations')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);
      
      fetchConversations();
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms-reply', {
        body: {
          to: selectedThread.phone_number,
          message: newMessage.trim(),
          customer_id: selectedThread.customer_id,
          customer_name: selectedThread.customer_name,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setNewMessage('');
        fetchConversations();
      } else {
        throw new Error(data?.error || 'Failed to send SMS');
      }
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      toast({
        title: 'Failed to send SMS',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday ' + format(date, 'HH:mm');
    }
    return format(date, 'dd/MM/yyyy HH:mm');
  };

  const formatThreadTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'dd/MM');
  };

  const filteredThreads = threads.filter(thread => {
    const search = searchTerm.toLowerCase();
    return (
      thread.phone_number.includes(search) ||
      (thread.customer_name?.toLowerCase().includes(search))
    );
  });

  const getInitials = (name: string | null, phone: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
    return phone.slice(-2);
  };

  if (!user || (userRole !== 'admin' && userRole !== 'sales_agent')) {
    return <Navigate to="/auth" replace />;
  }

  const navigation = userRole === 'sales_agent' ? salesAgentNavigation : adminNavigation;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-gray-50">
        <UnifiedHeader 
          title=""
          user={user}
          userRole={userRole}
          onSignOut={handleSignOut}
        />
        <div className="flex flex-1 w-full">
          <UnifiedSidebar 
            navigationItems={navigation}
            user={user}
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1">
            <main className="flex-1 p-4 max-w-full overflow-x-hidden">
              <div className="max-w-7xl mx-auto h-[calc(100vh-120px)]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                  {/* Conversations List */}
                  <Card className={`lg:col-span-1 flex flex-col ${selectedThread ? 'hidden lg:flex' : 'flex'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <MessageCircle className="h-5 w-5" />
                          SMS Messages
                        </CardTitle>
                        <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Plus className="h-4 w-4 mr-1" />
                              New
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>New SMS Message</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {/* Search existing customers */}
                              <div>
                                <label className="text-sm font-medium mb-2 block">Search Customer</label>
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Search by name or phone..."
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                    className="pl-9"
                                  />
                                </div>
                                {searchingCustomers && (
                                  <div className="flex items-center justify-center py-4">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                  </div>
                                )}
                                {customers.length > 0 && (
                                  <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                                    {customers.map((customer) => (
                                      <button
                                        key={customer.id}
                                        onClick={() => {
                                          if (customer.phone) {
                                            handleStartNewConversation(
                                              customer.phone,
                                              customer.full_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
                                              customer.id
                                            );
                                          } else {
                                            toast({
                                              title: 'No phone number',
                                              description: 'This customer has no phone number on file.',
                                              variant: 'destructive',
                                            });
                                          }
                                        }}
                                        className="w-full p-3 text-left hover:bg-muted/50 flex items-center gap-3 border-b last:border-b-0"
                                      >
                                        <Avatar className="h-8 w-8">
                                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                            {(customer.full_name || customer.first_name || '?')[0].toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm truncate">
                                            {customer.full_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown'}
                                          </p>
                                          {customer.phone && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                              <Phone className="h-3 w-3" />
                                              {customer.phone}
                                            </p>
                                          )}
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Divider */}
                              <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                  <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                  <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
                                </div>
                              </div>

                              {/* Manual phone entry */}
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium mb-2 block">Phone Number</label>
                                  <Input
                                    placeholder="+44..."
                                    value={manualPhone}
                                    onChange={(e) => setManualPhone(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">Name (optional)</label>
                                  <Input
                                    placeholder="Contact name"
                                    value={manualName}
                                    onChange={(e) => setManualName(e.target.value)}
                                  />
                                </div>
                                <Button 
                                  onClick={handleStartWithManualPhone}
                                  disabled={!manualPhone.trim()}
                                  className="w-full"
                                >
                                  Start Conversation
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name or phone..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden">
                      <ScrollArea className="h-full">
                        {loading ? (
                          <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          </div>
                        ) : filteredThreads.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                            <MessageCircle className="h-8 w-8 mb-2" />
                            <p>No SMS conversations yet</p>
                          </div>
                        ) : (
                          <div className="divide-y">
                            {filteredThreads.map((thread) => (
                              <button
                                key={thread.phone_number}
                                onClick={() => handleSelectThread(thread)}
                                className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                                  selectedThread?.phone_number === thread.phone_number ? 'bg-muted' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                      {getInitials(thread.customer_name, thread.phone_number)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="font-medium truncate">
                                        {thread.customer_name || thread.phone_number}
                                      </p>
                                      <span className="text-xs text-muted-foreground">
                                        {formatThreadTime(thread.last_message_at)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <p className="text-sm text-muted-foreground truncate">
                                        {thread.last_message}
                                      </p>
                                      {thread.unread_count > 0 && (
                                        <Badge variant="default" className="ml-2 h-5 min-w-5 rounded-full">
                                          {thread.unread_count}
                                        </Badge>
                                      )}
                                    </div>
                                    {thread.customer_name && (
                                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                        <Phone className="h-3 w-3" />
                                        {thread.phone_number}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Chat Area */}
                  <Card className={`lg:col-span-2 flex flex-col ${!selectedThread ? 'hidden lg:flex' : 'flex'}`}>
                    {selectedThread ? (
                      <>
                        <CardHeader className="pb-3 border-b">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="lg:hidden"
                              onClick={() => setSelectedThread(null)}
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <Avatar>
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(selectedThread.customer_name, selectedThread.phone_number)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">
                                {selectedThread.customer_name || selectedThread.phone_number}
                              </CardTitle>
                              {selectedThread.customer_name && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {selectedThread.phone_number}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                          <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                              {selectedThread.messages.map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                      msg.direction === 'outgoing'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                                    <div className={`flex items-center justify-end gap-1 mt-1 ${
                                      msg.direction === 'outgoing' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                    }`}>
                                      <span className="text-xs">{formatMessageTime(msg.created_at)}</span>
                                      {msg.direction === 'outgoing' && (
                                        msg.status === 'delivered' ? (
                                          <CheckCheck className="h-3.5 w-3.5" />
                                        ) : (
                                          <Check className="h-3.5 w-3.5" />
                                        )
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <div ref={messagesEndRef} />
                            </div>
                          </ScrollArea>
                          <div className="p-4 border-t">
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                              }}
                              className="flex gap-2"
                            >
                              <Input
                                placeholder="Type your message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                disabled={sending}
                              />
                              <Button type="submit" disabled={!newMessage.trim() || sending}>
                                <Send className="h-4 w-4" />
                              </Button>
                            </form>
                          </div>
                        </CardContent>
                      </>
                    ) : (
                      <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Select a conversation to view messages</p>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminSMSMessages;
