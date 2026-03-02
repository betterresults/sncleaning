import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Clock, MapPin, Loader2, Sparkles } from 'lucide-react';
import WhatsNextSection from '@/components/landing/WhatsNextSection';

const SUPABASE_URL = "https://dkomihipebixlegygnoy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4";

interface BookingDetails {
  id: number;
  date_time: string | null;
  address: string;
  postcode: string;
  service_type: string;
  total_cost: number;
  customer: number;
  payment_status: string;
  payment_method: string;
}

interface ServiceTypeSetting {
  label: string;
  badge_color: string;
}

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceTypeLabel, setServiceTypeLabel] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isUrgentBooking, setIsUrgentBooking] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Get bookingId from either location state OR URL query params (for Stripe redirects)
  const bookingIdFromState = location.state?.bookingId;
  const bookingIdFromQuery = searchParams.get('bookingId');
  const paymentSetupSuccess = searchParams.get('payment_setup') === 'success';
  const isUrgent = searchParams.get('urgent') === '1';
  const setupIntentParam = searchParams.get('setup_intent'); // Stripe adds this on redirect return
  const redirectStatus = searchParams.get('redirect_status'); // Stripe adds this on redirect return
  
  // Also check sessionStorage for pending booking (set before Stripe redirect)
  const pendingBookingId = sessionStorage.getItem('pending_booking_id');
  
  const bookingId = bookingIdFromState || bookingIdFromQuery || pendingBookingId;

  // Handle payment method linking and payment processing after Stripe redirect
  useEffect(() => {
    const processPaymentAfterRedirect = async () => {
      // Only process if we have bookingId and this is a redirect return
      if (!bookingId || !setupIntentParam || processingPayment) return;
      
      // Check if redirect was successful
      if (redirectStatus !== 'succeeded') {
        console.log('[BookingConfirmation] Redirect status not succeeded:', redirectStatus);
        // Payment failed during redirect - show the error but keep the booking
        if (redirectStatus === 'failed') {
          // Delete the booking since payment failed
          console.log('[BookingConfirmation] Redirect failed, deleting booking:', bookingId);
          await supabase.functions.invoke('cancel-unpaid-booking', { body: { bookingId: parseInt(bookingId as string) } });
          navigate(`/payment-failed?error=Payment%20was%20declined`);
        }
        return;
      }
      
      console.log('[BookingConfirmation] Processing payment after Stripe redirect...', { bookingId, setupIntentParam });
      setProcessingPayment(true);
      
      try {
        // Step 1: Link the payment method to the booking
        console.log('[BookingConfirmation] Linking payment method to booking...');
        const { data: linkResult, error: linkError } = await supabase.functions.invoke('link-payment-method-to-booking', {
          body: {
            bookingId: parseInt(bookingId as string),
            stripeSetupIntentId: setupIntentParam
          }
        });

        if (linkError) {
          console.error('[BookingConfirmation] Failed to link payment method:', linkError);
          // Don't throw - we can still show the confirmation, payment can be retried later
        } else {
          console.log('[BookingConfirmation] Payment method linked successfully:', linkResult);
        }

        // Step 2: Process the payment (charge for urgent, authorize for non-urgent)
        const action = isUrgent ? 'charge' : 'authorize';
        console.log(`[BookingConfirmation] Processing payment action: ${action}`);
        
        const { data: paymentResult, error: paymentError } = await supabase.functions.invoke(
          'system-payment-action',
          {
            body: {
              bookingId: parseInt(bookingId as string),
              action: action
            }
          }
        );

        if (paymentError || !paymentResult?.success) {
          console.error('[BookingConfirmation] Payment processing failed:', paymentError || paymentResult);
          // Delete the booking since payment failed
          console.log('[BookingConfirmation] Payment failed, deleting booking:', bookingId);
          await supabase.functions.invoke('cancel-unpaid-booking', { body: { bookingId: parseInt(bookingId as string) } });
          navigate(`/payment-failed?error=${encodeURIComponent(paymentResult?.error || 'Payment could not be processed. Please try again.')}`);
          return;
        } else {
          console.log('[BookingConfirmation] Payment processed successfully:', paymentResult);
          setPaymentSuccess(true);
        }

      } catch (error) {
        console.error('[BookingConfirmation] Error processing payment after redirect:', error);
      } finally {
        setProcessingPayment(false);
      }
    };

    processPaymentAfterRedirect();
  }, [bookingId, setupIntentParam, redirectStatus, isUrgent, navigate, processingPayment]);

  useEffect(() => {
    // Clear pending booking from session storage once we have it
    if (pendingBookingId && bookingId) {
      sessionStorage.removeItem('pending_booking_id');
    }
    
    // Set payment success state if coming from Stripe (no redirect, immediate success)
    if (paymentSetupSuccess && !setupIntentParam) {
      setPaymentSuccess(true);
      setIsUrgentBooking(isUrgent);
    }
    
    // Clear payment redirect flag since we've returned successfully
    localStorage.removeItem('payment_redirect_in_progress');
    
    // Mark the quote lead as completed now that payment is done
    const quoteSessionId = sessionStorage.getItem('pending_quote_session_id') || localStorage.getItem('quote_session_id');
    const quoteCost = sessionStorage.getItem('pending_quote_cost');
    
    if (quoteSessionId && bookingId) {
      console.log('📊 Marking quote lead as completed on Stripe return:', { quoteSessionId, bookingId, quoteCost });
      
      // Update localStorage to prevent beforeunload from overwriting
      localStorage.setItem('quote_furthest_step', 'booking_completed');
      
      // Update the quote lead in the database
      const updateQuoteLead = async () => {
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/track-funnel-event`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              table: 'quote_leads',
              data: {
                session_id: quoteSessionId,
                status: 'completed',
                furthest_step: 'booking_completed',
                converted_booking_id: parseInt(bookingId as string),
                ...(quoteCost && { calculated_quote: parseFloat(quoteCost) }),
                updated_at: new Date().toISOString(),
              },
            }),
          });
          console.log('✅ Quote lead marked as completed');
          
          // Clean up session storage
          sessionStorage.removeItem('pending_quote_session_id');
          sessionStorage.removeItem('pending_quote_cost');
        } catch (err) {
          console.error('❌ Error marking quote lead as completed:', err);
        }
      };
      
      updateQuoteLead();
    }
  }, [pendingBookingId, bookingId, paymentSetupSuccess, isUrgent, setupIntentParam]);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

      const fetchBooking = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('id, date_time, address, postcode, service_type, total_cost, customer, payment_status, payment_method')
          .eq('id', bookingId)
          .maybeSingle();

        if (error) throw error;
        setBooking(data);

        // Fetch service type label from company_settings
        if (data?.service_type) {
          const { data: settingData } = await supabase
            .from('company_settings')
            .select('setting_value')
            .eq('setting_category', 'service_type')
            .eq('setting_key', data.service_type)
            .eq('is_active', true)
            .single();

          if (settingData?.setting_value) {
            const settingValue = settingData.setting_value as Record<string, any>;
            setServiceTypeLabel(settingValue.label || data.service_type);
          } else {
            setServiceTypeLabel(data.service_type.replace('-', ' '));
          }
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, navigate]);

  if (loading || processingPayment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#185166] via-[#1a5f75] to-[#18A5A5]">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
        {processingPayment && (
          <p className="mt-4 text-white/80 font-medium">Processing your payment...</p>
        )}
      </div>
    );
  }

  // Shared branded wrapper
  const BrandedWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-br from-[#185166] via-[#1a5f75] to-[#18A5A5]">
      <div className="pt-12 pb-6 px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          SN Cleaning Services
        </div>
      </div>
      <div className="px-4 pb-12">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );

  if (!booking && !bookingId) {
    return (
      <BrandedWrapper>
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
            <CheckCircle className="h-20 w-20 text-green-500 relative" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#185166] mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-2">Your booking has been received.</p>
          <p className="text-sm text-gray-500 mb-6">We'll send you a confirmation email shortly.</p>
          <Button onClick={() => navigate('/auth')} className="bg-[#18A5A5] hover:bg-[#159090] h-12 px-8 text-base font-bold rounded-xl">
            Log In to Your Account
          </Button>
        </div>
        <WhatsNextSection />
      </BrandedWrapper>
    );
  }

  if (!booking && bookingId) {
    return (
      <BrandedWrapper>
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
            <CheckCircle className="h-20 w-20 text-green-500 relative" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#185166] mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-4">Your booking #{bookingId} has been successfully created.</p>
          {paymentSuccess && (
            <p className="text-green-600 font-medium mb-4">
              {isUrgentBooking || isUrgent ? 'Payment received successfully!' : 'Card details saved successfully!'}
            </p>
          )}
          <p className="text-sm text-gray-500 mb-6">You'll receive a confirmation email shortly with all the details.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => navigate('/auth')} className="flex-1 bg-[#18A5A5] hover:bg-[#159090] h-12 text-base font-bold rounded-xl">
              Log In / Sign Up
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" className="flex-1 h-12 text-base rounded-xl">
              Back to Home
            </Button>
          </div>
        </div>
        <WhatsNextSection />
      </BrandedWrapper>
    );
  }

  return (
    <BrandedWrapper>
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 mb-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
            <CheckCircle className="h-20 w-20 text-green-500 relative" />
          </div>
        </div>

        {/* Payment Success Message */}
        {paymentSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-green-700 font-medium">
              {isUrgentBooking || isUrgent ? '✓ Payment received successfully!' : '✓ Card details saved successfully!'}
            </p>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#185166] text-center mb-3">
          Booking Confirmed!
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Thank you! Your booking has been successfully created.
        </p>

        {/* Booking Details */}
        <div className="space-y-6 bg-gray-50 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-[#185166] mb-4">Booking Details</h2>
          
          <div className="flex items-start gap-4">
            <Calendar className="h-6 w-6 text-[#18A5A5] mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              {booking.date_time ? (
                <>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(booking.date_time).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-base text-gray-700">
                    {new Date(booking.date_time).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </>
              ) : (
                <p className="text-lg text-gray-500">Date & time to be confirmed</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <MapPin className="h-6 w-6 text-[#18A5A5] mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="text-lg font-semibold text-gray-900">
                {booking.address}
                <br />
                {booking.postcode}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Service Type</span>
              <span className="font-semibold text-gray-900">
                {serviceTypeLabel || booking.service_type.replace('-', ' ')}
              </span>
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-gray-600">Total Cost</span>
              <span className="text-2xl font-bold text-[#185166]">
                £{booking.total_cost.toFixed(2)}
              </span>
            </div>
            {booking.payment_status && (
              <div className="flex justify-between items-center mt-3">
                <span className="text-gray-600">Payment Status</span>
                <span className={`font-semibold ${
                  booking.payment_status.toLowerCase() === 'paid' ? 'text-green-600' :
                  booking.payment_status.toLowerCase() === 'authorized' ? 'text-blue-600' :
                  'text-orange-600'
                }`}>
                  {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => navigate('/auth')}
            className="flex-1 h-12 text-base font-bold bg-[#18A5A5] hover:bg-[#159090] rounded-xl"
          >
            Log In to Your Account
          </Button>
          <Button
            onClick={() => navigate('/airbnb')}
            variant="outline"
            className="flex-1 h-12 text-base rounded-xl"
          >
            Book Another Service
          </Button>
        </div>
      </div>

      <WhatsNextSection />
    </BrandedWrapper>
  );
};

export default BookingConfirmation;
