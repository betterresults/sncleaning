import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { CustomerLookupResult } from '../types';
import { normalizeUKPhone } from '../utils/normalizeUKPhone';

interface UseCustomerPhoneLookupOptions {
  onError?: (message: string) => void;
}

export function useCustomerPhoneLookup({ onError }: UseCustomerPhoneLookupOptions = {}) {
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<CustomerLookupResult | null>(null);

  const lookupCustomerByPhone = useCallback(
    async (phoneNumber: string) => {
      setLookupLoading(true);
      setLookupResult(null);

      try {
        const phoneVariations = normalizeUKPhone(phoneNumber);
        const last10 = phoneVariations[0];

        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id, full_name, first_name, last_name, email, phone')
          .or(`phone.ilike.%${last10}%,whatsapp.ilike.%${last10}%`)
          .limit(1)
          .maybeSingle();

        if (customerError) throw customerError;

        let bookings: CustomerLookupResult['bookings'] = [];
        let smsConversations: CustomerLookupResult['smsConversations'] = [];
        let emails: CustomerLookupResult['emails'] = [];
        let quoteLead: CustomerLookupResult['quoteLead'] = null;

        if (customerData) {
          const { data: bookingData, error: bookingError } = await supabase
            .from('bookings')
            .select(
              'id, service_type, date_time, address, postcode, total_cost, total_hours, booking_status',
            )
            .eq('customer', customerData.id)
            .order('date_time', { ascending: false })
            .limit(10);

          if (bookingError) throw bookingError;
          bookings = bookingData || [];

          if (customerData.email) {
            const { data: emailData, error: emailError } = await supabase
              .from('notification_logs')
              .select('id, subject, status, created_at, notification_type')
              .eq('recipient_email', customerData.email)
              .order('created_at', { ascending: false })
              .limit(20);

            if (!emailError) {
              emails = emailData || [];
            }
          }
        } else {
          const { data: bookingData, error: bookingError } = await supabase
            .from('bookings')
            .select(
              'id, service_type, date_time, address, postcode, total_cost, total_hours, booking_status, first_name, last_name, email',
            )
            .or(`phone_number.ilike.%${last10}%`)
            .order('date_time', { ascending: false })
            .limit(10);

          if (bookingError) throw bookingError;
          bookings = bookingData || [];

          if (bookings.length > 0) {
            const bookingEmail = (bookings[0] as { email?: string }).email;
            if (bookingEmail) {
              const { data: emailData } = await supabase
                .from('notification_logs')
                .select('id, subject, status, created_at, notification_type')
                .eq('recipient_email', bookingEmail)
                .order('created_at', { ascending: false })
                .limit(20);

              emails = emailData || [];
            }
          }
        }

        const { data: quoteLeadData, error: quoteLeadError } = await supabase
          .from('quote_leads')
          .select(
            'id, first_name, last_name, email, phone, address, postcode, service_type, frequency, calculated_quote, recommended_hours, selected_date, status, created_at',
          )
          .or(`phone.ilike.%${last10}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!quoteLeadError && quoteLeadData) {
          quoteLead = quoteLeadData;

          if (emails.length === 0 && quoteLeadData.email) {
            const { data: emailData } = await supabase
              .from('notification_logs')
              .select('id, subject, status, created_at, notification_type')
              .eq('recipient_email', quoteLeadData.email)
              .order('created_at', { ascending: false })
              .limit(20);

            emails = emailData || [];
          }

          const { data: smsNotificationData } = await supabase
            .from('notification_logs')
            .select('id, subject, status, created_at, notification_type')
            .or(`recipient_email.ilike.%${last10}%`)
            .eq('notification_type', 'sms')
            .order('created_at', { ascending: false })
            .limit(20);

          if (smsNotificationData && smsNotificationData.length > 0) {
            emails = [...emails, ...smsNotificationData];
          }
        }

        const { data: smsData, error: smsError } = await supabase
          .from('sms_conversations')
          .select('id, message, direction, created_at, status')
          .or(`phone_number.ilike.%${last10}%,phone_number.ilike.%44${last10}%`)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!smsError) {
          smsConversations = smsData || [];
        }

        setLookupResult({
          customer: customerData,
          quoteLead,
          bookings,
          smsConversations,
          emails,
        });
      } catch (error) {
        console.error('Error looking up customer:', error);
        onError?.('Could not find customer information');
      } finally {
        setLookupLoading(false);
      }
    },
    [onError],
  );

  const resetLookup = useCallback(() => {
    setLookupResult(null);
  }, []);

  return {
    lookupLoading,
    lookupResult,
    lookupCustomerByPhone,
    resetLookup,
  };
}
