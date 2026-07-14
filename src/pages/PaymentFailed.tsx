import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cleanupDone, setCleanupDone] = useState(false);
  const [cleanupFailed, setCleanupFailed] = useState(false);

  const errorMessage = searchParams.get('error') || 'Your payment could not be processed.';
  const bookingId = searchParams.get('bookingId');

  // Clear payment redirect flag and cancel any unpaid orphan booking left from a failed checkout.
  useEffect(() => {
    localStorage.removeItem('payment_redirect_in_progress');

    let cancelled = false;

    const cleanupOrphan = async () => {
      if (!bookingId) {
        setCleanupDone(true);
        return;
      }

      try {
        const parsedId = parseInt(bookingId, 10);
        if (!Number.isFinite(parsedId)) {
          setCleanupDone(true);
          return;
        }

        const { data, error } = await supabase.functions.invoke('cancel-unpaid-booking', {
          body: { bookingId: parsedId },
        });

        if (cancelled) return;

        if (error) {
          console.error('[PaymentFailed] Failed to cancel unpaid booking:', error);
          setCleanupFailed(true);
        } else if (data && data.success === false && data.error === 'Booking is already paid') {
          // Paid bookings must not be cancelled — leave truth-telling to support path.
          setCleanupFailed(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[PaymentFailed] Unexpected cancel error:', error);
          setCleanupFailed(true);
        }
      } finally {
        if (!cancelled) setCleanupDone(true);
      }
    };

    cleanupOrphan();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const handleTryAgain = () => {
    const returnPath = sessionStorage.getItem('booking_form_path') || '/domestic';
    navigate(returnPath);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
            <XCircle className="h-20 w-20 text-red-500 relative" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment Failed</h1>

        <p className="text-gray-600 mb-6">{errorMessage}</p>

        {!cleanupDone && bookingId ? (
          <div className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cleaning up incomplete booking…
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-6">
            {cleanupFailed
              ? 'Payment did not complete. If a booking appears in your account unpaid, please contact support so we can remove it.'
              : 'Payment did not complete. Any incomplete booking has been cancelled so you will not be charged. Please try again with a different payment method.'}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleTryAgain}
            className="w-full h-12 bg-[#185166] hover:bg-[#185166]/90"
            disabled={!cleanupDone && !!bookingId}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>

          <Button onClick={() => navigate('/')} variant="outline" className="w-full h-12">
            Back to Home
          </Button>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          If you continue to experience issues, please contact our support team.
        </p>
      </div>
    </div>
  );
};

export default PaymentFailed;
