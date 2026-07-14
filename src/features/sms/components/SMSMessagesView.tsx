import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  ShellDivideBlock,
  ShellFilterBar,
  ShellSectionHeader,
  ShellWorkspace,
} from '@/layouts/shell';
import { useCustomerPhoneLookup } from '../hooks/useCustomerPhoneLookup';
import { useSMSConversations } from '../hooks/useSMSConversations';
import { useSMSNewConversation } from '../hooks/useSMSNewConversation';
import { SMSChatThread } from './SMSChatThread';
import { SMSConversationList } from './SMSConversationList';
import { SMSNewMessageDialog } from './SMSNewMessageDialog';
import { SMSUnreadBanner } from './SMSUnreadBanner';
import { useToast } from '@/hooks/use-toast';

export function SMSMessagesView() {
  const { toast } = useToast();
  const [showCustomerLookup, setShowCustomerLookup] = useState(false);

  const conversations = useSMSConversations({
    onSendError: (description) => {
      toast({
        title: 'Failed to send SMS',
        description,
        variant: 'destructive',
      });
    },
  });

  const lookup = useCustomerPhoneLookup({
    onError: () => {
      toast({
        title: 'Lookup failed',
        description: 'Could not find customer information',
        variant: 'destructive',
      });
    },
  });

  const newConversation = useSMSNewConversation({
    threads: conversations.threads,
    setSelectedThread: conversations.setSelectedThread,
    onMissingPhone: () => {
      toast({
        title: 'No phone number',
        description: 'This customer has no phone number on file.',
        variant: 'destructive',
      });
    },
  });

  const detailActive = !!conversations.selectedThread;

  const newMessageAction = (
    <Dialog
      open={newConversation.showNewMessageDialog}
      onOpenChange={newConversation.setShowNewMessageDialog}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4" />
          New message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New SMS Message</DialogTitle>
        </DialogHeader>
        <SMSNewMessageDialog
          customerSearch={newConversation.customerSearch}
          onCustomerSearchChange={newConversation.setCustomerSearch}
          customers={newConversation.customers}
          searchingCustomers={newConversation.searchingCustomers}
          manualPhone={newConversation.manualPhone}
          onManualPhoneChange={newConversation.setManualPhone}
          manualName={newConversation.manualName}
          onManualNameChange={newConversation.setManualName}
          onStartWithManualPhone={newConversation.handleStartWithManualPhone}
          onSelectCustomer={newConversation.handleSelectCustomer}
        />
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <SMSUnreadBanner
        totalUnread={conversations.totalUnread}
        unreadConversationCount={conversations.unreadConversationCount}
        onViewMessages={conversations.openFirstUnreadThread}
      />

      <ShellDivideBlock className="flex min-h-0 flex-1 flex-col gap-shell-block overflow-hidden">
        <ShellSectionHeader
          title="Conversations"
          description={detailActive ? undefined : 'Phone SMS with customers (separate from in-app chat)'}
          action={newMessageAction}
        />

        <ShellFilterBar
          searchValue={conversations.searchTerm}
          onSearchChange={conversations.setSearchTerm}
          searchPlaceholder="Search by name or phone…"
          searchAriaLabel="Search conversations"
          className={cn(detailActive && 'max-lg:hidden')}
        />

        <ShellWorkspace
          detailActive={detailActive}
          fill
          sidebar={
            <SMSConversationList
              filteredThreads={conversations.filteredThreads}
              selectedThread={conversations.selectedThread}
              loading={conversations.loading}
              onSelectThread={conversations.handleSelectThread}
            />
          }
          detail={
            <SMSChatThread
              selectedThread={conversations.selectedThread}
              onBack={() => conversations.setSelectedThread(null)}
              newMessage={conversations.newMessage}
              onNewMessageChange={conversations.setNewMessage}
              sending={conversations.sending}
              onSendMessage={conversations.handleSendMessage}
              messagesEndRef={conversations.messagesEndRef}
              scrollAreaRef={conversations.scrollAreaRef}
              showCustomerLookup={showCustomerLookup}
              onShowCustomerLookupChange={setShowCustomerLookup}
              lookupLoading={lookup.lookupLoading}
              lookupResult={lookup.lookupResult}
              onLookupOpen={() => {
                if (conversations.selectedThread) {
                  lookup.lookupCustomerByPhone(conversations.selectedThread.phone_number);
                }
              }}
            />
          }
        />
      </ShellDivideBlock>
    </div>
  );
}
