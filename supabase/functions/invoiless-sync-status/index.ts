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
    console.log('Starting Invoiless status sync...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all bookings with Invoiless invoices that are not paid
    const { data: upcomingBookings } = await supabaseClient
      .from('bookings')
      .select('id, invoice_id, payment_status')
      .eq('payment_method', 'Invoiless')
      .neq('payment_status', 'Paid')
      .not('invoice_id', 'is', null);

    const { data: pastBookings } = await supabaseClient
      .from('past_bookings')
      .select('id, invoice_id, payment_status')
      .eq('payment_method', 'Invoiless')
      .neq('payment_status', 'Paid')
      .not('invoice_id', 'is', null);

    const allBookings = [
      ...(upcomingBookings || []).map(b => ({ ...b, type: 'upcoming' })),
      ...(pastBookings || []).map(b => ({ ...b, type: 'past' }))
    ];

    console.log(`Found ${allBookings.length} invoices to sync`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const booking of allBookings) {
      try {
        // Fetch invoice status from Invoiless
        const response = await fetch(`https://api.invoiless.com/v1/invoices/${booking.invoice_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('INVOILESS_API_KEY')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error(`Failed to fetch invoice ${booking.invoice_id}:`, response.status);
          errorCount++;
          continue;
        }

        const invoiceData = await response.json();
        let newStatus: string | null = null;

        // Map Invoiless status to our payment status
        if (invoiceData.status === 'paid') {
          newStatus = 'Paid';
        } else if (invoiceData.status === 'overdue') {
          newStatus = 'Overdue';
        } else if (invoiceData.status === 'sent') {
          newStatus = 'Invoice Sent';
        } else if (invoiceData.status === 'draft') {
          newStatus = 'Unpaid';
        }

        // Update if status changed
        if (newStatus && newStatus !== booking.payment_status) {
          const tableName = booking.type === 'past' ? 'past_bookings' : 'bookings';
          const { error } = await supabaseClient
            .from(tableName)
            .update({ payment_status: newStatus })
            .eq('id', booking.id);

          if (error) {
            console.error(`Error updating ${tableName} ${booking.id}:`, error);
            errorCount++;
          } else {
            console.log(`Updated ${tableName} ${booking.id}: ${booking.payment_status} → ${newStatus}`);
            syncedCount++;
          }
        }

      } catch (error: any) {
        console.error(`Error syncing booking ${booking.id}:`, error.message);
        errorCount++;
      }
    }

    const summary = {
      total: allBookings.length,
      synced: syncedCount,
      errors: errorCount,
      message: `Sync completed: ${syncedCount} updated, ${errorCount} errors`
    };

    console.log('Sync summary:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Error in invoiless-sync-status:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
