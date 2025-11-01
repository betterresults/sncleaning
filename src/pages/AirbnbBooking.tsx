import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import BookingForm from '../../sn-cleaning-booking-forms-main/src/components/booking/BookingForm';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

// Fetch Stripe publishable key from Supabase edge function
let stripePromise: Promise<Stripe | null> | null = null;

const getStripeKey = async () => {
  const { data, error } = await supabase.functions.invoke('get-stripe-key');
  
  if (error) {
    console.error('Error fetching Stripe key:', error);
    throw error;
  }
  
  if (!data?.publishableKey) {
    throw new Error('No Stripe publishable key received');
  }
  
  return data.publishableKey;
};

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = getStripeKey().then(key => loadStripe(key));
  }
  return stripePromise;
};

const AirbnbBooking = () => {
  const [stripe, setStripe] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    setStripe(getStripe());
  }, []);

  if (!stripe) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading payment system...</p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripe}>
      <BookingForm />
    </Elements>
  );
};

export default AirbnbBooking;
