import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { Chat, ChatMessage } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ChatInterfaceProps {
  chat: Chat;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  sendingMessage: boolean;
}

const ChatInterface = ({ chat, messages, onSendMessage, sendingMessage }: ChatInterfaceProps) => {
  const { userRole, customerId, cleanerId } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !sendingMessage) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const getChatTitle = () => {
    if (chat.chat_type === 'customer_office') {
      return userRole === 'admin' ? `${chat.customer?.first_name || 'Customer'} ${chat.customer?.last_name || ''}`.trim() : 'SN Cleaning Office';
    } else if (chat.chat_type === 'customer_cleaner') {
      if (userRole === 'admin') {
        const customerName = `${chat.customer?.first_name || 'Customer'} ${chat.customer?.last_name || ''}`.trim();
        const cleanerName = `${chat.cleaner?.first_name || 'Cleaner'} ${chat.cleaner?.last_name || ''}`.trim();
        const title = `${customerName} → ${cleanerName}`;
        return chat.booking ? `${title} - ${chat.booking.service_type}` : title;
      } else if (customerId) {
        const title = `${chat.cleaner?.first_name || 'Cleaner'} ${chat.cleaner?.last_name || ''}`.trim();
        return chat.booking ? `${title} - ${chat.booking.service_type}` : title;
      } else {
        const title = `${chat.customer?.first_name || 'Customer'} ${chat.customer?.last_name || ''}`.trim();
        return chat.booking ? `${title} - ${chat.booking.service_type}` : title;
      }
    } else if (chat.chat_type === 'office_cleaner') {
      return userRole === 'admin' ? `${chat.cleaner?.first_name || 'Cleaner'} ${chat.cleaner?.last_name || ''}`.trim() : 'SN Cleaning Office';
    }
    return 'Chat';
  };

  const isOwnMessage = (message: ChatMessage) => {
    if (userRole === 'admin') {
      // Admin messages appear on customer's side when viewing customer chats
      if (customerId) return message.sender_type === 'admin' || message.sender_type === 'customer';
      // Admin messages appear on cleaner's side when viewing cleaner chats  
      return message.sender_type === 'admin' || message.sender_type === 'cleaner';
    }
    if (cleanerId) return message.sender_type === 'cleaner' && message.sender_id === cleanerId;
    if (customerId) return message.sender_type === 'customer' && message.sender_id === customerId;
    return false;
  };

  const getSenderName = (message: ChatMessage) => {
    if (message.sender_type === 'admin') return 'Office';
    if (message.sender_type === 'customer') return chat.customer?.first_name || 'Customer';
    if (message.sender_type === 'cleaner') return chat.cleaner?.first_name || 'Cleaner';
    return 'Unknown';
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-primary font-semibold">
              {getChatTitle().charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{getChatTitle()}</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              {chat.booking && (
                <p>
                  Booking: {new Date(chat.booking.date_time).toLocaleDateString()} at {chat.booking.address}
                </p>
              )}
              {!chat.booking && chat.chat_type !== 'office_cleaner' && chat.chat_type !== 'customer_office' && (
                <p>General conversation</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-3 py-2 ${
                  isOwnMessage(message)
                    ? message.sender_type === 'admin' 
                      ? 'bg-orange-500 text-white' // Office messages in orange
                      : 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {!isOwnMessage(message) && (
                  <p className="text-xs font-medium mb-1 opacity-70">
                    {getSenderName(message)}
                  </p>
                )}
                <p className="text-sm">{message.message}</p>
                <p className={`text-xs mt-1 ${
                  isOwnMessage(message) ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
                }`}>
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex items-center space-x-2 p-4 border-t border-border">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          disabled={sendingMessage}
        />
        <Button type="submit" disabled={sendingMessage || !newMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatInterface;