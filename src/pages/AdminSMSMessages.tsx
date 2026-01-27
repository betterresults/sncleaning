import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
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
import { Send, Search, Phone, ArrowLeft, MessageCircle, Check, CheckCheck, Plus, User, UserSearch, Calendar, MapPin, Clock, ExternalLink, Mail, Bell, AlertCircle } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

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

interface CustomerLookupResult {
  customer: {
    id: number;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  quoteLead: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    postcode: string | null;
    service_type: string | null;
    frequency: string | null;
    calculated_quote: number | null;
    recommended_hours: number | null;
    selected_date: string | null;
    status: string | null;
    created_at: string | null;
  } | null;
  bookings: Array<{
    id: number;
    service_type: string | null;
    date_time: string | null;
    address: string | null;
    postcode: string | null;
    total_cost: number | null;
    total_hours: number | null;
    booking_status: string | null;
  }>;
  smsConversations: Array<{
    id: string;
    message: string;
    direction: string;
    created_at: string;
    status: string;
  }>;
  emails: Array<{
    id: string;
    subject: string;
    status: string;
    created_at: string;
    notification_type: string;
  }>;
}

// Helper to normalize UK phone numbers for comparison
const normalizeUKPhone = (phone: string): string[] => {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Get last 10 digits (UK numbers without country code)
  const last10 = digitsOnly.slice(-10);
  
  // Return multiple formats to search with
  return [
    last10,                    // 7774706135
    `44${last10}`,            // 447774706135
    `0${last10.slice(1)}`,    // 07774706135 (if starts with 7)
  ];
};

