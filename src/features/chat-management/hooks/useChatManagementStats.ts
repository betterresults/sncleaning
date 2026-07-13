import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ChatStats, RecentChatMessage } from '../types';

const EMPTY_STATS: ChatStats = {
  totalChats: 0,
  activeChats: 0,
  customerOfficeChats: 0,
  customerCleanerChats: 0,
  officeCleanerChats: 0,
};

export function useChatManagementStats(refreshKey: unknown) {
  const [chatStats, setChatStats] = useState<ChatStats>(EMPTY_STATS);
  const [recentMessages, setRecentMessages] = useState<RecentChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChatStats = useCallback(async () => {
    const { data: allChats, error: fetchError } = await supabase
      .from('chats')
      .select('chat_type, is_active');

    if (fetchError) throw fetchError;

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
  }, []);

  const fetchRecentMessages = useCallback(async () => {
    const { data: messagesData, error: fetchError } = await supabase
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

    if (fetchError) throw fetchError;
    setRecentMessages((messagesData as RecentChatMessage[]) || []);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchChatStats(), fetchRecentMessages()]);
    } catch (err) {
      console.error('Error fetching chat management stats:', err);
      setChatStats(EMPTY_STATS);
      setRecentMessages([]);
      setError('Failed to load chat stats');
      toast({
        title: 'Error',
        description: 'Failed to load chat stats. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchChatStats, fetchRecentMessages]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  return { chatStats, recentMessages, loading, error, refresh };
}
