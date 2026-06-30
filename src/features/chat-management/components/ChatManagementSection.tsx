import { Edit, Eye, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShellDivideBlock,
  ShellEmpty,
  ShellIconButton,
  ShellList,
  ShellListContent,
  ShellListIcon,
  ShellListItem,
  ShellListMeta,
  ShellListTitle,
  ShellSectionHeader,
} from '@/layouts/shell';
import type { ChatWithLastMessage } from '@/types/chat';
import type { ChatTypeFilter } from '../types';
import { getChatTypeDisplay, getManagementTitle } from '../utils/display';

interface ChatManagementSectionProps {
  chats: ChatWithLastMessage[];
  selectedChatType: ChatTypeFilter;
  onClearFilter: () => void;
  onViewChat: (chat: ChatWithLastMessage) => void;
}

function getAdminChatDisplayName(chat: ChatWithLastMessage) {
  const parts: string[] = [];
  if (chat.customer) {
    parts.push(`${chat.customer.first_name} ${chat.customer.last_name}`);
  }
  if (chat.cleaner) {
    parts.push(`${chat.cleaner.first_name} ${chat.cleaner.last_name}`);
  }
  return parts.join(' ↔ ') || 'Conversation';
}

export function ChatManagementSection({
  chats,
  selectedChatType,
  onClearFilter,
  onViewChat,
}: ChatManagementSectionProps) {
  const filteredChats =
    selectedChatType && selectedChatType !== 'all' && selectedChatType !== 'active'
      ? chats.filter((chat) => chat.chat_type === selectedChatType)
      : chats;

  const managementChats =
    selectedChatType === 'active'
      ? filteredChats.filter((chat) => chat.is_active)
      : filteredChats;

  const clearFilterAction = selectedChatType ? (
    <Button variant="outline" size="sm" onClick={onClearFilter}>
      Clear filter
    </Button>
  ) : undefined;

  return (
    <div className="flex flex-col gap-shell-block">
      <ShellDivideBlock>
        <ShellSectionHeader title="Management tools" description="Moderation and archive actions" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button variant="outline" className="h-auto min-h-16 flex-col gap-2 py-4">
            <Eye className="h-5 w-5" />
            View all chats
          </Button>
          <Button variant="outline" className="h-auto min-h-16 flex-col gap-2 py-4">
            <Edit className="h-5 w-5" />
            Moderate messages
          </Button>
          <Button variant="outline" className="h-auto min-h-16 flex-col gap-2 py-4">
            <Trash2 className="h-5 w-5" />
            Archive chats
          </Button>
        </div>
      </ShellDivideBlock>

      <ShellDivideBlock>
        <ShellSectionHeader
          title={getManagementTitle(selectedChatType)}
          action={clearFilterAction}
        />
        <ShellList>
          {managementChats.map((chat) => (
            <ShellListItem key={chat.id} className="!rounded-none">
              <ShellListIcon icon={MessageSquare} tone="brand" />
              <ShellListContent>
                <ShellListTitle>{getAdminChatDisplayName(chat)}</ShellListTitle>
                <ShellListMeta>
                  {getChatTypeDisplay(chat.chat_type)}
                  {chat.last_message_at &&
                    ` · Last active ${new Date(chat.last_message_at).toLocaleDateString()}`}
                </ShellListMeta>
              </ShellListContent>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={chat.is_active ? 'default' : 'secondary'}>
                  {chat.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <ShellIconButton
                  aria-label="Open conversation"
                  onClick={() => onViewChat(chat)}
                >
                  <Eye className="h-4 w-4" />
                </ShellIconButton>
              </div>
            </ShellListItem>
          ))}
          {managementChats.length === 0 && (
            <ShellEmpty>No conversations found</ShellEmpty>
          )}
        </ShellList>
      </ShellDivideBlock>
    </div>
  );
}