const AdminSMSMessages = () => {
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Customer lookup state
  const [showCustomerLookup, setShowCustomerLookup] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<CustomerLookupResult | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Lookup customer and their bookings by phone number
  const lookupCustomerByPhone = async (phoneNumber: string) => {
    setLookupLoading(true);
    setLookupResult(null);
    
    try {
      // Get multiple phone format variations for UK numbers
      const phoneVariations = normalizeUKPhone(phoneNumber);
      const last10 = phoneVariations[0];
      
      // Find customer by phone - try all variations
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, full_name, first_name, last_name, email, phone')
        .or(`phone.ilike.%${last10}%,whatsapp.ilike.%${last10}%`)
        .limit(1)
        .maybeSingle();
      
      if (customerError) throw customerError;
      
      let bookings: CustomerLookupResult['bookings'] = [];
      let smsConversations: CustomerLookupResult['smsConversations'] = [];
      let emails: CustomerLookupResult['emails'] = [];
      let quoteLead: CustomerLookupResult['quoteLead'] = null;
      
      if (customerData) {
        // Get bookings for this customer
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('id, service_type, date_time, address, postcode, total_cost, total_hours, booking_status')
          .eq('customer', customerData.id)
          .order('date_time', { ascending: false })
          .limit(10);
        
        if (bookingError) throw bookingError;
        bookings = bookingData || [];
        
        // Get emails sent to this customer
        if (customerData.email) {
          const { data: emailData, error: emailError } = await supabase
            .from('notification_logs')
            .select('id, subject, status, created_at, notification_type')
            .eq('recipient_email', customerData.email)
            .order('created_at', { ascending: false })
            .limit(20);
          
          if (!emailError) {
            emails = emailData || [];
          }
        }
      } else {
        // Try to find bookings by phone number directly
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('id, service_type, date_time, address, postcode, total_cost, total_hours, booking_status, first_name, last_name, email')
          .or(`phone_number.ilike.%${last10}%`)
          .order('date_time', { ascending: false })
          .limit(10);
        
        if (bookingError) throw bookingError;
        bookings = bookingData || [];
        
        // Try to get email from booking if found
        if (bookings.length > 0) {
          const bookingEmail = (bookings[0] as any).email;
          if (bookingEmail) {
            const { data: emailData } = await supabase
              .from('notification_logs')
              .select('id, subject, status, created_at, notification_type')
              .eq('recipient_email', bookingEmail)
              .order('created_at', { ascending: false })
              .limit(20);
            
            emails = emailData || [];
          }
        }
      }
      
      // Search quote_leads table - this is where unconverted leads are stored
      const { data: quoteLeadData, error: quoteLeadError } = await supabase
        .from('quote_leads')
        .select('id, first_name, last_name, email, phone, address, postcode, service_type, frequency, calculated_quote, recommended_hours, selected_date, status, created_at')
        .or(`phone.ilike.%${last10}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!quoteLeadError && quoteLeadData) {
        quoteLead = quoteLeadData;
        
        // Also get emails sent to this quote lead's email if not already fetched
        if (emails.length === 0 && quoteLeadData.email) {
          const { data: emailData } = await supabase
            .from('notification_logs')
            .select('id, subject, status, created_at, notification_type')
            .eq('recipient_email', quoteLeadData.email)
            .order('created_at', { ascending: false })
            .limit(20);
          
          emails = emailData || [];
        }
        
        // Also check notification_logs where recipient_email is the phone number (SMS logs)
        const { data: smsNotificationData } = await supabase
          .from('notification_logs')
          .select('id, subject, status, created_at, notification_type')
          .or(`recipient_email.ilike.%${last10}%`)
          .eq('notification_type', 'sms')
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (smsNotificationData && smsNotificationData.length > 0) {
          // Merge SMS notification logs with emails
          emails = [...emails, ...smsNotificationData];
        }
      }
      
      // Get all SMS conversations for this phone number
      const { data: smsData, error: smsError } = await supabase
        .from('sms_conversations')
        .select('id, message, direction, created_at, status')
        .or(`phone_number.ilike.%${last10}%,phone_number.ilike.%44${last10}%`)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!smsError) {
        smsConversations = smsData || [];
      }
      
      setLookupResult({
        customer: customerData,
        quoteLead,
        bookings,
        smsConversations,
        emails,
      });
    } catch (error) {
      console.error('Error looking up customer:', error);
      toast({
        title: 'Lookup failed',
        description: 'Could not find customer information',
        variant: 'destructive',
      });
    } finally {
      setLookupLoading(false);
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

  // Scroll messages to bottom when thread changes - use scrollAreaRef to avoid page scroll
  useEffect(() => {
    if (messagesEndRef.current && scrollAreaRef.current) {
      // Use scrollTop on the container instead of scrollIntoView to prevent page scroll
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [selectedThread?.messages]);

  // Mark messages as read by phone number
  const markMessagesAsRead = async (phoneNumber: string) => {
    const thread = threads.find(t => t.phone_number === phoneNumber);
    if (!thread) return;
    
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

  // Mark messages as read when opening a thread
  const handleSelectThread = async (thread: ConversationThread) => {
    setSelectedThread(thread);
    await markMessagesAsRead(thread.phone_number);
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
      <div className="h-screen flex flex-col w-full bg-gray-50 overflow-hidden">
        <UnifiedHeader 
          title=""
          user={user}
          userRole={userRole}
          onSignOut={handleSignOut}
        />
        <div className="flex flex-1 w-full overflow-hidden">
          <UnifiedSidebar 
            navigationItems={navigation}
            user={user}
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1 overflow-hidden">
            <main className="h-full p-4 max-w-full overflow-hidden flex flex-col">
              <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0">
                {/* Unread Messages Alert Banner */}
                {(() => {
                  const totalUnread = threads.reduce((sum, t) => sum + t.unread_count, 0);
                  if (totalUnread === 0) return null;
                  
                  return (
                    <div className="mb-4 bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary rounded-full p-2">
                          <Bell className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-primary">
                            {totalUnread} new message{totalUnread !== 1 ? 's' : ''} waiting for response
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {threads.filter(t => t.unread_count > 0).length} conversation{threads.filter(t => t.unread_count > 0).length !== 1 ? 's' : ''} with unread messages
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => {
                          // Find first thread with unread messages
                          const unreadThread = threads.find(t => t.unread_count > 0);
                          if (unreadThread) {
                            setSelectedThread(unreadThread);
                            markMessagesAsRead(unreadThread.phone_number);
                          }
                        }}
                      >
                        View Messages
                      </Button>
                    </div>
                  );
                })()}
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
                  {/* Conversations List */}
                  <Card className={`lg:col-span-1 flex flex-col overflow-hidden ${selectedThread ? 'hidden lg:flex' : 'flex'}`}>
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
                  <Card className={`lg:col-span-2 flex flex-col overflow-hidden ${!selectedThread ? 'hidden lg:flex' : 'flex'}`}>
                    {selectedThread ? (
                      <>
                        <CardHeader className="pb-3 border-b flex-shrink-0">
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
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg truncate">
                                {selectedThread.customer_name || selectedThread.phone_number}
                              </CardTitle>
                              {selectedThread.customer_name && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {selectedThread.phone_number}
                                </p>
                              )}
                            </div>
                            
                            {/* Customer Lookup Button */}
                            <Sheet open={showCustomerLookup} onOpenChange={(open) => {
                              setShowCustomerLookup(open);
                              if (open && selectedThread) {
                                lookupCustomerByPhone(selectedThread.phone_number);
                              }
                            }}>
                              <SheetTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <UserSearch className="h-4 w-4" />
                                  <span className="hidden sm:inline">Lookup</span>
                                </Button>
                              </SheetTrigger>
                              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                                <SheetHeader>
                                  <SheetTitle className="flex items-center gap-2">
                                    <UserSearch className="h-5 w-5" />
                                    Customer Lookup
                                  </SheetTitle>
                                </SheetHeader>
                                
                                <div className="mt-6 space-y-6">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    <span className="font-mono">{selectedThread.phone_number}</span>
                                  </div>
                                  
                                  {lookupLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                  ) : lookupResult ? (
                                    <div className="space-y-6">
                                      {/* Customer Info */}
                                      {lookupResult.customer ? (
                                        <div className="p-4 rounded-lg border bg-muted/30">
                                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Customer Found
                                          </h4>
                                          <div className="space-y-2 text-sm">
                                            <p><strong>Name:</strong> {lookupResult.customer.full_name || `${lookupResult.customer.first_name || ''} ${lookupResult.customer.last_name || ''}`.trim() || 'N/A'}</p>
                                            <p><strong>Email:</strong> {lookupResult.customer.email || 'N/A'}</p>
                                            <p><strong>Phone:</strong> {lookupResult.customer.phone || 'N/A'}</p>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="mt-2"
                                              onClick={() => navigate(`/admin-customers?id=${lookupResult.customer?.id}`)}
                                            >
                                              <ExternalLink className="h-3 w-3 mr-1" />
                                              View Customer
                                            </Button>
                                          </div>
                                        </div>
                                      ) : lookupResult.quoteLead ? (
                                        <div className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                            <User className="h-4 w-4" />
                                            Quote Lead Found
                                          </h4>
                                          <div className="space-y-2 text-sm">
                                            <p><strong>Name:</strong> {`${lookupResult.quoteLead.first_name || ''} ${lookupResult.quoteLead.last_name || ''}`.trim() || 'N/A'}</p>
                                            <p><strong>Email:</strong> {lookupResult.quoteLead.email || 'N/A'}</p>
                                            <p><strong>Phone:</strong> {lookupResult.quoteLead.phone || 'N/A'}</p>
                                            {lookupResult.quoteLead.address && (
                                              <p><strong>Address:</strong> {lookupResult.quoteLead.address}, {lookupResult.quoteLead.postcode}</p>
                                            )}
                                            <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                                              <p className="text-xs text-muted-foreground mb-2">Quote Details</p>
                                              <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                  <p className="text-xs text-muted-foreground">Service</p>
                                                  <p className="font-medium">{lookupResult.quoteLead.service_type || 'N/A'}</p>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-muted-foreground">Frequency</p>
                                                  <p className="font-medium">{lookupResult.quoteLead.frequency || 'N/A'}</p>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-muted-foreground">Hours</p>
                                                  <p className="font-medium">{lookupResult.quoteLead.recommended_hours || 'N/A'}h</p>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-muted-foreground">Quote</p>
                                                  <p className="font-medium text-green-600 dark:text-green-400">
                                                    £{lookupResult.quoteLead.calculated_quote?.toFixed(2) || 'N/A'}
                                                  </p>
                                                </div>
                                              </div>
                                              {lookupResult.quoteLead.selected_date && (
                                                <p className="mt-2 text-sm">
                                                  <strong>Preferred Date:</strong> {format(new Date(lookupResult.quoteLead.selected_date), 'EEE, dd MMM yyyy')}
                                                </p>
                                              )}
                                              <div className="flex items-center gap-2 mt-2">
                                                <Badge variant={lookupResult.quoteLead.status === 'converted' ? 'default' : 'secondary'}>
                                                  {lookupResult.quoteLead.status || 'pending'}
                                                </Badge>
                                                {lookupResult.quoteLead.created_at && (
                                                  <span className="text-xs text-muted-foreground">
                                                    Created {format(new Date(lookupResult.quoteLead.created_at), 'dd MMM yyyy')}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="mt-2"
                                              onClick={() => navigate(`/admin-dashboard?tab=leads`)}
                                            >
                                              <ExternalLink className="h-3 w-3 mr-1" />
                                              View Quote Leads
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="p-4 rounded-lg border border-dashed bg-muted/20">
                                          <p className="text-sm text-muted-foreground text-center">
                                            No customer or quote lead found with this phone number
                                          </p>
                                        </div>
                                      )}
                                      
                                      {/* Bookings */}
                                      <div>
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                          <Calendar className="h-4 w-4" />
                                          Booking History ({lookupResult.bookings.length})
                                        </h4>
                                        
                                        {lookupResult.bookings.length > 0 ? (
                                          <div className="space-y-3">
                                            {lookupResult.bookings.map((booking) => (
                                              <div key={booking.id} className="p-3 rounded-lg border bg-card">
                                                <div className="flex items-start justify-between gap-2">
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                      <Badge variant={
                                                        booking.booking_status === 'completed' ? 'default' :
                                                        booking.booking_status === 'active' ? 'secondary' :
                                                        'outline'
                                                      }>
                                                        {booking.booking_status || 'Unknown'}
                                                      </Badge>
                                                      <span className="font-medium text-sm">
                                                        {booking.service_type || 'Cleaning'}
                                                      </span>
                                                    </div>
                                                    
                                                    {booking.date_time && (
                                                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(booking.date_time), 'EEE, dd MMM yyyy HH:mm')}
                                                      </p>
                                                    )}
                                                    
                                                    {(booking.address || booking.postcode) && (
                                                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {[booking.address, booking.postcode].filter(Boolean).join(', ')}
                                                      </p>
                                                    )}
                                                    
                                                    <div className="flex items-center gap-4 mt-2 text-sm">
                                                      {booking.total_hours && (
                                                        <span>{booking.total_hours}h</span>
                                                      )}
                                                      {booking.total_cost && (
                                                        <span className="font-medium">£{booking.total_cost}</span>
                                                      )}
                                                    </div>
                                                  </div>
                                                  
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="shrink-0"
                                                    onClick={() => navigate(`/admin-bookings?booking=${booking.id}`)}
                                                  >
                                                    <ExternalLink className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="p-4 rounded-lg border border-dashed bg-muted/20">
                                            <p className="text-sm text-muted-foreground text-center">
                                              No bookings found for this number
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* SMS Conversations */}
                                      <div>
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                          <MessageCircle className="h-4 w-4" />
                                          SMS History ({lookupResult.smsConversations.length})
                                        </h4>
                                        
                                        {lookupResult.smsConversations.length > 0 ? (
                                          <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {lookupResult.smsConversations.map((sms) => (
                                              <div 
                                                key={sms.id} 
                                                className={`p-2 rounded-lg text-sm ${
                                                  sms.direction === 'outgoing' 
                                                    ? 'bg-primary/10 ml-4' 
                                                    : 'bg-muted mr-4'
                                                }`}
                                              >
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                  <span className="font-medium">
                                                    {sms.direction === 'outgoing' ? 'Sent' : 'Received'}
                                                  </span>
                                                  <span>•</span>
                                                  <span>{format(new Date(sms.created_at), 'dd MMM yyyy HH:mm')}</span>
                                                  {sms.direction === 'outgoing' && (
                                                    <>
                                                      <span>•</span>
                                                      <span className={sms.status === 'delivered' ? 'text-green-600' : ''}>
                                                        {sms.status}
                                                      </span>
                                                    </>
                                                  )}
                                                </div>
                                                <p className="whitespace-pre-wrap break-words">{sms.message}</p>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="p-4 rounded-lg border border-dashed bg-muted/20">
                                            <p className="text-sm text-muted-foreground text-center">
                                              No SMS history found
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Email History */}
                                      <div>
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                          <Mail className="h-4 w-4" />
                                          Email History ({lookupResult.emails.length})
                                        </h4>
                                        
                                        {lookupResult.emails.length > 0 ? (
                                          <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {lookupResult.emails.map((email) => (
                                              <div key={email.id} className="p-3 rounded-lg border bg-card">
                                                <div className="flex items-start justify-between gap-2">
                                                  <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{email.subject}</p>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                      <span>{format(new Date(email.created_at), 'dd MMM yyyy HH:mm')}</span>
                                                      <span>•</span>
                                                      <Badge variant={
                                                        email.status === 'sent' || email.status === 'delivered' ? 'default' :
                                                        email.status === 'failed' ? 'destructive' :
                                                        'secondary'
                                                      } className="text-xs">
                                                        {email.status}
                                                      </Badge>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="p-4 rounded-lg border border-dashed bg-muted/20">
                                            <p className="text-sm text-muted-foreground text-center">
                                              No email history found
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              </SheetContent>
                            </Sheet>
                          </div>
                        </CardHeader>
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                          <ScrollArea className="flex-1" ref={scrollAreaRef}>
                            <div className="p-4 space-y-4">
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
                          <div className="p-4 border-t flex-shrink-0 bg-background">
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
                        </div>
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
