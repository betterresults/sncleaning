import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCustomerPhoneLookup } from '../hooks/useCustomerPhoneLookup';
import { useSMSConversations } from '../hooks/useSMSConversations';
import { useSMSNewConversation } from '../hooks/useSMSNewConversation';
import { SMSChatThread } from './SMSChatThread';
import { SMSConversationList } from './SMSConversationList';
import { SMSUnreadBanner } from './SMSUnreadBanner';

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

  const listVisibility = conversations.selectedThread ? 'hidden lg:flex' : 'flex';
  const threadVisibility = !conversations.selectedThread ? 'hidden lg:flex' : 'flex';

  return (
    <>
      <SMSUnreadBanner
        totalUnread={conversations.totalUnread}
        unreadConversationCount={conversations.unreadConversationCount}
        onViewMessages={conversations.openFirstUnreadThread}
      />

      <div
        className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-3"
        style={{ maxHeight: 'calc(100vh - 180px)' }}
      >
        <SMSConversationList
          filteredThreads={conversations.filteredThreads}
          selectedThread={conversations.selectedThread}
          loading={conversations.loading}
          searchTerm={conversations.searchTerm}
          onSearchChange={conversations.setSearchTerm}
          onSelectThread={conversations.handleSelectThread}
          showNewMessageDialog={newConversation.showNewMessageDialog}
          onShowNewMessageDialogChange={newConversation.setShowNewMessageDialog}
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
          className={listVisibility}
        />

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
          className={threadVisibility}
        />
      </div>
    </>
  );
}
