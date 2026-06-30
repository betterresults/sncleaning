import { MessageSquare } from 'lucide-react';
import ChatList from '@/components/chat/ChatList';
import ChatInterface from '@/components/chat/ChatInterface';
import {
  ShellDivideBlock,
  ShellEmpty,
  ShellPane,
  ShellSectionHeader,
  ShellWorkspace,
} from '@/layouts/shell';
import type { ChatWithLastMessage } from '@/types/chat';
import type { ChatMessage } from '@/types/chat';

interface ChatLiveWorkspaceProps {
  chats: ChatWithLastMessage[];
  activeChat: ChatWithLastMessage | null;
  messages: ChatMessage[];
  loading: boolean;
  sendingMessage: boolean;
  onSelectChat: (chat: ChatWithLastMessage) => void;
  onSendMessage: (message: string) => void;
  onBack: () => void;
}

export function ChatLiveWorkspace({
  chats,
  activeChat,
  messages,
  loading,
  sendingMessage,
  onSelectChat,
  onSendMessage,
  onBack,
}: ChatLiveWorkspaceProps) {
  const detailActive = !!activeChat;

  return (
    <ShellDivideBlock className="flex min-h-0 flex-1 flex-col gap-shell-block overflow-hidden">
      <ShellSectionHeader
        title="Live conversations"
        description={detailActive ? undefined : 'Select a chat to view and reply'}
      />

      <ShellWorkspace
        detailActive={detailActive}
        fill
        sidebar={
          <ShellPane bodyClassName="px-4">
            <ChatList
              embedded
              chats={chats}
              activeChat={activeChat}
              onSelectChat={onSelectChat}
              onCreateChat={() => {}}
              loading={loading}
            />
          </ShellPane>
        }
        detail={
          <ShellPane>
            {activeChat ? (
              <ChatInterface
                chat={activeChat}
                messages={messages}
                onSendMessage={onSendMessage}
                sendingMessage={sendingMessage}
                onBack={onBack}
              />
            ) : (
              <ShellEmpty className="flex h-full flex-col items-center justify-center gap-3 py-12">
                <MessageSquare className="h-10 w-10 text-shell-faint" />
                <div>
                  <p className="font-medium text-shell-text">Select a conversation</p>
                  <p className="mt-1 text-shell-muted">
                    Choose a chat from the list to view and participate
                  </p>
                </div>
              </ShellEmpty>
            )}
          </ShellPane>
        }
      />
    </ShellDivideBlock>
  );
}
