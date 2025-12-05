import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SystemPaymentActionRequest {
  bookingId: number
  action: 'authorize' | 'charge' | 'retry'
  amount?: number
  paymentMethodId?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { bookingId, action, amount, paymentMethodId }: SystemPaymentActionRequest = await req.json()

    if (!bookingId || !action) {
      throw new Error('Booking ID and action are required')
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured')
    }

    console.log(`System payment action: ${action} for booking ${bookingId}`)

    // Smart table detection - try bookings first, then past_bookings
    let booking: any = null;
    let isUpcoming = false;
    let isPast = false;

    // First try upcoming bookings
    const { data: upcomingBooking, error: upcomingError } = await supabaseClient
      .from('bookings')
      .select(`
        *,
        customers!bookings_customer_fkey (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('id', bookingId)
      .maybeSingle()

    if (upcomingBooking) {
      booking = upcomingBooking;
      isUpcoming = true;
      console.log(`Found booking in upcoming bookings table`);
    } else {
      // Try past bookings
      const { data: pastBooking, error: pastError } = await supabaseClient
        .from('past_bookings')
        .select(`
          *,
          cleaners!past_bookings_cleaner_fkey (
            first_name,
            last_name
          )
        `)
        .eq('id', bookingId)
        .maybeSingle()

      if (pastBooking) {
        // Handle past booking structure - need to get customer info separately
        const { data: customer } = await supabaseClient
          .from('customers')
          .select('id, email, first_name, last_name')
          .eq('id', pastBooking.customer)
          .single()

        booking = {
          ...pastBooking,
          total_cost: typeof pastBooking.total_cost === 'string' 
            ? parseFloat(pastBooking.total_cost) || 0 
            : pastBooking.total_cost,
          customers: customer
        };
        isPast = true;
        console.log(`Found booking in past bookings table`);
      }
    }

    if (!booking) {
      throw new Error('Booking not found in either upcoming or completed bookings')
    }

    // CRITICAL: Check if booking is cancelled - skip payment processing for cancelled bookings
    const bookingStatus = booking.booking_status?.toLowerCase() || '';
    if (bookingStatus.includes('cancelled') || bookingStatus.includes('canceled')) {
      console.log(`Booking ${bookingId} is cancelled - skipping payment processing`)
      return new Response(
        JSON.stringify({ 
          success: false, 
          action: 'skipped',
          message: 'Booking is cancelled - payment processing skipped',
          bookingId,
          bookingStatus: booking.booking_status
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Get customer's payment methods
    const { data: paymentMethods, error: pmError } = await supabaseClient
      .from('customer_payment_methods')
      .select('*')
      .eq('customer_id', booking.customer)
      .eq('is_default', true)

    let selectedPaymentMethod = paymentMethods?.[0]

    // If specific payment method provided, use that
    if (paymentMethodId) {
      const { data: specificPM } = await supabaseClient
        .from('customer_payment_methods')
        .select('*')
        .eq('stripe_payment_method_id', paymentMethodId)
        .eq('customer_id', booking.customer)
        .single()

      if (specificPM) {
        selectedPaymentMethod = specificPM
      }
    }

    if (!selectedPaymentMethod) {
      throw new Error('No payment method available for this customer')
    }

    const paymentAmount = amount || booking.total_cost
    const amountInCents = Math.round(paymentAmount * 100)

    let result: any = {}

    if (action === 'authorize') {
      // CRITICAL: Check if payment is already completed or authorized to prevent double charging
      if (booking.payment_status === 'paid' || booking.payment_status === 'Paid' || 
          booking.payment_status === 'authorized' || booking.payment_status === 'Authorized') {
        console.log(`Booking ${bookingId} already has payment status '${booking.payment_status}' - skipping authorization`)
        return new Response(
          JSON.stringify({ 
            success: true, 
            action: 'already_processed',
            message: `Booking already has payment status: ${booking.payment_status}`,
            bookingId,
            paymentStatus: booking.payment_status
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }
      
      // Create payment intent for authorization only
      const paymentIntentResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          amount: amountInCents.toString(),
          currency: 'gbp',
          customer: selectedPaymentMethod.stripe_customer_id,
          payment_method: selectedPaymentMethod.stripe_payment_method_id,
          capture_method: 'manual',
          confirm: 'true',
          return_url: 'https://dkomihipebixlegygnoy.supabase.co/payment-return',
          description: `Authorization for booking ${bookingId}`,
        }),
      })

      const paymentIntent = await paymentIntentResponse.json()

      if (paymentIntent.error) {
        console.error(`Authorization failed for booking ${bookingId}:`, JSON.stringify(paymentIntent.error))
        
        // Update booking status to failed in correct table
        if (isUpcoming) {
          await supabaseClient
            .from('bookings')
            .update({ payment_status: 'failed' })
            .eq('id', bookingId)
        } else if (isPast) {
          await supabaseClient
            .from('past_bookings')
            .update({ payment_status: 'failed' })
            .eq('id', bookingId)
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `${paymentIntent.error.message}`,
            stripeErrorCode: paymentIntent.error.code || null,
            stripeErrorType: paymentIntent.error.type || null,
            stripeDeclineCode: paymentIntent.error.decline_code || null,
            action: 'authorize',
            bookingId,
            rawStripeError: paymentIntent.error
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 so cron doesn't retry, but mark as failed
          }
        )
      }

      // Handle different payment statuses - including 3D Secure requirements
      if (paymentIntent.status === 'requires_action') {
        console.log(`Booking ${bookingId} requires 3D Secure authentication`)
        
        // Update booking to show it requires action
        if (isUpcoming) {
          await supabaseClient
            .from('bookings')
            .update({ payment_status: 'requires_action' })
            .eq('id', bookingId)
        } else if (isPast) {
          await supabaseClient
            .from('past_bookings')
            .update({ payment_status: 'requires_action' })
            .eq('id', bookingId)
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Payment requires additional authentication`,
            action: 'authorize',
            bookingId,
            requiresAction: true,
            paymentIntentId: paymentIntent.id
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      } else if (paymentIntent.status === 'requires_payment_method') {
        console.log(`Booking ${bookingId} payment method was declined`)
        
        if (isUpcoming) {
          await supabaseClient
            .from('bookings')
            .update({ payment_status: 'failed' })
            .eq('id', bookingId)
        } else if (isPast) {
          await supabaseClient
            .from('past_bookings')
            .update({ payment_status: 'failed' })
            .eq('id', bookingId)
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Payment method was declined`,
            action: 'authorize',
            bookingId
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      } else if (paymentIntent.status === 'processing') {
        console.log(`Booking ${bookingId} payment is processing`)
        
        if (isUpcoming) {
          await supabaseClient
            .from('bookings')
            .update({ payment_status: 'processing' })
            .eq('id', bookingId)
        } else if (isPast) {
          await supabaseClient
            .from('past_bookings')
            .update({ payment_status: 'processing' })
            .eq('id', bookingId)
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Payment is still processing`,
            action: 'authorize',
            bookingId,
            paymentIntentId: paymentIntent.id
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      } else if (paymentIntent.status !== 'requires_capture') {
        console.log(`Booking ${bookingId} authorization incomplete: ${paymentIntent.status}`)
        
        if (isUpcoming) {
          await supabaseClient
            .from('bookings')
            .update({ payment_status: 'failed' })
            .eq('id', bookingId)
        } else if (isPast) {
          await supabaseClient
            .from('past_bookings')
            .update({ payment_status: 'failed' })
            .eq('id', bookingId)
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Authorization incomplete: ${paymentIntent.status}`,
            action: 'authorize',
            bookingId
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      // Update booking with payment intent ID and status in correct table
      if (isUpcoming) {
        await supabaseClient
          .from('bookings')
          .update({
            payment_status: 'authorized',
            invoice_id: paymentIntent.id
          })
          .eq('id', bookingId)
      } else if (isPast) {
        await supabaseClient
          .from('past_bookings')
          .update({
            payment_status: 'authorized',
            invoice_id: paymentIntent.id
          })
          .eq('id', bookingId)
      }

      result = { 
        success: true, 
        action: 'authorized',
        paymentIntentId: paymentIntent.id,
        amount: paymentAmount,
        bookingId
      }

    } else if (action === 'charge') {
      // CRITICAL: Check if payment is already completed to prevent double charging
      if (booking.payment_status === 'paid' || booking.payment_status === 'Paid') {
        console.log(`Booking ${bookingId} is already paid - skipping charge to prevent double payment`)
        return new Response(
          JSON.stringify({ 
            success: true, 
            action: 'already_paid',
            message: 'Booking is already paid',
            bookingId,
            paymentStatus: booking.payment_status
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }
      
      // Either capture existing authorized payment or create new immediate charge
      if (booking.invoice_id && booking.payment_status === 'authorized') {
        // Capture existing authorized payment
        const captureResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${booking.invoice_id}/capture`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            amount_to_capture: amountInCents.toString(),
          }),
        })

        const captureResult = await captureResponse.json()

        if (captureResult.error) {
          console.error(`Capture failed for booking ${bookingId}:`, JSON.stringify(captureResult.error))
          
          if (isUpcoming) {
            await supabaseClient
              .from('bookings')
              .update({ payment_status: 'failed' })
              .eq('id', bookingId)
          } else if (isPast) {
            await supabaseClient
              .from('past_bookings')
              .update({ payment_status: 'failed' })
              .eq('id', bookingId)
          }
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `${captureResult.error.message}`,
              stripeErrorCode: captureResult.error.code || null,
              stripeErrorType: captureResult.error.type || null,
              stripeDeclineCode: captureResult.error.decline_code || null,
              action: 'charge',
              bookingId,
              rawStripeError: captureResult.error
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        }

        // Check if capture was actually successful
        if (captureResult.status !== 'succeeded') {
          console.log(`Capture incomplete for booking ${bookingId}: ${captureResult.status}`)
          
          if (isUpcoming) {
            await supabaseClient
              .from('bookings')
              .update({ payment_status: 'failed' })
              .eq('id', bookingId)
          } else if (isPast) {
            await supabaseClient
              .from('past_bookings')
              .update({ payment_status: 'failed' })
              .eq('id', bookingId)
          }
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Capture incomplete: ${captureResult.status}`,
              action: 'charge',
              bookingId 
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        }

        // Update payment status in correct table
        if (isUpcoming) {
          await supabaseClient
            .from('bookings')
            .update({ 
              payment_status: 'paid'
            })
            .eq('id', bookingId)
        } else if (isPast) {
          await supabaseClient
            .from('past_bookings')
            .update({ 
              payment_status: 'paid'
            })
            .eq('id', bookingId)
        }

        result = { 
          success: true, 
          action: 'captured',
          paymentIntentId: booking.invoice_id,
          amount: paymentAmount,
          bookingId
        }
      } else {
        // Create immediate charge
        const paymentIntentResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            amount: amountInCents.toString(),
            currency: 'gbp',
            customer: selectedPaymentMethod.stripe_customer_id,
            payment_method: selectedPaymentMethod.stripe_payment_method_id,
            capture_method: 'automatic',
            confirm: 'true',
            return_url: 'https://dkomihipebixlegygnoy.supabase.co/payment-return',
            description: `Payment for booking ${bookingId}`,
          }),
        })

        const paymentIntent = await paymentIntentResponse.json()

        if (paymentIntent.error) {
          console.error(`Payment failed for booking ${bookingId}:`, JSON.stringify(paymentIntent.error))
          
          if (isUpcoming) {
            await supabaseClient
              .from('bookings')
              .update({ payment_status: 'failed' })
              .eq('id', bookingId)
          } else if (isPast) {
            await supabaseClient
              .from('past_bookings')
              .update({ payment_status: 'failed' })
              .eq('id', bookingId)
          }
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `${paymentIntent.error.message}`,
              stripeErrorCode: paymentIntent.error.code || null,
              stripeErrorType: paymentIntent.error.type || null,
              stripeDeclineCode: paymentIntent.error.decline_code || null,
              action: 'charge',
              bookingId,
              rawStripeError: paymentIntent.error
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        }

        // Handle different payment statuses including 3D Secure and processing states
        if (paymentIntent.status === 'requires_action') {
          console.log(`Booking ${bookingId} charge requires 3D Secure authentication`)
          
          if (isUpcoming) {
            await supabaseClient
              .from('bookings')
              .update({ payment_status: 'requires_action' })
              .eq('id', bookingId)
          } else if (isPast) {
            await supabaseClient
              .from('past_bookings')
              .update({ payment_status: 'requires_action' })
              .eq('id', bookingId)
          }
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Payment requires additional authentication`,
              action: 'charge',
              bookingId,
              requiresAction: true,
              paymentIntentId: paymentIntent.id
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        } else if (paymentIntent.status === 'requires_payment_method') {
          console.log(`Booking ${bookingId} charge payment method was declined`)
          
          if (isUpcoming) {
            await supabaseClient
              .from('bookings')
              .update({ payment_status: 'failed' })
              .eq('id', bookingId)
          } else if (isPast) {
            await supabaseClient
              .from('past_bookings')
              .update({ payment_status: 'failed' })
              .eq('id', bookingId)
          }
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Payment method was declined`,
              action: 'charge',
              bookingId
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        } else if (paymentIntent.status === 'processing') {
          console.log(`Booking ${bookingId} charge is processing`)
          
          if (isUpcoming) {
            await supabaseClient
              .from('bookings')
              .update({ payment_status: 'processing' })
              .eq('id', bookingId)
          } else if (isPast) {
            await supabaseClient
              .from('past_bookings')
              .update({ payment_status: 'processing' })
              .eq('id', bookingId)
          }
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Payment is still processing`,
              action: 'charge',
              bookingId,
              paymentIntentId: paymentIntent.id
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        } else if (paymentIntent.status !== 'succeeded') {
          console.log(`Booking ${bookingId} charge incomplete: ${paymentIntent.status}`)
          
          if (isUpcoming) {
            await supabaseClient
              .from('bookings')
              .update({ payment_status: 'failed' })
              .eq('id', bookingId)
          } else if (isPast) {
            await supabaseClient
              .from('past_bookings')
              .update({ payment_status: 'failed' })
              .eq('id', bookingId)
          }
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Payment incomplete: ${paymentIntent.status}`,
              action: 'charge',
              bookingId
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        }

        // Update payment status in correct table
        if (isUpcoming) {
          await supabaseClient
            .from('bookings')
            .update({
              payment_status: 'paid',
              invoice_id: paymentIntent.id
            })
            .eq('id', bookingId)
        } else if (isPast) {
          await supabaseClient
            .from('past_bookings')
            .update({
              payment_status: 'paid',
              invoice_id: paymentIntent.id
            })
            .eq('id', bookingId)
        }

        result = { 
          success: true, 
          action: 'charged',
          paymentIntentId: paymentIntent.id,
          amount: paymentAmount,
          bookingId
        }
      }
    }

    console.log(`System payment action completed for booking ${bookingId}:`, result)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('System payment action error:', error)

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        bookingId: req.body?.bookingId || 'unknown'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 so cron doesn't retry automatically
      }
    )
  }
})