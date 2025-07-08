import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Building2, User, Clock, Users } from 'lucide-react';
import { ChatWithLastMessage } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';

interface MessageListProps {
  chats: ChatWithLastMessage[];
  activeChat: ChatWithLastMessage | null;
  onSelectChat: (chat: ChatWithLastMessage) => void;
  onSwitchToContacts: () => void;
  loading: boolean;
}

const WhatsAppMessageList = ({ chats, activeChat, onSelectChat, onSwitchToContacts, loading }: MessageListProps) => {
  const getChatDisplayName = (chat: ChatWithLastMessage) => {
    if (chat.chat_type === 'customer_office') {
      return 'SN Cleaning Office';
    } else if (chat.chat_type === 'customer_cleaner') {
      return `${chat.customer?.first_name} ${chat.customer?.last_name}`.trim();
    } else if (chat.chat_type === 'office_cleaner') {
      return 'SN Cleaning Office';
    }
    return 'Unknown Chat';
  };

  const getChatSubtext = (chat: ChatWithLastMessage) => {
    if (chat.booking) {
      return `${chat.booking.service_type} - ${new Date(chat.booking.date_time).toLocaleDateString()}`;
    }
    return '';
  };

  const getChatIcon = (chat: ChatWithLastMessage) => {
    if (chat.chat_type === 'office_cleaner' || chat.chat_type === 'customer_office') {
      return <Building2 className="h-5 w-5" />;
    }
    return <User className="h-5 w-5" />;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Tabs */}
      <div className="flex items-center border-b border-border bg-card">
        <Button
          variant="ghost"
          className="flex-1 h-10 sm:h-12 rounded-none border-b-2 border-primary bg-primary/5 text-xs sm:text-sm"
        >
          <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Messages
        </Button>
        <Button
          variant="ghost"
          onClick={onSwitchToContacts}
          className="flex-1 h-10 sm:h-12 rounded-none border-b-2 border-transparent hover:border-muted-foreground/20 text-xs sm:text-sm"
        >
          <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Contacts
        </Button>
      </div>

      {/* Message List */}
      <ScrollArea className="flex-1">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageCircle className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No messages yet</h3>
            <p className="text-muted-foreground">Start a conversation to see your messages here</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                  activeChat?.id === chat.id ? 'bg-muted' : ''
                }`}
              >
                {/* Avatar */}
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary border border-primary/20 text-xs sm:text-sm">
                    {chat.chat_type === 'office_cleaner' || chat.chat_type === 'customer_office' ? (
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      getInitials(getChatDisplayName(chat))
                    )}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-foreground truncate text-sm sm:text-base">
                      {getChatDisplayName(chat)}
                    </h3>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      {chat.last_message_at && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true })}
                        </span>
                      )}
                      {chat.unread_count && chat.unread_count > 0 && (
                        <Badge variant="default" className="bg-primary text-primary-foreground h-4 min-w-4 sm:h-5 sm:min-w-5 text-xs">
                          {chat.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Subtitle and last message */}
                  <div className="space-y-1">
                    {getChatSubtext(chat) && (
                      <p className="text-xs text-muted-foreground">
                        {getChatSubtext(chat)}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate flex-1">
                        {chat.last_message?.message || 'No messages yet'}
                      </p>
                      {chat.last_message?.message_type === 'image' && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2">
                          📷 Photo
                        </span>
                      )}
                      {chat.last_message?.message_type === 'file' && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2">
                          📄 File
                        </span>
                      )}
                    </div>
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

export default WhatsAppMessageList;