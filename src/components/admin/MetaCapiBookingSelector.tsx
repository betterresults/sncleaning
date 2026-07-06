import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatLondonDateTime } from '@/lib/ukTime';

interface BookingMatch {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  total_cost: number | null;
  service_type: string | null;
  date_submited: string | null;
  booking_status: string | null;
}

interface QuoteLeadSummary {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface MetaCapiBookingSelectorProps {
  lead: QuoteLeadSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinked?: (bookingId: number) => void;
}

export const MetaCapiBookingSelector: React.FC<MetaCapiBookingSelectorProps> = ({
  lead,
  open,
  onOpenChange,
  onLinked,
}) => {
  const { toast } = useToast();
  const [matches, setMatches] = useState<BookingMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const search = useCallback(async () => {
    setLoading(true);
    setSelectedId(null);
    setMatches([]);

    const email = lead.email?.trim().toLowerCase();
    const phoneDigits = lead.phone?.replace(/[^\d]/g, '') || '';
    const likePhone = phoneDigits.length >= 7 ? `%${phoneDigits.slice(-7)}%` : null;

    if (!email && !likePhone) {
      setLoading(false);
      return;
    }

    let query = supabase
      .from('bookings')
      .select(
        'id, first_name, last_name, email, phone_number, total_cost, service_type, date_submited, booking_status'
      )
      .order('date_submited', { ascending: false });

    if (email && likePhone) {
      query = query.or(`email.ilike.${email},phone_number.ilike.${likePhone}`);
    } else if (email) {
      query = query.ilike('email', email);
    } else if (likePhone) {
      query = query.ilike('phone_number', likePhone as string);
    }

    const { data, error } = await query.limit(20);
    if (error) {
      toast({
        title: 'Search failed',
        description: error.message,
        variant: 'destructive',
      });
      setMatches([]);
    } else {
      setMatches((data as BookingMatch[]) || []);
      if ((data as BookingMatch[])?.length === 1) {
        setSelectedId((data as BookingMatch[])[0].id);
      }
    }
    setLoading(false);
  }, [lead, toast]);

  useEffect(() => {
    if (open) search();
  }, [open, search]);

  const handleSend = async () => {
    if (!selectedId) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('meta-capi-offline-purchase', {
        body: { booking_id: selectedId },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Failed to send');

      // Link the booking to the lead so future sends are one-click.
      const { error: updateErr } = await supabase
        .from('quote_leads')
        .update({ converted_booking_id: selectedId })
        .eq('id', lead.id);
      if (updateErr) console.warn('Could not update converted_booking_id:', updateErr);

      onLinked?.(selectedId);
      toast({
        title: 'Sent to Meta Ads',
        description: `Purchase event for Booking #${selectedId} sent.`,
      });
      onOpenChange(false);
    } catch (err: any) {
      console.error('Meta CAPI send failed', err);
      toast({
        title: 'Failed to send to Meta',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const formatCost = (v: number | null) =>
    typeof v === 'number' ? `£${v.toFixed(2)}` : '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send this lead’s purchase to Meta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Select the booking created for{' '}
            <span className="font-medium text-foreground">
              {lead.first_name || ''} {lead.last_name || ''}
            </span>
            {lead.email ? ` (${lead.email})` : ''}. Meta will receive the
            purchase value and customer hashes from that booking.
          </p>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <p>No matching bookings found.</p>
              <p>
                Make sure the booking email or phone matches this lead, then
                retry.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {matches.map((b) => {
                const isSelected = selectedId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedId(b.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-sm">
                          Booking #{b.id}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {b.first_name} {b.last_name} • {b.email} •{' '}
                          {b.phone_number}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-primary whitespace-nowrap">
                        {formatCost(b.total_cost)}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{b.service_type || 'Cleaning'}</span>
                      <span>•</span>
                      <span>
                        {b.date_submited
                          ? formatLondonDateTime(b.date_submited)
                          : 'No date'}
                      </span>
                      {b.booking_status && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{b.booking_status}</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedId || sending || matches.length === 0}
            className="gap-1.5"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Send to Meta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MetaCapiBookingSelector;
