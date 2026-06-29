import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ConversationThread, Customer } from '../types';

interface UseSMSNewConversationOptions {
  threads: ConversationThread[];
  setSelectedThread: (thread: ConversationThread | null) => void;
  onMissingPhone?: () => void;
}

export function useSMSNewConversation({
  threads,
  setSelectedThread,
  onMissingPhone,
}: UseSMSNewConversationOptions) {
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [manualPhone, setManualPhone] = useState('');
  const [manualName, setManualName] = useState('');

  useEffect(() => {
    if (customerSearch.length < 2) {
      setCustomers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingCustomers(true);
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, full_name, first_name, last_name, phone')
          .or(
            `full_name.ilike.%${customerSearch}%,first_name.ilike.%${customerSearch}%,last_name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%`,
          )
          .limit(10);

        if (error) throw error;
        setCustomers(data || []);
      } catch (error) {
        console.error('Error searching customers:', error);
      } finally {
        setSearchingCustomers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearch]);

  const resetDialog = () => {
    setCustomerSearch('');
    setManualPhone('');
    setManualName('');
    setCustomers([]);
  };

  const handleStartNewConversation = (
    phone: string,
    name: string | null,
    customerId: number | null,
  ) => {
    const existingThread = threads.find((t) => t.phone_number === phone);
    if (existingThread) {
      setSelectedThread(existingThread);
    } else {
      setSelectedThread({
        phone_number: phone,
        customer_id: customerId,
        customer_name: name,
        last_message: '',
        last_message_at: new Date().toISOString(),
        unread_count: 0,
        messages: [],
      });
    }
    setShowNewMessageDialog(false);
    resetDialog();
  };

  const handleStartWithManualPhone = () => {
    if (!manualPhone.trim()) return;
    handleStartNewConversation(manualPhone.trim(), manualName.trim() || null, null);
  };

  const handleSelectCustomer = (customer: Customer) => {
    if (customer.phone) {
      handleStartNewConversation(
        customer.phone,
        customer.full_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
        customer.id,
      );
    } else {
      onMissingPhone?.();
    }
  };

  return {
    showNewMessageDialog,
    setShowNewMessageDialog,
    customerSearch,
    setCustomerSearch,
    customers,
    searchingCustomers,
    manualPhone,
    setManualPhone,
    manualName,
    setManualName,
    handleStartWithManualPhone,
    handleSelectCustomer,
  };
}
