import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatLondonDateTime } from '@/lib/ukTime';

interface MetaCapiReportButtonProps {
  bookingId: number;
  alreadySentAt?: string | null;
  onSent?: (sentAt: string) => void;
}

/**
 * Sends a Meta Conversions API "Purchase" event for an offline / WhatsApp
 * booking. Idempotent: re-sending uses the same event_id so Meta dedups.
 */
export const MetaCapiReportButton: React.FC<MetaCapiReportButtonProps> = ({
  bookingId,
  alreadySentAt,
  onSent,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sentAt, setSentAt] = useState<string | null>(alreadySentAt ?? null);

  const handleSend = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('meta-capi-offline-purchase', {
        body: { booking_id: bookingId },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Failed to send');
      const ts = new Date().toISOString();
      setSentAt(ts);
      onSent?.(ts);
      toast({
        title: 'Reported to Meta Ads',
        description: `Purchase event sent (event_id: ${data.event_id}).`,
      });
    } catch (err: any) {
      console.error('Meta CAPI offline send failed', err);
      toast({
        title: 'Failed to report to Meta',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (sentAt) {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSend}
          disabled={loading}
          className="border-primary text-primary hover:bg-primary/10"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />}
          Sent to Meta · resend
        </Button>
        <span className="text-xs text-muted-foreground">
          {formatLondonDateTime(sentAt)}
        </span>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleSend}
      disabled={loading}
      className="border-primary text-primary hover:bg-primary/10"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
      Send to Meta
    </Button>
  );
};

export default MetaCapiReportButton;