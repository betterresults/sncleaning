import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Building2, User, ChevronDown, ChevronRight, Calendar, MapPin } from 'lucide-react';
import { ChatWithLastMessage } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
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
  showAll?: boolean;
  isExpanded?: boolean;
}

interface CleanerContactsProps {
  chats: ChatWithLastMessage[];
  activeChat: ChatWithLastMessage | null;
  onSelectContact: (contact: Contact, booking?: BookingContact) => void;
  onCreateChat: (contact: Contact, booking?: BookingContact) => void;
  loading: boolean;
  cleanerId?: number; // For admin viewing
}

const CleanerContacts = ({ 
  chats, 
  activeChat, 
  onSelectContact, 
  onCreateChat, 
  loading,
  cleanerId: selectedCleanerId 
}: CleanerContactsProps) => {
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
          isExpanded: false
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
    if (contact.type === 'customer' && !booking) {
      // Toggle customer expansion
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

  if (loading || loadingContacts) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading contacts...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Contacts</h2>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No contacts yet</h3>
            <p className="text-muted-foreground">You'll see your assigned customers here</p>
          </div>
        ) : (
          <div className="p-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="space-y-1">
                {/* Main Contact Item */}
                <div
                  onClick={() => handleContactClick(contact)}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    contact.type === 'office' && activeChat?.id === contact.chat?.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    {contact.type === 'office' ? (
                      <Building2 className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-foreground truncate">
                          {contact.name}
                        </h4>
                        {contact.type === 'customer' && (
                          <div className="flex items-center">
                            {contact.isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Badge variant="outline" className="ml-1 text-xs">
                              {contact.bookings?.length || 0}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {contact.lastMessageTime && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(contact.lastMessageTime), { addSuffix: true })}
                          </span>
                        )}
                        {contact.unreadCount && contact.unreadCount > 0 && (
                          <Badge variant="destructive">
                            {contact.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">
                        {contact.type === 'customer' 
                          ? `${contact.bookings?.length || 0} bookings`
                          : contact.lastMessage || (contact.chat ? 'Tap to continue' : 'Tap to start chat')
                        }
                      </p>
                      {contact.type === 'office' && !contact.chat && (
                        <Badge variant="outline" className="ml-2 flex-shrink-0">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Bookings */}
                {contact.type === 'customer' && contact.isExpanded && contact.bookings && (
                  <div className="ml-6 space-y-1">
                    {contact.bookings.slice(0, contact.showAll ? undefined : 3).map((booking) => (
                      <div
                        key={booking.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContactClick(contact, booking);
                        }}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors border-l-2 border-border ${
                          activeChat?.booking_id === booking.bookingId
                            ? 'bg-accent text-accent-foreground border-l-primary'
                            : 'hover:bg-accent/30 ml-2'
                        }`}
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-sm text-foreground truncate">
                              {booking.serviceType}
                            </h5>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {booking.lastMessageTime && (
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(booking.lastMessageTime), { addSuffix: true })}
                                </span>
                              )}
                              {booking.unreadCount && booking.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {booking.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(booking.dateTime).toLocaleDateString()}</span>
                              <MapPin className="h-3 w-3 ml-2" />
                              <span className="truncate">{booking.postcode}</span>
                            </div>
                            {!booking.chat && (
                              <Badge variant="outline" className="ml-2 flex-shrink-0 text-xs">
                                New
                              </Badge>
                            )}
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
                      <div className="ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowMore(contact.id);
                          }}
                          className="text-xs h-8"
                        >
                          {contact.showAll 
                            ? `Show Less` 
                            : `Show ${contact.bookings.length - 3} More`
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

export default CleanerContacts;