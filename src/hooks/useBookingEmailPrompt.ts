import { useState, useCallback } from 'react';
import { useManualEmailNotification, EmailNotificationOptions } from './useManualEmailNotification';

interface BookingEmailPromptOptions {
  onComplete?: () => void;
  defaultEmailType?: EmailNotificationOptions['emailType'];
}

export function useBookingEmailPrompt(options?: BookingEmailPromptOptions) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingEmailOptions, setPendingEmailOptions] = useState<EmailNotificationOptions | null>(null);
  const { sendManualEmail, isLoading } = useManualEmailNotification();

  const promptForEmail = useCallback((emailOptions: EmailNotificationOptions) => {
    setPendingEmailOptions(emailOptions);
    setShowConfirmDialog(true);
  }, []);

  const handleConfirmEmail = useCallback(async () => {
    if (pendingEmailOptions) {
      const success = await sendManualEmail(pendingEmailOptions);
      if (success && options?.onComplete) {
        options.onComplete();
      }
    }
    setPendingEmailOptions(null);
    setShowConfirmDialog(false);
  }, [pendingEmailOptions, sendManualEmail, options]);

  const handleCancelEmail = useCallback(() => {
    if (options?.onComplete) {
      options.onComplete();
    }
    setPendingEmailOptions(null);
    setShowConfirmDialog(false);
  }, [options]);

  return {
    showConfirmDialog,
    setShowConfirmDialog,
    pendingEmailOptions,
    promptForEmail,
    handleConfirmEmail,
    handleCancelEmail,
    isLoading,
  };
}