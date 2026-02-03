import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadSMSCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { userRole } = useAuth();

  useEffect(() => {
    // Only fetch for admins
    if (userRole !== 'admin') {
      setLoading(false);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('sms_conversations')
          .select('*', { count: 'exact', head: true })
          .eq('direction', 'inbound')
          .is('read_at', null);

        if (error) {
          console.error('Error fetching unread SMS count:', error);
          return;
        }

        setCount(count || 0);
      } catch (err) {
        console.error('Error in useUnreadSMSCount:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('unread-sms-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sms_conversations' },
        () => {
          // Refetch count on any change
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole]);

  return { count, loading };
}
