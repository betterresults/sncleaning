import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Building2, User, Calendar, MapPin, MessageCircle, Plus, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { ChatWithLastMessage } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface BookingContact {
  id: string;
  bookingId: number;
  serviceType: string;
  dateTime: string;
  address: string;
  postcode: string;
  chat?: ChatWithLastMessage;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface Contact {
  id: string;
  name: string;
  type: 'office' | 'customer';
  customer_id?: number;
  bookings?: BookingContact[];
  chat?: ChatWithLastMessage;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isExpanded?: boolean;
  showAll?: boolean;
}

interface WhatsAppContactListProps {
  chats: ChatWithLastMessage[];
  onSelectContact: (contact: Contact, booking?: BookingContact) => void;
  onCreateChat: (contact: Contact, booking?: BookingContact) => void;
  onSwitchToMessages: () => void;
  loading: boolean;
  cleanerId?: number;
}

const WhatsAppContactList = ({ 
  chats, 
  onSelectContact, 
  onCreateChat, 
  onSwitchToMessages, 
  loading,
  cleanerId: selectedCleanerId 
}: WhatsAppContactListProps) => {
  const { userRole, cleanerId } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const effectiveCleanerId = userRole === 'admin' ? selectedCleanerId : cleanerId;

  const fetchContacts = async () => {
    if (!effectiveCleanerId) return;

    setLoadingContacts(true);
    try {
      // Get customers and their bookings
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          customer,
          service_type,
          cleaning_type,
          date_time,
          address,
          postcode,
          customers!inner(id, first_name, last_name, email)
        `)
        .eq('cleaner', effectiveCleanerId)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true });

      if (error) throw error;

      // Create office contact
      const officeContact: Contact = {
        id: 'office',
        name: 'SN Cleaning Office',
        type: 'office'
      };

      // Group bookings by customer
      const customerBookingsMap = new Map();
      bookings?.forEach(booking => {
        if (booking.customers) {
          const customerId = booking.customer;
          if (!customerBookingsMap.has(customerId)) {
            customerBookingsMap.set(customerId, {
              customer: booking.customers,
              bookings: []
            });
          }
          customerBookingsMap.get(customerId).bookings.push(booking);
        }
      });

      const customerContacts = Array.from(customerBookingsMap.values()).map(({ customer, bookings: customerBookings }) => {
        // Create booking contacts for this customer
        const bookingContacts: BookingContact[] = customerBookings.map((booking: any) => {
          const bookingChat = chats.find(chat => 
            chat.chat_type === 'customer_cleaner' && 
            chat.customer_id === customer.id &&
            chat.booking_id === booking.id
          );

          return {
            id: `booking-${booking.id}`,
            bookingId: booking.id,
            serviceType: booking.service_type || booking.cleaning_type || 'Cleaning',
            dateTime: booking.date_time,
            address: booking.address,
            postcode: booking.postcode,
            chat: bookingChat,
            lastMessage: bookingChat?.last_message?.message,
            lastMessageTime: bookingChat?.last_message_at,
            unreadCount: bookingChat?.unread_count || 0
          };
        });

        return {
          id: `customer-${customer.id}`,
          name: `${customer.first_name} ${customer.last_name}`,
          type: 'customer' as const,
          customer_id: customer.id,
          bookings: bookingContacts,
          isExpanded: false, // Default to collapsed
          showAll: false,
          unreadCount: bookingContacts.reduce((sum, booking) => 
            sum + (booking.unreadCount || 0), 0
          ),
          lastMessage: bookingContacts.find(b => b.lastMessage)?.lastMessage,
          lastMessageTime: bookingContacts.reduce((latest, booking) => {
            if (!booking.lastMessageTime) return latest;
            if (!latest) return booking.lastMessageTime;
            return new Date(booking.lastMessageTime) > new Date(latest) ? booking.lastMessageTime : latest;
          }, undefined as string | undefined)
        };
      });

      // Match office contact with existing chat
      const officeChat = chats.find(chat => chat.chat_type === 'office_cleaner');
      if (officeChat) {
        officeContact.chat = officeChat;
        officeContact.lastMessage = officeChat.last_message?.message;
        officeContact.lastMessageTime = officeChat.last_message_at;
        officeContact.unreadCount = officeChat.unread_count || 0;
      }

      const allContacts = [officeContact, ...customerContacts];
      setContacts(allContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [effectiveCleanerId, chats]);

  const handleContactClick = (contact: Contact, booking?: BookingContact) => {
    // If it's a customer contact without a specific booking, toggle expansion
    if (contact.type === 'customer' && !booking) {
      setContacts(prev => prev.map(c => 
        c.id === contact.id 
          ? { ...c, isExpanded: !c.isExpanded }
          : c
      ));
      return;
    }

    // Handle office or booking contact
    if (booking?.chat || contact.chat) {
      onSelectContact(contact, booking);
    } else {
      onCreateChat(contact, booking);
    }
  };

  const handleShowMore = (contactId: string) => {
    setContacts(prev => prev.map(c => 
      c.id === contactId 
        ? { ...c, showAll: !c.showAll }
        : c
    ));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading || loadingContacts) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading contacts...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Tabs */}
      <div className="flex items-center border-b border-border bg-card">
        <Button
          variant="ghost"
          onClick={onSwitchToMessages}
          className="flex-1 h-12 rounded-none border-b-2 border-transparent hover:border-muted-foreground/20"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Messages
        </Button>
        <Button
          variant="ghost"
          className="flex-1 h-12 rounded-none border-b-2 border-primary bg-primary/5"
        >
          <Users className="h-4 w-4 mr-2" />
          Contacts
        </Button>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageCircle className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No contacts available</h3>
            <p className="text-muted-foreground">You'll see your assigned customers here</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {contacts.map((contact) => (
              <div key={contact.id}>
                {/* Main Contact */}
                <div
                  onClick={() => handleContactClick(contact)}
                  className="flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/50"
                >
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary border border-primary/20">
                      {contact.type === 'office' ? (
                        <Building2 className="h-5 w-5" />
                      ) : (
                        getInitials(contact.name)
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground truncate">
                          {contact.name}
                        </h3>
                        {/* Chevron for customers with bookings */}
                        {contact.type === 'customer' && contact.bookings && contact.bookings.length > 0 && (
                          <div className="flex items-center">
                            {contact.isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.type === 'office' && !contact.chat && (
                          <Badge variant="outline" className="text-xs">
                            <Plus className="h-3 w-3 mr-1" />
                            Start Chat
                          </Badge>
                        )}
                        {contact.chat && (
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate">
                      {contact.type === 'office' 
                        ? 'SN Cleaning Support Team'
                        : contact.isExpanded 
                          ? 'Tap a booking to start chat'
                          : `${contact.bookings?.length || 0} upcoming booking${contact.bookings?.length !== 1 ? 's' : ''} - Tap to expand`
                      }
                    </p>
                  </div>
                </div>

                {/* Customer Bookings - Only show when expanded */}
                {contact.type === 'customer' && contact.isExpanded && contact.bookings && contact.bookings.length > 0 && (
                  <div className="pl-8 border-l-2 border-muted ml-8">
                    {contact.bookings.slice(0, contact.showAll ? undefined : 3).map((booking) => (
                      <div
                        key={booking.id}
                        onClick={() => handleContactClick(contact, booking)}
                        className="flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/30 border-b border-muted/50 last:border-b-0"
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            <Calendar className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm text-foreground truncate">
                              {booking.serviceType}
                            </h4>
                            <div className="flex items-center gap-2">
                              {!booking.chat && (
                                <Badge variant="outline" className="text-xs">
                                  <Plus className="h-3 w-3 mr-1" />
                                  Start
                                </Badge>
                              )}
                              {booking.chat && booking.unreadCount && booking.unreadCount > 0 && (
                                <Badge variant="default" className="bg-primary text-primary-foreground h-4 min-w-4 text-xs">
                                  {booking.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(booking.dateTime).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{booking.postcode}</span>
                            </div>
                          </div>
                          
                          {booking.lastMessage && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {booking.lastMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Show More Button */}
                    {contact.bookings.length > 3 && (
                      <div className="p-3 border-b border-muted/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowMore(contact.id);
                          }}
                          className="text-xs h-8 w-full"
                        >
                          {contact.showAll 
                            ? `Show Less` 
                            : `Show ${contact.bookings.length - 3} More Booking${contact.bookings.length - 3 !== 1 ? 's' : ''}`
                          }
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default WhatsAppContactList;