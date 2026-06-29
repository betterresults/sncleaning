import type { RefObject } from 'react';
import { ArrowLeft, MessageCircle, Phone, Send } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ConversationThread, CustomerLookupResult } from '../types';
import { getInitials } from '../utils/display';
import { CustomerLookupSheet } from './CustomerLookupSheet';
import { SMSMessageBubble } from './SMSMessageBubble';

interface SMSChatThreadProps {
  selectedThread: ConversationThread | null;
  onBack: () => void;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  sending: boolean;
  onSendMessage: () => void;
  messagesEndRef: RefObject<HTMLDivElement>;
  scrollAreaRef: RefObject<HTMLDivElement>;
  showCustomerLookup: boolean;
  onShowCustomerLookupChange: (open: boolean) => void;
  lookupLoading: boolean;
  lookupResult: CustomerLookupResult | null;
  onLookupOpen: () => void;
  className?: string;
}

export function SMSChatThread({
  selectedThread,
  onBack,
  newMessage,
  onNewMessageChange,
  sending,
  onSendMessage,
  messagesEndRef,
  scrollAreaRef,
  showCustomerLookup,
  onShowCustomerLookupChange,
  lookupLoading,
  lookupResult,
  onLookupOpen,
  className = '',
}: SMSChatThreadProps) {
  return (
    <Card className={`flex h-full flex-col overflow-hidden lg:col-span-2 ${className}`}>
      {selectedThread ? (
        <>
          <CardHeader className="flex-shrink-0 border-b pb-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar>
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(selectedThread.customer_name, selectedThread.phone_number)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-lg">
                  {selectedThread.customer_name || selectedThread.phone_number}
                </CardTitle>
                {selectedThread.customer_name && (
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {selectedThread.phone_number}
                  </p>
                )}
              </div>

              <CustomerLookupSheet
                phoneNumber={selectedThread.phone_number}
                open={showCustomerLookup}
                onOpenChange={onShowCustomerLookupChange}
                lookupLoading={lookupLoading}
                lookupResult={lookupResult}
                onOpen={onLookupOpen}
              />
            </div>
          </CardHeader>
          <div
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 280px)' }}
          >
            <ScrollArea className="h-full flex-1" ref={scrollAreaRef}>
              <div className="space-y-4 p-4">
                {selectedThread.messages.map((msg) => (
                  <SMSMessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="flex-shrink-0 border-t bg-background p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => onNewMessageChange(e.target.value)}
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
        <CardContent className="flex flex-1 items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Select a conversation to view messages</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
