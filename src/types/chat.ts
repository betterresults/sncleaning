export type ChatType = 'customer_office' | 'customer_cleaner' | 'office_cleaner';
export type SenderType = 'customer' | 'cleaner' | 'admin';
export type MessageType = 'text' | 'image' | 'file';

export interface Chat {
  id: string;
  booking_id?: number;
  customer_id?: number;
  cleaner_id?: number;
  chat_type: ChatType;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  is_active: boolean;
  // Populated via joins
  customer?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  cleaner?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  booking?: {
    id: number;
    service_type: string;
    date_time: string;
    address: string;
  };
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_type: SenderType;
  sender_id: number;
  message: string;
  message_type: MessageType;
  file_url?: string;
  is_read: boolean;
  created_at: string;
  edited_at?: string;
  is_deleted: boolean;
  // Populated for display
  sender_name?: string;
}

export interface ChatWithLastMessage extends Chat {
  last_message?: ChatMessage;
  unread_count?: number;
}