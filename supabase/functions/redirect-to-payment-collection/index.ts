import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Generate a random 6-character alphanumeric code
function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const customerId = url.searchParams.get('customer_id');
    const returnShortUrl = url.searchParams.get('short') === 'true'; // Add option to get short URL
    
    if (!customerId) {
      return new Response('Missing customer_id parameter', { status: 400 });
    }

    console.log('Redirecting payment collection for customer:', customerId);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get customer details
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, email, first_name, last_name')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      console.error('Customer not found:', customerId);
      return new Response('Customer not found', { status: 404 });
    }

    // Call the collect payment method function
    const { data, error } = await supabaseAdmin.functions.invoke('stripe-collect-payment-method', {
      body: {
        customer_id: parseInt(customerId),
        email: customer.email,
        name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer',
        return_url: `https://account.sncleaningservices.co.uk/welcome?customer_id=${customerId}&payment_setup=success`,
        collect_only: true,
        generate_short_link: true // Always generate short link
      }
    });

    if (error) {
      console.error('Error creating payment collection:', error);
      return new Response('Error creating payment collection', { status: 500 });
    }

    // If short URL was requested and available, return it as JSON
    if (returnShortUrl && data?.short_url) {
      return new Response(JSON.stringify({ short_url: data.short_url }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (data?.checkout_url) {
      // Redirect to Stripe checkout
      return new Response(null, {
        status: 302,
        headers: {
          'Location': data.checkout_url
        }
      });
    } else {
      return new Response('Failed to create checkout URL', { status: 500 });
    }

  } catch (error) {
    console.error('Error in redirect-to-payment-collection:', error);
    return new Response('Internal server error', { status: 500 });
  }
};

serve(handler);