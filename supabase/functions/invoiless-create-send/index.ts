import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, bookingType } = await req.json();
    console.log('Processing Invoiless invoice for booking:', bookingId, 'type:', bookingType);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch booking details
    const tableName = bookingType === 'past' ? 'past_bookings' : 'bookings';
    const { data: booking, error: bookingError } = await supabaseClient
      .from(tableName)
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Booking not found: ${bookingError?.message}`);
    }

    // Fetch customer details separately
    const { data: customer, error: customerError } = await supabaseClient
      .from('customers')
      .select('id, first_name, last_name, email, company')
      .eq('id', booking.customer)
      .single();

    if (customerError || !customer) {
      throw new Error(`Customer not found: ${customerError?.message}`);
    }

    // Check if invoice already exists
    if (booking.invoice_id && booking.invoice_link) {
      console.log('Invoice already exists:', booking.invoice_id);
      return new Response(JSON.stringify({
        success: true,
        message: 'Invoice already exists',
        invoice_id: booking.invoice_id,
        invoice_link: booking.invoice_link
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    if (!customer?.email) {
      throw new Error('Customer email is required');
    }

    // Calculate due date (30 days from booking date)
    const bookingDate = new Date(booking.date_time || booking.date_only);
    const dueDate = new Date(bookingDate);
    dueDate.setDate(dueDate.getDate() + 30);

    // Create invoice with Invoiless API
    const invoicePayload = {
      customer: {
        internalId: customer.id.toString(),
        billTo: {
          name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
          email: customer.email,
          company: customer.company || undefined
        }
      },
      items: [{
        name: `${booking.cleaning_type || 'Cleaning'} Service - ${bookingDate.toLocaleDateString('en-GB')}`,
        description: `Address: ${booking.address || ''}, ${booking.postcode || ''}`,
        quantity: 1,
        price: Number(booking.total_cost) || 0
      }],
      dueDate: dueDate.toISOString().split('T')[0],
      notes: booking.additional_details || undefined
    };

    console.log('Creating invoice with payload:', JSON.stringify(invoicePayload));

    const invoilessResponse = await fetch('https://api.invoiless.com/v1/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('INVOILESS_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invoicePayload)
    });

    if (!invoilessResponse.ok) {
      const errorText = await invoilessResponse.text();
      console.error('Invoiless API error:', errorText);
      throw new Error(`Invoiless API error: ${invoilessResponse.status} - ${errorText}`);
    }

    const invoiceData = await invoilessResponse.json();
    console.log('Invoice created:', invoiceData);

    // Send the invoice via email
    const sendResponse = await fetch(`https://api.invoiless.com/v1/invoices/${invoiceData.id}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('INVOILESS_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: customer.email
      })
    });

    if (!sendResponse.ok) {
      console.error('Failed to send invoice email:', await sendResponse.text());
    } else {
      console.log('Invoice email sent successfully');
    }

    // Update booking with invoice details
    const updateData = {
      invoice_id: invoiceData.id,
      invoice_link: invoiceData.url || `https://app.invoiless.com/invoices/${invoiceData.id}`,
      payment_status: 'Invoice Sent'
    };

    const { error: updateError } = await supabaseClient
      .from(tableName)
      .update(updateData)
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({
      success: true,
      invoice_id: invoiceData.id,
      invoice_link: updateData.invoice_link,
      message: 'Invoice created and sent successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Error in invoiless-create-send:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
