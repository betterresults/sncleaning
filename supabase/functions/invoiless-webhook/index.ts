import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, invoiless-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('Received Invoiless webhook:', JSON.stringify(payload));

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const eventType = payload.type;
    const invoiceData = payload.data;

    if (!invoiceData?.id) {
      throw new Error('Invalid webhook payload: missing invoice ID');
    }

    let newPaymentStatus: string | null = null;

    // Map Invoiless events to payment statuses
    switch (eventType) {
      case 'invoice.paid':
        newPaymentStatus = 'Paid';
        console.log(`Invoice ${invoiceData.id} marked as paid`);
        break;
      case 'invoice.viewed':
        console.log(`Invoice ${invoiceData.id} was viewed`);
        // Don't update status for viewed events
        break;
      case 'invoice.sent':
        newPaymentStatus = 'Invoice Sent';
        console.log(`Invoice ${invoiceData.id} was sent`);
        break;
      case 'invoice.overdue':
        newPaymentStatus = 'Overdue';
        console.log(`Invoice ${invoiceData.id} is overdue`);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    if (newPaymentStatus) {
      // Update bookings table
      const { error: bookingError } = await supabaseClient
        .from('bookings')
        .update({ payment_status: newPaymentStatus })
        .eq('invoice_id', invoiceData.id);

      if (bookingError) {
        console.error('Error updating bookings:', bookingError);
      }

      // Update past_bookings table
      const { error: pastBookingError } = await supabaseClient
        .from('past_bookings')
        .update({ payment_status: newPaymentStatus })
        .eq('invoice_id', invoiceData.id);

      if (pastBookingError) {
        console.error('Error updating past_bookings:', pastBookingError);
      }

      console.log(`Updated payment status to: ${newPaymentStatus}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Error in invoiless-webhook:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
