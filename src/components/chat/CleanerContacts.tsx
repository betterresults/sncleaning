import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Building2, User } from 'lucide-react';
import { ChatWithLastMessage } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Contact {
  id: string;
  name: string;
  type: 'office' | 'customer';
  customer_id?: number;
  booking_id?: number;
  chat?: ChatWithLastMessage;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface CleanerContactsProps {
  chats: ChatWithLastMessage[];
  activeChat: ChatWithLastMessage | null;
  onSelectContact: (contact: Contact) => void;
  onCreateChat: (contact: Contact) => void;
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
      // Get customers from assigned bookings
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          customer,
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

      // Create customer contacts from unique customers
      const uniqueCustomers = new Map();
      bookings?.forEach(booking => {
        if (booking.customers && !uniqueCustomers.has(booking.customer)) {
          uniqueCustomers.set(booking.customer, {
            id: `customer-${booking.customer}`,
            name: `${booking.customers.first_name} ${booking.customers.last_name}`,
            type: 'customer',
            customer_id: booking.customer,
            booking_id: booking.id
          });
        }
      });

      const customerContacts = Array.from(uniqueCustomers.values());

      // Match contacts with existing chats
      const allContacts = [officeContact, ...customerContacts].map(contact => {
        let existingChat: ChatWithLastMessage | undefined;

        if (contact.type === 'office') {
          existingChat = chats.find(chat => chat.chat_type === 'office_cleaner');
        } else {
          existingChat = chats.find(chat => 
            chat.chat_type === 'customer_cleaner' && 
            chat.customer_id === contact.customer_id
          );
        }

        return {
          ...contact,
          chat: existingChat,
          lastMessage: existingChat?.last_message?.message || undefined,
          lastMessageTime: existingChat?.last_message_at || undefined,
          unreadCount: existingChat?.unread_count || 0
        };
      });

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

  const handleContactClick = (contact: Contact) => {
    if (contact.chat) {
      onSelectContact(contact);
    } else {
      onCreateChat(contact);
    }
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
              <div
                key={contact.id}
                onClick={() => handleContactClick(contact)}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  activeChat?.id === contact.chat?.id
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
                    <h4 className="font-medium text-foreground truncate">
                      {contact.name}
                    </h4>
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
                      {contact.lastMessage || (contact.chat ? 'Tap to continue' : 'Tap to start chat')}
                    </p>
                    {!contact.chat && (
                      <Badge variant="outline" className="ml-2 flex-shrink-0">
                        New
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default CleanerContacts;