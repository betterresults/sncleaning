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
    const { customerId, service, cost, hours, discount, invoiceTerm, notes } = await req.json();

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

    // Calculate invoice date (today) and due date from invoice term (default 1 day)
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const termDays = invoiceTerm ? parseInt(invoiceTerm) : 1;
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + termDays);
    const dueDateString = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log('Computed invoice dates', { invoiceTerm: termDays, dateString, dueDateString });

    // Prepare invoice data - discount is sent as actual amount, not percentage
    const invoiceData: any = {
      customer: customerId,  // Invoiless API expects 'customer', not 'customerId'
      date: dateString,
      items: [
        {
          name: service,
          description: hours ? `Hours: ${hours}` : '',
          price: parseFloat(cost),
          quantity: 1
        }
      ],
      notes: notes || '',
      dueDate: dueDateString
    };

    // Only add discount if provided
    if (discount && parseFloat(discount) > 0) {
      invoiceData.discount = parseFloat(discount);
    }

    console.log('Creating invoice in Invoiless:', invoiceData);

    // Create invoice
    const createResponse = await fetch('https://api.invoiless.com/v1/invoices', {
      method: 'POST',
      headers: {
        'api-key': INVOILESS_API_KEY,
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

    // Return the created invoice (not sending it yet)
    return new Response(
      JSON.stringify({
        success: true,
        invoice: invoice,
        message: 'Invoice created successfully'
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
