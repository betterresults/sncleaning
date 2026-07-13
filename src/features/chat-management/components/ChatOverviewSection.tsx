import { MessageSquare, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  ShellDivideBlock,
  ShellList,
  ShellListContent,
  ShellListIcon,
  ShellListItem,
  ShellListMeta,
  ShellListTitle,
  ShellSectionHeader,
  ShellStat,
  ShellStatGrid,
  ShellEmpty,
} from '@/layouts/shell';
import type { ChatStats, ChatTypeFilter, RecentChatMessage } from '../types';
import type { ChatWithLastMessage } from '@/types/chat';
import { getChatTypeDisplay, getSenderLabel } from '../utils/display';
import { formatLondon } from '@/lib/ukTime';

interface ChatOverviewSectionProps {
  chatStats: ChatStats;
  recentMessages: RecentChatMessage[];
  chats: ChatWithLastMessage[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onStatClick: (filter: ChatTypeFilter) => void;
  onRecentMessageClick: (chat: ChatWithLastMessage) => void;
}

function getRecentChatLabel(msg: RecentChatMessage) {
  const { customer, cleaner } = msg.chats;
  if (customer) {
    const name = `${customer.first_name} ${customer.last_name}`;
    if (cleaner) {
      return `${name} ↔ ${cleaner.first_name} ${cleaner.last_name}`;
    }
    return name;
  }
  if (cleaner) {
    return `${cleaner.first_name} ${cleaner.last_name}`;
  }
  return 'Conversation';
}

function ClickableStat({
  onClick,
  ...props
}: React.ComponentProps<typeof ShellStat> & { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-w-0 flex-[1_1_140px] rounded-lg text-left transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shell-brand/45 max-md:flex-[0_0_min(82vw,260px)]"
    >
      <ShellStat {...props} />
    </button>
  );
}

export function ChatOverviewSection({
  chatStats,
  recentMessages,
  chats,
  loading,
  error,
  onRetry,
  onStatClick,
  onRecentMessageClick,
}: ChatOverviewSectionProps) {
  return (
    <div className="flex flex-col gap-shell-block">
      {error && (
        <ShellEmpty>
          <div className="flex flex-col items-center gap-3">
            <span>{error}</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-sm font-medium text-shell-brand underline-offset-2 hover:underline"
              >
                Retry
              </button>
            )}
          </div>
        </ShellEmpty>
      )}
      <ShellStatGrid>
        <ClickableStat
          label="Total chats"
          value={chatStats.totalChats}
          hint="View all"
          icon={MessageSquare}
          tone="brand"
          loading={loading}
          onClick={() => onStatClick('all')}
        />
        <ClickableStat
          label="Active chats"
          value={chatStats.activeChats}
          hint="View active"
          icon={Users}
          tone="success"
          loading={loading}
          onClick={() => onStatClick('active')}
        />
        <ClickableStat
          label="Customer ↔ Office"
          value={chatStats.customerOfficeChats}
          hint="View list"
          icon={MessageSquare}
          loading={loading}
          onClick={() => onStatClick('customer_office')}
        />
        <ClickableStat
          label="Customer ↔ Cleaner"
          value={chatStats.customerCleanerChats}
          hint="View list"
          icon={MessageSquare}
          loading={loading}
          onClick={() => onStatClick('customer_cleaner')}
        />
        <ClickableStat
          label="Office ↔ Cleaner"
          value={chatStats.officeCleanerChats}
          hint="View list"
          icon={MessageSquare}
          loading={loading}
          onClick={() => onStatClick('office_cleaner')}
        />
      </ShellStatGrid>

      <ShellDivideBlock>
        <ShellSectionHeader title="Recent activity" description="Latest messages across all chats" />
        <ShellList>
          {recentMessages.slice(0, 5).map((msg) => {
            const chat = chats.find((c) => c.id === msg.chats.id);
            return (
              <ShellListItem
                key={msg.id}
                clickable={!!chat}
                className="!rounded-none"
                onClick={() => chat && onRecentMessageClick(chat)}
              >
                <ShellListIcon icon={MessageSquare} tone="brand" />
                <ShellListContent>
                  <ShellListTitle>{getRecentChatLabel(msg)}</ShellListTitle>
                  <ShellListMeta>
                    <span className="font-medium text-shell-text">{getSenderLabel(msg.sender_type)}:</span>{' '}
                    {msg.message}
                  </ShellListMeta>
                  <ShellListMeta>{formatLondon(msg.created_at, 'dd/MM/yyyy, HH:mm:ss')}</ShellListMeta>
                </ShellListContent>
                <Badge variant="outline" className="shrink-0 font-normal">
                  {getChatTypeDisplay(msg.chats.chat_type)}
                </Badge>
              </ShellListItem>
            );
          })}
          {!loading && !error && recentMessages.length === 0 && (
            <ShellEmpty>No recent messages</ShellEmpty>
          )}
        </ShellList>
      </ShellDivideBlock>
    </div>
  );
}
