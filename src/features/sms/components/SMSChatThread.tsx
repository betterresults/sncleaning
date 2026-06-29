import type { RefObject } from 'react';
import { ArrowLeft, MessageCircle, Phone, Send } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShellEmpty, ShellPane } from '@/layouts/shell';
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
}: SMSChatThreadProps) {
  if (!selectedThread) {
    return (
      <ShellPane aria-label="Message thread" className="h-full min-h-0">
        <ShellEmpty className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-3 py-16">
          <MessageCircle className="h-12 w-12 text-shell-faint" aria-hidden />
          <p>Select a conversation to view messages</p>
        </ShellEmpty>
      </ShellPane>
    );
  }

  const threadHeader = (
    <div className="flex items-center gap-3 px-4 py-3">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 lg:hidden"
        onClick={onBack}
        aria-label="Back to conversations"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="bg-shell-stat-brand-bg text-shell-stat-brand">
          {getInitials(selectedThread.customer_name, selectedThread.phone_number)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-shell-text">
          {selectedThread.customer_name || selectedThread.phone_number}
        </p>
        {selectedThread.customer_name && (
          <p className="flex items-center gap-1 text-sm text-shell-muted">
            <Phone className="h-3 w-3" aria-hidden />
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
  );

  const composer = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSendMessage();
      }}
      className="flex gap-2 px-4 py-3"
    >
      <Input
        placeholder="Type your message..."
        value={newMessage}
        onChange={(e) => onNewMessageChange(e.target.value)}
        disabled={sending}
        className="border-transparent bg-black/[0.04] shadow-none focus-visible:border-shell-brand/30 focus-visible:bg-white focus-visible:ring-0"
      />
      <Button type="submit" disabled={!newMessage.trim() || sending} aria-label="Send message">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );

  return (
    <ShellPane
      aria-label="Message thread"
      className="h-full min-h-0"
      header={threadHeader}
      footer={composer}
    >
      <ScrollArea className="h-full w-full" ref={scrollAreaRef}>
        <div className="space-y-4 p-4">
          {selectedThread.messages.map((msg) => (
            <SMSMessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </ShellPane>
  );
}
