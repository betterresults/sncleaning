import type { ChatWithLastMessage } from '@/types/chat';

export type ChatManagementTab = 'overview' | 'conversations' | 'management';

export type ChatTypeFilter =
  | 'all'
  | 'active'
  | 'customer_office'
  | 'customer_cleaner'
  | 'office_cleaner'
  | null;

export interface ChatStats {
  totalChats: number;
  activeChats: number;
  customerOfficeChats: number;
  customerCleanerChats: number;
  officeCleanerChats: number;
}

export interface RecentChatMessage {
  id: string;
  message: string;
  created_at: string;
  sender_type: string;
  sender_id: number;
  chats: {
    id: string;
    chat_type: string;
    customer?: { first_name: string; last_name: string } | null;
    cleaner?: { first_name: string; last_name: string } | null;
  };
}

export interface ChatManagementViewProps {
  chats: ChatWithLastMessage[];
  activeChat: ChatWithLastMessage | null;
  setActiveChat: (chat: ChatWithLastMessage | null) => void;
  messages: import('@/types/chat').ChatMessage[];
  chatLoading: boolean;
  sendingMessage: boolean;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, message: string) => Promise<void>;
}
