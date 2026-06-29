import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ConversationThread, SMSConversation } from '../types';

interface UseSMSConversationsOptions {
  onSendError?: (message: string) => void;
}

export function useSMSConversations({ onSendError }: UseSMSConversationsOptions = {}) {
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ConversationThread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const selectedPhoneRef = useRef<string | null>(null);

  useEffect(() => {
    selectedPhoneRef.current = selectedThread?.phone_number ?? null;
  }, [selectedThread?.phone_number]);

  const fetchConversations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sms_conversations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const grouped = (data || []).reduce(
        (acc: Record<string, ConversationThread>, msg: SMSConversation) => {
          const conversation: SMSConversation = {
            ...msg,
            direction: msg.direction as 'incoming' | 'outgoing',
          };
          const phone = conversation.phone_number;
          if (!acc[phone]) {
            acc[phone] = {
              phone_number: phone,
              customer_id: conversation.customer_id,
              customer_name: conversation.customer_name,
              last_message: conversation.message,
              last_message_at: conversation.created_at,
              unread_count: 0,
              messages: [],
            };
          }
          acc[phone].messages.push(conversation);
          if (conversation.direction === 'incoming' && !conversation.read_at) {
            acc[phone].unread_count++;
          }
          if (conversation.customer_name && !acc[phone].customer_name) {
            acc[phone].customer_name = conversation.customer_name;
            acc[phone].customer_id = conversation.customer_id;
          }
          return acc;
        },
        {},
      );

      const sortedThreads = Object.values(grouped)
        .sort(
          (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime(),
        )
        .map((thread) => ({
          ...thread,
          messages: thread.messages.reverse(),
        }));

      setThreads(sortedThreads);

      const activePhone = selectedPhoneRef.current;
      if (activePhone) {
        const updated = sortedThreads.find((t) => t.phone_number === activePhone);
        if (updated) setSelectedThread(updated);
      }
    } catch (error) {
      console.error('Error fetching SMS conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel('sms-conversations-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sms_conversations' },
        (payload) => {
          console.log('New SMS received:', payload);
          fetchConversations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations]);

  useEffect(() => {
    if (messagesEndRef.current && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [selectedThread?.messages]);

  const markMessagesAsRead = useCallback(
    async (phoneNumber: string) => {
      const thread = threads.find((t) => t.phone_number === phoneNumber);
      if (!thread) return;

      const unreadIds = thread.messages
        .filter((m) => m.direction === 'incoming' && !m.read_at)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from('sms_conversations')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadIds);

        fetchConversations();
      }
    },
    [threads, fetchConversations],
  );

  const handleSelectThread = useCallback(
    async (thread: ConversationThread) => {
      setSelectedThread(thread);
      await markMessagesAsRead(thread.phone_number);
    },
    [markMessagesAsRead],
  );

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedThread) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms-reply', {
        body: {
          to: selectedThread.phone_number,
          message: newMessage.trim(),
          customer_id: selectedThread.customer_id,
          customer_name: selectedThread.customer_name,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setNewMessage('');
        fetchConversations();
      } else {
        throw new Error(data?.error || 'Failed to send SMS');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send SMS';
      console.error('Error sending SMS:', error);
      onSendError?.(message);
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedThread, fetchConversations, onSendError]);

  const filteredThreads = threads.filter((thread) => {
    const search = searchTerm.toLowerCase();
    return (
      thread.phone_number.includes(search) ||
      thread.customer_name?.toLowerCase().includes(search)
    );
  });

  const totalUnread = threads.reduce((sum, t) => sum + t.unread_count, 0);
  const unreadConversationCount = threads.filter((t) => t.unread_count > 0).length;

  const openFirstUnreadThread = useCallback(async () => {
    const unreadThread = threads.find((t) => t.unread_count > 0);
    if (unreadThread) {
      setSelectedThread(unreadThread);
      await markMessagesAsRead(unreadThread.phone_number);
    }
  }, [threads, markMessagesAsRead]);

  return {
    threads,
    selectedThread,
    setSelectedThread,
    newMessage,
    setNewMessage,
    sending,
    loading,
    searchTerm,
    setSearchTerm,
    messagesEndRef,
    scrollAreaRef,
    filteredThreads,
    totalUnread,
    unreadConversationCount,
    handleSelectThread,
    handleSendMessage,
    markMessagesAsRead,
    openFirstUnreadThread,
  };
}
