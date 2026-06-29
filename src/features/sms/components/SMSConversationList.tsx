import { Phone } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ShellEmpty,
  ShellList,
  ShellListContent,
  ShellListItem,
  ShellListMeta,
  ShellListTitle,
  ShellLoading,
  ShellPane,
} from '@/layouts/shell';
import type { ConversationThread } from '../types';
import { formatThreadTime, getInitials } from '../utils/display';

interface SMSConversationListProps {
  filteredThreads: ConversationThread[];
  selectedThread: ConversationThread | null;
  loading: boolean;
  onSelectThread: (thread: ConversationThread) => void;
}

export function SMSConversationList({
  filteredThreads,
  selectedThread,
  loading,
  onSelectThread,
}: SMSConversationListProps) {
  return (
    <ShellPane aria-label="Conversation list" className="h-full min-h-0 " bodyClassName="">
      <ScrollArea className="h-full w-full">
        {loading ? (
          <ShellLoading message="Loading conversations…" className="min-h-32" />
        ) : filteredThreads.length === 0 ? (
          <ShellEmpty className="flex min-h-32 flex-col items-center justify-center gap-2 py-10">
            <MessageCircle className="h-8 w-8 text-shell-faint" aria-hidden />
            <p>No SMS conversations yet</p>
          </ShellEmpty>
        ) : (
          <ShellList className="px-0">
            {filteredThreads.map((thread) => {
              const isSelected = selectedThread?.phone_number === thread.phone_number;

              return (
                <ShellListItem
                  key={thread.phone_number}
                  clickable
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectThread(thread)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectThread(thread);
                    }
                  }}
                  className={cn(
                    '!rounded-none px-3 hover:opacity-100',
                    isSelected ? 'bg-black/[0.04]' : undefined,
                  )}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-shell-stat-brand-bg text-xs text-shell-stat-brand">
                      {getInitials(thread.customer_name, thread.phone_number)}
                    </AvatarFallback>
                  </Avatar>
                  <ShellListContent>
                    <div className="flex items-start justify-between gap-2">
                      <ShellListTitle className="truncate">
                        {thread.customer_name || thread.phone_number}
                      </ShellListTitle>
                      <ShellListMeta className="shrink-0">
                        {formatThreadTime(thread.last_message_at)}
                      </ShellListMeta>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <ShellListMeta className="truncate">{thread.last_message}</ShellListMeta>
                      {thread.unread_count > 0 && (
                        <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-shell-brand px-1.5 text-[11px] font-semibold text-white">
                          {thread.unread_count}
                        </span>
                      )}
                    </div>
                    {thread.customer_name && (
                      <ShellListMeta className="mt-0.5 flex items-center gap-1">
                        <Phone className="h-3 w-3" aria-hidden />
                        {thread.phone_number}
                      </ShellListMeta>
                    )}
                  </ShellListContent>
                </ShellListItem>
              );
            })}
          </ShellList>
        )}
      </ScrollArea>
    </ShellPane>
  );
}
