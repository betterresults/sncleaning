import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ChatStats, RecentChatMessage } from '../types';

export function useChatManagementStats(refreshKey: unknown) {
  const [chatStats, setChatStats] = useState<ChatStats>({
    totalChats: 0,
    activeChats: 0,
    customerOfficeChats: 0,
    customerCleanerChats: 0,
    officeCleanerChats: 0,
  });
  const [recentMessages, setRecentMessages] = useState<RecentChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChatStats = useCallback(async () => {
    try {
      const { data: allChats, error } = await supabase
        .from('chats')
        .select('chat_type, is_active');

      if (error) throw error;

      setChatStats({
        totalChats: allChats?.length || 0,
        activeChats: allChats?.filter((chat) => chat.is_active).length || 0,
        customerOfficeChats:
          allChats?.filter((chat) => chat.chat_type === 'customer_office').length || 0,
        customerCleanerChats:
          allChats?.filter((chat) => chat.chat_type === 'customer_cleaner').length || 0,
        officeCleanerChats:
          allChats?.filter((chat) => chat.chat_type === 'office_cleaner').length || 0,
      });
    } catch (error) {
      console.error('Error fetching chat stats:', error);
    }
  }, []);

  const fetchRecentMessages = useCallback(async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          message,
          created_at,
          sender_type,
          sender_id,
          chats!inner(
            id,
            chat_type,
            customer:customers(first_name, last_name),
            cleaner:cleaners(first_name, last_name)
          )
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentMessages((messagesData as RecentChatMessage[]) || []);
    } catch (error) {
      console.error('Error fetching recent messages:', error);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchChatStats(), fetchRecentMessages()]);
    setLoading(false);
  }, [fetchChatStats, fetchRecentMessages]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  return { chatStats, recentMessages, loading, refresh };
}
