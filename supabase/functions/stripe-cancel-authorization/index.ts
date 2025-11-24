import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CancelAuthorizationRequest {
  bookingId: number;
  paymentIntentId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { bookingId, paymentIntentId } = await req.json() as CancelAuthorizationRequest;

    console.log(`Cancelling authorization for booking ${bookingId}, Payment Intent: ${paymentIntentId}`);

    // Get Stripe secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    // Cancel the Payment Intent in Stripe
    const cancelResponse = await fetch(
      `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!cancelResponse.ok) {
      const errorData = await cancelResponse.json();
      console.error('Stripe cancellation error:', errorData);
      
      // If already cancelled or succeeded, just update status
      if (errorData.error?.code === 'payment_intent_unexpected_state') {
        console.log('Payment Intent already in final state, updating booking status only');
      } else {
        throw new Error(`Stripe API error: ${errorData.error?.message || 'Unknown error'}`);
      }
    } else {
      const cancelledIntent = await cancelResponse.json();
      console.log('Payment Intent cancelled successfully:', cancelledIntent.id);
    }

    // Update booking payment status to 'cancelled'
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({ 
        payment_status: 'cancelled',
        invoice_id: null // Clear the payment intent reference
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      throw updateError;
    }

    // Also update past_bookings if exists
    await supabaseClient
      .from('past_bookings')
      .update({ 
        payment_status: 'cancelled',
        invoice_id: null
      })
      .eq('id', bookingId);

    // Log the activity
    await supabaseClient.rpc('log_activity', {
      p_user_id: null,
      p_action_type: 'payment_authorization_cancelled',
      p_entity_type: 'booking',
      p_entity_id: bookingId.toString(),
      p_details: {
        payment_intent_id: paymentIntentId,
        reason: 'Booking cancelled'
      }
    });

    console.log(`Successfully cancelled authorization for booking ${bookingId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Authorization cancelled and funds released',
        bookingId,
        paymentIntentId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in stripe-cancel-authorization:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
