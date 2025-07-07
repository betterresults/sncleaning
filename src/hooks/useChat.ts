import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Chat, ChatMessage, ChatWithLastMessage, ChatType } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';

export const useChat = (selectedCleanerId?: number) => {
  const { user, userRole, customerId, cleanerId } = useAuth();
  // Use selectedCleanerId for admin viewing, otherwise use authenticated cleaner's ID
  const effectiveCleanerId = userRole === 'admin' ? selectedCleanerId : cleanerId;
  const [chats, setChats] = useState<ChatWithLastMessage[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch user's chats
  const fetchChats = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('chats')
        .select(`
          *,
          customer:customers(id, first_name, last_name, email),
          cleaner:cleaners(id, first_name, last_name, email),
          booking:bookings(id, service_type, date_time, address)
        `)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false });

      // Filter based on user role
      if (userRole === 'admin') {
        // If admin is viewing as a specific cleaner, filter by that cleaner
        if (selectedCleanerId) {
          query = query.eq('cleaner_id', selectedCleanerId);
        }
        // Otherwise admins see all chats (no additional filter)
      } else if (userRole === 'user' && effectiveCleanerId) {
        query = query.eq('cleaner_id', effectiveCleanerId);
      } else if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get last message and unread count for each chat
      const chatsWithDetails = await Promise.all(
        (data || []).map(async (chat) => {
          const { data: lastMessage } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('chat_id', chat.id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('id', { count: 'exact' })
            .eq('chat_id', chat.id)
            .eq('is_read', false)
            .eq('is_deleted', false);

          return {
            ...chat,
            last_message: lastMessage,
            unread_count: unreadCount || 0
          };
        })
      );

      setChats(chatsWithDetails);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, [user, userRole, customerId, effectiveCleanerId, selectedCleanerId]);

  // Fetch messages for a specific chat
  const fetchMessages = useCallback(async (chatId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('chat_id', chatId)
        .eq('is_read', false);

    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (chatId: string, message: string) => {
    if (!user || !message.trim()) return;

    setSendingMessage(true);
    try {
      let senderId: number;
      let senderType: 'customer' | 'cleaner' | 'admin';

      if (userRole === 'admin') {
        senderId = parseInt(user.id); // Use auth user ID for admin
        senderType = 'admin';
      } else if (effectiveCleanerId) {
        senderId = effectiveCleanerId;
        senderType = 'cleaner';
      } else if (customerId) {
        senderId = customerId;
        senderType = 'customer';
      } else {
        throw new Error('No valid sender ID found');
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_type: senderType,
          sender_id: senderId,
          message: message.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      // Refresh messages
      await fetchMessages(chatId);

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  }, [user, userRole, customerId, effectiveCleanerId, fetchMessages]);

  // Create a new chat
  const createChat = useCallback(async (
    chatType: ChatType,
    customerId?: number,
    cleanerId?: number,
    bookingId?: number
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({
          chat_type: chatType,
          customer_id: customerId,
          cleaner_id: cleanerId,
          booking_id: bookingId
        })
        .select()
        .single();

      if (error) throw error;

      await fetchChats();
      return data;

    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  }, [user, fetchChats]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const chatSubscription = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as ChatMessage;
            if (activeChat && newMessage.chat_id === activeChat.id) {
              setMessages(prev => [...prev, newMessage]);
            }
            fetchChats(); // Refresh chat list
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatSubscription);
    };
  }, [user, activeChat, fetchChats]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return {
    chats,
    activeChat,
    setActiveChat,
    messages,
    loading,
    sendingMessage,
    fetchChats,
    fetchMessages,
    sendMessage,
    createChat
  };
};