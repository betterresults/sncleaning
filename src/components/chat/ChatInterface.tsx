import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Paperclip, Image, FileText, MessageCircle, Check, ArrowLeft } from 'lucide-react';
import { Chat, ChatMessage } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface ChatInterfaceProps {
  chat: Chat;
  messages: ChatMessage[];
  onSendMessage: (message: string, fileUrl?: string) => void;
  sendingMessage: boolean;
  onBack?: () => void;
}

const ChatInterface = ({ chat, messages, onSendMessage, sendingMessage, onBack }: ChatInterfaceProps) => {
  const { userRole, customerId, cleanerId } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = event.currentTarget;
    
    // Load more messages when scrolled to top
    if (scrollTop === 0 && hasMoreMessages && !loadingMore) {
      loadMoreMessages();
    }
  };

  const loadMoreMessages = async () => {
    if (!chat.id || loadingMore) return;
    
    setLoadingMore(true);
    // This would need to be passed from the parent component
    // For now, we'll just set hasMoreMessages to false to prevent infinite loading
    setHasMoreMessages(false);
    setLoadingMore(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !sendingMessage) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!chat.id || uploading) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${chat.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      // Send message with file
      const fileMessage = file.type.startsWith('image/') 
        ? `📷 ${file.name}` 
        : `📄 ${file.name}`;
      
      onSendMessage(fileMessage, publicUrl);
      
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      // Admin acting as the user in the chat
      if (chat.chat_type === 'customer_cleaner' || chat.chat_type === 'customer_office') {
        // In customer chats, admin acts as the customer
        return message.sender_type === 'customer' && message.sender_id === chat.customer_id;
      } else if (chat.chat_type === 'office_cleaner') {
        // In cleaner chats, admin acts as the cleaner
        return message.sender_type === 'cleaner' && message.sender_id === chat.cleaner_id;
      }
      return message.sender_type === 'admin';
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

  const formatTimeAgo = (date: string) => {
    const distance = formatDistanceToNow(new Date(date), { addSuffix: false });
    return distance
      .replace('about ', '')
      .replace(' hours', 'h ago')
      .replace(' hour', 'h ago')
      .replace(' minutes', 'm ago')
      .replace(' minute', 'm ago')
      .replace(' days', 'd ago')
      .replace(' day', 'd ago')
      .replace(' weeks', 'w ago')
      .replace(' week', 'w ago')
      .replace(' months', 'mo ago')
      .replace(' month', 'mo ago');
  };


  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-background">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          {chat.chat_type === 'office_cleaner' ? (
            <MessageCircle className="h-4 w-4 text-primary" />
          ) : (
            <MessageCircle className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground text-sm truncate">
            {getChatTitle()}
          </h3>
          {chat.booking && (
            <p className="text-xs text-muted-foreground truncate">
              {new Date(chat.booking.date_time).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea 
        className="flex-1 p-2 md:p-4" 
        ref={scrollAreaRef}
        onScrollCapture={handleScroll}
      >
        <div className="space-y-2 md:space-y-3">
          {chat.id === 'pending' ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Start a New Conversation</h3>
              <p className="text-muted-foreground">
                {chat.chat_type === 'office_cleaner' 
                  ? 'Write your first message to SN Cleaning Office'
                  : chat.booking 
                    ? `Write your first message about the ${chat.booking.service_type} booking`
                    : 'Write your first message to start this conversation'
                }
              </p>
            </div>
          ) : (
            <>
              {loadingMore && (
                <div className="text-center py-2">
                  <div className="text-xs text-muted-foreground">Loading more messages...</div>
                </div>
              )}
              {messages.slice(-50).map((message) => (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-lg px-2 py-1.5 ${
                      isOwnMessage(message)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {/* Compact header with name on left and time on right */}
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium opacity-70">
                        {getSenderName(message)}
                      </p>
                      <div className="flex items-center gap-1 ml-2">
                        <p className={`text-xs opacity-60 ${
                          isOwnMessage(message) ? 'text-primary-foreground/60' : 'text-muted-foreground/60'
                        }`}>
                          {formatTimeAgo(message.created_at)}
                        </p>
                        {/* Read receipt tick - only show for own messages */}
                        {isOwnMessage(message) && (
                          <Check className={`h-3 w-3 ${
                            message.is_read 
                              ? 'text-green-500' 
                              : 'text-muted-foreground/40'
                          }`} />
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm break-words">
                      {message.file_url ? (
                        message.file_url.includes('image') || message.message.includes('📷') ? (
                          <div>
                            <img 
                              src={message.file_url} 
                              alt="Shared image" 
                              className="max-w-full md:max-w-xs rounded cursor-pointer"
                              onClick={() => window.open(message.file_url, '_blank')}
                            />
                            <p className="mt-1">{message.message}</p>
                          </div>
                        ) : (
                          <a 
                            href={message.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-600 break-all"
                          >
                            {message.message}
                          </a>
                        )
                      ) : (
                        message.message
                      )}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex items-center space-x-2 p-3 md:p-4 border-t border-border bg-background">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt"
          className="hidden"
        />
        <Button 
          type="button" 
          variant="ghost" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || sendingMessage}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={uploading ? "Uploading..." : "Type a message..."}
          className="flex-1"
          disabled={sendingMessage || uploading}
        />
        <Button type="submit" disabled={sendingMessage || uploading || !newMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatInterface;