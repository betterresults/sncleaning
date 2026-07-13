import { useCallback, useState } from 'react';
import { LayoutDashboard, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShellPage, ShellSegment } from '@/layouts/shell';
import { useChatManagementStats } from '../hooks/useChatManagementStats';
import type { ChatManagementTab, ChatTypeFilter, ChatManagementViewProps } from '../types';
import { ChatOverviewSection } from './ChatOverviewSection';
import { ChatLiveWorkspace } from './ChatLiveWorkspace';
import { ChatManagementSection } from './ChatManagementSection';

const TAB_OPTIONS = [
  { value: 'overview', label: 'Overview', shortLabel: 'Overview', icon: LayoutDashboard },
  { value: 'conversations', label: 'Live', shortLabel: 'Live', icon: MessageSquare },
  { value: 'management', label: 'Management', shortLabel: 'Manage', icon: Settings },
] as const;

export function ChatManagementView({
  chats,
  activeChat,
  setActiveChat,
  messages,
  chatLoading,
  sendingMessage,
  fetchMessages,
  sendMessage,
}: ChatManagementViewProps) {
  const [activeTab, setActiveTab] = useState<ChatManagementTab>('overview');
  const [selectedChatType, setSelectedChatType] = useState<ChatTypeFilter>(null);

  const { chatStats, recentMessages, loading: statsLoading, error: statsError, refresh: refreshStats } =
    useChatManagementStats(chats);

  const handleSelectChat = useCallback(
    async (chat: typeof activeChat) => {
      if (!chat) return;
      setActiveChat(chat);
      await fetchMessages(chat.id);
    },
    [fetchMessages, setActiveChat],
  );

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (activeChat) {
        await sendMessage(activeChat.id, message);
      }
    },
    [activeChat, sendMessage],
  );

  const handleStatClick = useCallback((filter: ChatTypeFilter) => {
    setSelectedChatType(filter);
    setActiveTab('management');
  }, []);

  const handleRecentMessageClick = useCallback(
    async (chat: NonNullable<typeof activeChat>) => {
      await handleSelectChat(chat);
      setActiveTab('conversations');
    },
    [handleSelectChat],
  );

  const handleViewChatFromManagement = useCallback(
    async (chat: NonNullable<typeof activeChat>) => {
      await handleSelectChat(chat);
      setActiveTab('conversations');
    },
    [handleSelectChat],
  );

  const isLiveTab = activeTab === 'conversations';

  return (
    <ShellPage
      width="wide"
      fill={isLiveTab}
      className={cn(isLiveTab && 'gap-shell-block')}
    >
      <ShellSegment
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ChatManagementTab)}
        options={[...TAB_OPTIONS]}
        ariaLabel="Chat management views"
      />

      {activeTab === 'overview' && (
        <ChatOverviewSection
          chatStats={chatStats}
          recentMessages={recentMessages}
          chats={chats}
          loading={statsLoading}
          error={statsError}
          onRetry={refreshStats}
          onStatClick={handleStatClick}
          onRecentMessageClick={handleRecentMessageClick}
        />
      )}

      {activeTab === 'conversations' && (
        <ChatLiveWorkspace
          chats={chats}
          activeChat={activeChat}
          messages={messages}
          loading={chatLoading}
          sendingMessage={sendingMessage}
          onSelectChat={handleSelectChat}
          onSendMessage={handleSendMessage}
          onBack={() => setActiveChat(null)}
        />
      )}

      {activeTab === 'management' && (
        <ChatManagementSection
          chats={chats}
          selectedChatType={selectedChatType}
          onClearFilter={() => setSelectedChatType(null)}
          onViewChat={handleViewChatFromManagement}
        />
      )}
    </ShellPage>
  );
}
