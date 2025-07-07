import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, MessageCircle } from 'lucide-react';
import { ChatWithLastMessage } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface ChatListProps {
  chats: ChatWithLastMessage[];
  activeChat: ChatWithLastMessage | null;
  onSelectChat: (chat: ChatWithLastMessage) => void;
  onCreateChat: () => void;
  loading: boolean;
}

const ChatList = ({ chats, activeChat, onSelectChat, onCreateChat, loading }: ChatListProps) => {
  const { userRole, customerId, cleanerId } = useAuth();

  const getChatDisplayName = (chat: ChatWithLastMessage) => {
    if (chat.chat_type === 'customer_office') {
      return userRole === 'admin' 
        ? `${chat.customer?.first_name} ${chat.customer?.last_name}` 
        : 'SN Cleaning Office';
    } else if (chat.chat_type === 'customer_cleaner') {
      if (userRole === 'admin') {
        return `${chat.customer?.first_name} ${chat.customer?.last_name} ↔ ${chat.cleaner?.first_name} ${chat.cleaner?.last_name}`;
      } else if (customerId) {
        return `${chat.cleaner?.first_name} ${chat.cleaner?.last_name}`;
      } else {
        return `${chat.customer?.first_name} ${chat.customer?.last_name}`;
      }
    } else if (chat.chat_type === 'office_cleaner') {
      return userRole === 'admin' 
        ? `${chat.cleaner?.first_name} ${chat.cleaner?.last_name}` 
        : 'SN Cleaning Office';
    }
    return 'Unknown Chat';
  };

  const getChatSubtext = (chat: ChatWithLastMessage) => {
    if (chat.booking) {
      return `${chat.booking.service_type} - ${new Date(chat.booking.date_time).toLocaleDateString()}`;
    }
    return chat.chat_type.replace('_', ' ').toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Messages</h2>
        <Button onClick={onCreateChat} size="sm" variant="outline">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No messages yet</h3>
            <p className="text-muted-foreground mb-4">Start a conversation to get help with your bookings</p>
            <Button onClick={onCreateChat} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Start Chat
            </Button>
          </div>
        ) : (
          <div className="p-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  activeChat?.id === chat.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold">
                    {getChatDisplayName(chat).charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground truncate">
                      {getChatDisplayName(chat)}
                    </h4>
                    {chat.last_message_at && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {chat.last_message?.message || getChatSubtext(chat)}
                    </p>
                    {chat.unread_count && chat.unread_count > 0 && (
                      <Badge variant="destructive" className="ml-2 flex-shrink-0">
                        {chat.unread_count}
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

export default ChatList;