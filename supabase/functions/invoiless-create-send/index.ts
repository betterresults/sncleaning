import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerId, service, cost, hours, discount, dueDate, notes } = await req.json();

    // Validate required fields
    if (!customerId) {
      throw new Error('Customer ID is required');
    }
    if (!service) {
      throw new Error('Service description is required');
    }
    if (!cost || cost <= 0) {
      throw new Error('Valid cost is required');
    }

    const INVOILESS_API_KEY = Deno.env.get('INVOILESS_API_KEY');
    if (!INVOILESS_API_KEY) {
      throw new Error('INVOILESS_API_KEY is not configured');
    }

    // Calculate final amount after discount
    const subtotal = parseFloat(cost);
    const discountAmount = discount ? (subtotal * parseFloat(discount)) / 100 : 0;
    const total = subtotal - discountAmount;

    // Prepare invoice data
    const invoiceData = {
      customerId: customerId,
      items: [
        {
          name: service,
          description: hours ? `Hours: ${hours}` : '',
          price: parseFloat(cost),
          quantity: 1
        }
      ],
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 30 days from now
      discount: discountAmount,
      notes: notes || '',
      status: 'draft'
    };

    console.log('Creating invoice in Invoiless:', invoiceData);

    // Create invoice
    const createResponse = await fetch('https://api.invoiless.com/v1/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INVOILESS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Invoiless create error:', errorText);
      throw new Error(`Failed to create invoice: ${createResponse.status} - ${errorText}`);
    }

    const invoice = await createResponse.json();
    console.log('Invoice created successfully:', invoice);

    // Send the invoice
    const sendResponse = await fetch(`https://api.invoiless.com/v1/invoices/${invoice.id}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INVOILESS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error('Invoiless send error:', errorText);
      // Return the created invoice even if send failed
      return new Response(
        JSON.stringify({
          success: true,
          invoice: invoice,
          sendError: `Failed to send invoice: ${sendResponse.status}`,
          message: 'Invoice created but not sent'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const sendResult = await sendResponse.json();
    console.log('Invoice sent successfully:', sendResult);

    return new Response(
      JSON.stringify({
        success: true,
        invoice: invoice,
        sendResult: sendResult,
        message: 'Invoice created and sent successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in invoiless-create-send:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
