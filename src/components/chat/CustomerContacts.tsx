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
  cleanerId?: number;
  cleanerName?: string;
  chat?: ChatWithLastMessage;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface Contact {
  id: string;
  name: string;
  type: 'office' | 'cleaner';
  cleaner_id?: number;
  bookings?: BookingContact[];
  chat?: ChatWithLastMessage;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  showAll?: boolean;
  isExpanded?: boolean;
}

interface CustomerContactsProps {
  chats: ChatWithLastMessage[];
  activeChat: ChatWithLastMessage | null;
  onSelectContact: (contact: Contact, booking?: BookingContact) => void;
  onCreateChat: (contact: Contact, booking?: BookingContact) => void;
  loading: boolean;
  customerId?: number;
}

const CustomerContacts = ({ 
  chats, 
  activeChat, 
  onSelectContact, 
  onCreateChat, 
  loading,
  customerId: selectedCustomerId 
}: CustomerContactsProps) => {
  const { userRole, customerId } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const effectiveCustomerId = userRole === 'admin' ? selectedCustomerId : customerId;

  const fetchContacts = async () => {
    if (!effectiveCustomerId) return;

    setLoadingContacts(true);
    try {
      // Get customer's bookings
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          cleaner,
          service_type,
          cleaning_type,
          date_time,
          address,
          postcode,
          cleaners(id, first_name, last_name)
        `)
        .eq('customer', effectiveCustomerId)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true });

      if (error) throw error;

      // Create office contact
      const officeContact: Contact = {
        id: 'office',
        name: 'SN Cleaning Office',
        type: 'office'
      };

      // Group bookings by cleaner or create office bookings for unassigned ones
      const cleanerBookingsMap = new Map();
      const officeBookings: BookingContact[] = [];

      bookings?.forEach(booking => {
        if (booking.cleaner && booking.cleaners) {
          // Booking has a cleaner
          const cleanerId = booking.cleaner;
          if (!cleanerBookingsMap.has(cleanerId)) {
            cleanerBookingsMap.set(cleanerId, {
              cleaner: booking.cleaners,
              bookings: []
            });
          }
          cleanerBookingsMap.get(cleanerId).bookings.push(booking);
        } else {
          // No cleaner assigned - office handles this
          const bookingChat = chats.find(chat => 
            chat.chat_type === 'customer_office' && 
            chat.booking_id === booking.id
          );

          officeBookings.push({
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
          });
        }
      });

      // Add office bookings to office contact
      if (officeBookings.length > 0) {
        officeContact.bookings = officeBookings;
        officeContact.isExpanded = false;
      }

      // Create cleaner contacts
      const cleanerContacts = Array.from(cleanerBookingsMap.values()).map(({ cleaner, bookings: cleanerBookings }) => {
        const bookingContacts: BookingContact[] = cleanerBookings.map((booking: any) => {
          const bookingChat = chats.find(chat => 
            chat.chat_type === 'customer_cleaner' && 
            chat.cleaner_id === cleaner.id &&
            chat.booking_id === booking.id
          );

          return {
            id: `booking-${booking.id}`,
            bookingId: booking.id,
            serviceType: booking.service_type || booking.cleaning_type || 'Cleaning',
            dateTime: booking.date_time,
            address: booking.address,
            postcode: booking.postcode,
            cleanerId: cleaner.id,
            cleanerName: `${cleaner.first_name} ${cleaner.last_name}`,
            chat: bookingChat,
            lastMessage: bookingChat?.last_message?.message,
            lastMessageTime: bookingChat?.last_message_at,
            unreadCount: bookingChat?.unread_count || 0
          };
        });

        return {
          id: `cleaner-${cleaner.id}`,
          name: `${cleaner.first_name} ${cleaner.last_name}`,
          type: 'cleaner' as const,
          cleaner_id: cleaner.id,
          bookings: bookingContacts,
          isExpanded: false
        };
      });

      // Match office contact with existing general chat
      const officeGeneralChat = chats.find(chat => 
        chat.chat_type === 'customer_office' && !chat.booking_id
      );
      if (officeGeneralChat) {
        officeContact.chat = officeGeneralChat;
        officeContact.lastMessage = officeGeneralChat.last_message?.message;
        officeContact.lastMessageTime = officeGeneralChat.last_message_at;
        officeContact.unreadCount = officeGeneralChat.unread_count || 0;
      }

      const allContacts = [officeContact, ...cleanerContacts];
      setContacts(allContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [effectiveCustomerId, chats]);

  const handleContactClick = (contact: Contact, booking?: BookingContact) => {
    if ((contact.type === 'office' || contact.type === 'cleaner') && !booking && contact.bookings) {
      // Toggle expansion for contacts with bookings
      setContacts(prev => prev.map(c => 
        c.id === contact.id 
          ? { ...c, isExpanded: !c.isExpanded }
          : c
      ));
      return;
    }

    // Handle direct contact or booking contact
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
            <p className="text-muted-foreground">You'll see your bookings and assigned cleaners here</p>
          </div>
        ) : (
          <div className="p-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="space-y-1">
                {/* Main Contact Item */}
                <div
                  onClick={() => handleContactClick(contact)}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    !contact.bookings && activeChat?.id === contact.chat?.id
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
                        {contact.bookings && contact.bookings.length > 0 && (
                          <div className="flex items-center">
                            {contact.isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Badge variant="outline" className="ml-1 text-xs">
                              {contact.bookings.length}
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
                        {contact.bookings && contact.bookings.length > 0
                          ? `${contact.bookings.length} bookings`
                          : contact.lastMessage || (contact.chat ? 'Tap to continue' : 'Tap to start chat')
                        }
                      </p>
                      {!contact.bookings && !contact.chat && (
                        <Badge variant="outline" className="ml-2 flex-shrink-0">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Bookings */}
                {contact.isExpanded && contact.bookings && (
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

export default CustomerContacts;