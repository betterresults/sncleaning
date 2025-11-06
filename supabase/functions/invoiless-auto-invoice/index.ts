import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, bookingType, isResend } = await req.json();

    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    const INVOILESS_API_KEY = Deno.env.get('INVOILESS_API_KEY');
    if (!INVOILESS_API_KEY) {
      throw new Error('INVOILESS_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Fetch booking data based on booking type
    console.log('Fetching booking data for ID:', bookingId, 'Type:', bookingType, 'IsResend:', isResend);
    const tableName = bookingType === 'past' ? 'past_bookings' : 'bookings';
    const { data: booking, error: bookingError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Failed to fetch booking: ${bookingError?.message || 'Not found'}`);
    }

    console.log('Booking data fetched:', { 
      email: booking.email, 
      service_type: booking.service_type,
      cleaning_type: booking.cleaning_type,
      invoice_id: booking.invoice_id
    });

    if (!booking.email) {
      throw new Error('Booking must have an email address');
    }

    // If this is a resend and we have an existing invoice, just resend it
    if (isResend && booking.invoice_id) {
      console.log('Resending existing invoice:', booking.invoice_id);
      const sendInvoiceResponse = await fetch(
        `https://api.invoiless.com/v1/invoices/${booking.invoice_id}/send`,
        {
          method: 'POST',
          headers: {
            'api-key': INVOILESS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: booking.email,
            subject: 'Your Invoice from SN Cleaning Services'
          })
        }
      );

      if (!sendInvoiceResponse.ok) {
        const errorText = await sendInvoiceResponse.text();
        throw new Error(`Failed to resend invoice: ${sendInvoiceResponse.status} - ${errorText}`);
      }

      console.log('Invoice resent successfully');

      // Update payment status
      await supabase
        .from(tableName)
        .update({ payment_status: 'Invoice Sent' })
        .eq('id', bookingId);

      return new Response(
        JSON.stringify({
          success: true,
          invoiceId: booking.invoice_id,
          invoiceLink: booking.invoice_link,
          emailSent: true,
          message: 'Invoice resent successfully'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 2: Find or create customer in Invoiless
    console.log('Searching for customer by email:', booking.email);
    const searchResponse = await fetch(
      `https://api.invoiless.com/v1/customers?search=${encodeURIComponent(booking.email)}`,
      {
        headers: {
          'api-key': INVOILESS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      throw new Error(`Failed to search customer: ${searchResponse.status} - ${errorText}`);
    }

    const customers = await searchResponse.json();
    let customerId: string;
    let customerCreated = false;

    // Find exact email match (case-insensitive)
    const existingCustomer = customers?.find((c: any) => 
      c.billTo?.email?.toLowerCase() === booking.email.toLowerCase()
    );

    if (existingCustomer) {
      customerId = existingCustomer.id;
      console.log('Customer found with exact email match:', customerId);
    } else {
      // Create new customer
      console.log('Customer not found, creating new customer');
      const customerData = {
        billTo: {
          email: booking.email,
          firstName: booking.first_name || '',
          lastName: booking.last_name || '',
          phone: booking.phone_number || '',
          address: booking.address || ''
        }
      };

      const createCustomerResponse = await fetch('https://api.invoiless.com/v1/customers', {
        method: 'POST',
        headers: {
          'api-key': INVOILESS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (!createCustomerResponse.ok) {
        const errorText = await createCustomerResponse.text();
        throw new Error(`Failed to create customer: ${createCustomerResponse.status} - ${errorText}`);
      }

      const newCustomer = await createCustomerResponse.json();
      customerId = newCustomer.id;
      customerCreated = true;
      console.log('Customer created:', customerId);
    }

    // Step 3: Create invoice
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const termDays = booking.invoice_term ? parseInt(booking.invoice_term) : 1;
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + termDays);
    const dueDateString = dueDate.toISOString().split('T')[0];

    // Format cleaning date for notes
    const formatDate = (dateStr: string) => {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      const day = date.getDate();
      const suffix = day === 1 || day === 21 || day === 31 ? 'st' : 
                     day === 2 || day === 22 ? 'nd' : 
                     day === 3 || day === 23 ? 'rd' : 'th';
      const month = date.toLocaleString('en-US', { month: 'long' });
      const time = date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${day}${suffix} of ${month}, ${time}`;
    };

    // Prepare invoice notes
    const notes = `Cleaning Date: ${formatDate(booking.date_time)}
Address: ${booking.address || 'N/A'}
Postcode: ${booking.postcode || 'N/A'}`;

    // Determine service name
    let serviceName = '';
    if (booking.service_type && booking.cleaning_type) {
      serviceName = `${booking.service_type} - ${booking.cleaning_type}`;
    } else if (booking.service_type) {
      serviceName = booking.service_type;
    } else if (booking.cleaning_type) {
      serviceName = booking.cleaning_type;
    } else {
      serviceName = 'Cleaning Service';
    }

    // Determine if hourly or fixed price
    let invoiceItem: any;
    const hasHourlyRate = booking.cleaning_cost_per_hour && parseFloat(booking.cleaning_cost_per_hour) > 0;
    const hasTotalHours = booking.total_hours && parseFloat(booking.total_hours) > 0;

    if (hasHourlyRate && hasTotalHours) {
      // Hourly rate service
      invoiceItem = {
        name: serviceName,
        description: '',
        price: parseFloat(booking.cleaning_cost_per_hour),
        quantity: parseFloat(booking.total_hours)
      };
      console.log('Using hourly rate:', invoiceItem);
    } else {
      // Fixed price service
      invoiceItem = {
        name: serviceName,
        description: '',
        price: parseFloat(booking.total_cost || 0),
        quantity: 1
      };
      console.log('Using fixed price:', invoiceItem);
    }

    const invoiceData: any = {
      customer: customerId,
      date: dateString,
      dueDate: dueDateString,
      items: [invoiceItem],
      notes: notes
    };

    // Add discount if present
    if (booking.cost_deduction && parseFloat(booking.cost_deduction) > 0) {
      invoiceData.discount = parseFloat(booking.cost_deduction);
      console.log('Adding discount:', invoiceData.discount);
    }

    console.log('Creating invoice:', invoiceData);

    const createInvoiceResponse = await fetch('https://api.invoiless.com/v1/invoices', {
      method: 'POST',
      headers: {
        'api-key': INVOILESS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    if (!createInvoiceResponse.ok) {
      const errorText = await createInvoiceResponse.text();
      throw new Error(`Failed to create invoice: ${createInvoiceResponse.status} - ${errorText}`);
    }

    const invoice = await createInvoiceResponse.json();
    console.log('Invoice created:', invoice);

    // Step 4: Send invoice
    console.log('Sending invoice:', invoice.id);
    const sendInvoiceResponse = await fetch(
      `https://api.invoiless.com/v1/invoices/${invoice.id}/send`,
      {
        method: 'POST',
        headers: {
          'api-key': INVOILESS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: booking.email,
          subject: 'Your Invoice from SN Cleaning Services'
        })
      }
    );

    let emailSent = false;
    if (sendInvoiceResponse.ok) {
      emailSent = true;
      console.log('Invoice sent successfully');
    } else {
      const errorText = await sendInvoiceResponse.text();
      console.warn('Failed to send invoice email:', errorText);
      // Continue anyway - invoice is created
    }

    // Step 5: Update booking table with invoice details
    console.log('Updating booking with invoice details');
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        invoice_id: invoice.id,
        invoice_link: invoice.url,
        payment_status: emailSent ? 'Invoice Sent' : 'Invoice Created'
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Failed to update booking:', updateError);
      // Don't throw - invoice was created successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        customerCreated,
        customerId,
        invoiceId: invoice.id,
        invoiceLink: invoice.url,
        emailSent,
        message: emailSent 
          ? 'Invoice created and sent successfully' 
          : 'Invoice created successfully (email sending failed)'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in invoiless-auto-invoice:', error);
    return new Response(
      JSON.stringify({
        success: false,
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
