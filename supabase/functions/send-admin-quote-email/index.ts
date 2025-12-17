import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminQuoteData {
  customerName: string;
  customerEmail: string;
  address: string;
  postcode: string;
  serviceType: string;
  cleaningType: string;
  totalHours: number | null;
  totalCost: number;
  hourlyRate: number;
  discount: number;
  selectedDate: string | null;
  selectedTime: string;
  additionalDetails: string;
  propertyDetails: string;
  quoteSessionId?: string; // Session ID to resume the exact quote
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return 'To be confirmed';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

const formatServiceType = (type: string): string => {
  const map: Record<string, string> = {
    'domestic': 'Domestic Cleaning',
    'commercial': 'Commercial Cleaning',
    'airbnb': 'Airbnb Cleaning',
    'end_of_tenancy': 'End of Tenancy Cleaning',
    'deep_cleaning': 'Deep Cleaning',
    'carpet_cleaning': 'Carpet Cleaning',
    'Domestic': 'Domestic Cleaning',
    'Commercial': 'Commercial Cleaning',
    'Air BnB': 'Airbnb Cleaning',
  };
  return map[type] || type;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const quoteData: AdminQuoteData = await req.json();

    if (!quoteData.customerEmail || !quoteData.customerEmail.includes('@')) {
      throw new Error('Valid customer email address is required');
    }

    console.log('Sending admin quote email to:', quoteData.customerEmail);
    console.log('Quote data:', quoteData);

    // Generate booking link
    const referer = req.headers.get('referer') || req.headers.get('origin') || '';
    const baseUrl = referer ? new URL(referer).origin : 'https://sncleaningservices.co.uk';
    
    // Determine the booking path based on service type
    let bookingPath = '/domestic-booking';
    if (quoteData.serviceType === 'airbnb' || quoteData.serviceType === 'Air BnB') {
      bookingPath = '/airbnb-booking';
    }

    // Build URL parameters for prefilling - use resume param if session ID provided
    const params = new URLSearchParams();
    params.set('utm_source', 'admin-quote');
    params.set('utm_medium', 'email');
    params.set('utm_campaign', 'admin-quote');
    
    // If we have a session ID, use resume to load the exact quote
    if (quoteData.quoteSessionId) {
      params.set('resume', quoteData.quoteSessionId);
    } else {
      // Fallback to basic prefill (less reliable)
      if (quoteData.postcode) params.set('postcode', quoteData.postcode);
      if (quoteData.customerEmail) params.set('email', quoteData.customerEmail);
    }
    
    const bookingLink = `${baseUrl}${bookingPath}?${params.toString()}`;

    // Calculate final cost after discount
    const finalCost = quoteData.totalCost;
    const originalCost = quoteData.discount > 0 ? quoteData.totalCost + quoteData.discount : quoteData.totalCost;

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Cleaning Quote</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 10px 0 0; opacity: 0.9; }
    .content { padding: 30px; }
    .quote-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 20px 0; }
    .quote-total { font-size: 36px; font-weight: bold; color: #1a365d; text-align: center; margin: 10px 0; }
    .quote-label { text-align: center; color: #64748b; font-size: 14px; }
    .discount-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 14px; font-weight: bold; margin-top: 10px; }
    .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .details-table td { padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
    .details-table td:first-child { color: #64748b; width: 40%; }
    .details-table td:last-child { font-weight: 500; text-align: right; }
    .cta-button { display: block; background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%); color: white !important; text-decoration: none; padding: 18px 30px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold; margin: 30px 0; }
    .cta-button:hover { opacity: 0.95; }
    .footer { background: #f8fafc; padding: 25px; text-align: center; font-size: 13px; color: #64748b; }
    .footer a { color: #1a365d; }
    .validity { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
    .validity strong { color: #92400e; }
    .notes-box { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0; }
    .notes-box h4 { color: #0369a1; margin: 0 0 10px; }
    .notes-box p { margin: 0; color: #334155; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Cleaning Quote</h1>
      <p>SN Cleaning Services</p>
    </div>
    
    <div class="content">
      <p>Dear ${quoteData.customerName || 'Valued Customer'},</p>
      <p>Thank you for your interest in our cleaning services! Based on our discussion, here's your personalized quote:</p>
      
      <div class="quote-box">
        <p class="quote-label">Your Quoted Price</p>
        <p class="quote-total">£${finalCost.toFixed(2)}</p>
        ${quoteData.discount > 0 ? `
        <div style="text-align: center;">
          <span class="discount-badge">Special Discount Applied!</span>
          <p style="font-size: 13px; color: #64748b; margin-top: 8px;">Original price: £${originalCost.toFixed(2)} - You save £${quoteData.discount.toFixed(2)}</p>
        </div>
        ` : ''}
      </div>
      
      <h3 style="color: #1a365d; margin-top: 30px;">Quote Details</h3>
      <table class="details-table">
        <tr>
          <td>Service Type</td>
          <td>${formatServiceType(quoteData.serviceType)}</td>
        </tr>
        ${quoteData.cleaningType ? `
        <tr>
          <td>Cleaning Type</td>
          <td>${quoteData.cleaningType}</td>
        </tr>
        ` : ''}
        ${quoteData.totalHours ? `
        <tr>
          <td>Duration</td>
          <td>${quoteData.totalHours} hours</td>
        </tr>
        ` : ''}
        ${quoteData.address ? `
        <tr>
          <td>Address</td>
          <td>${quoteData.address}</td>
        </tr>
        ` : ''}
        ${quoteData.postcode ? `
        <tr>
          <td>Postcode</td>
          <td>${quoteData.postcode.toUpperCase()}</td>
        </tr>
        ` : ''}
        ${quoteData.selectedDate ? `
        <tr>
          <td>Proposed Date</td>
          <td>${formatDate(quoteData.selectedDate)}</td>
        </tr>
        ` : ''}
        ${quoteData.selectedTime ? `
        <tr>
          <td>Proposed Time</td>
          <td>${quoteData.selectedTime}</td>
        </tr>
        ` : ''}
      </table>
      
      ${quoteData.propertyDetails || quoteData.additionalDetails ? `
      <div class="notes-box">
        <h4>Additional Information</h4>
        ${quoteData.propertyDetails ? `<p><strong>Property:</strong> ${quoteData.propertyDetails}</p>` : ''}
        ${quoteData.additionalDetails ? `<p style="margin-top: 8px;"><strong>Notes:</strong> ${quoteData.additionalDetails}</p>` : ''}
      </div>
      ` : ''}
      
      <div class="validity">
        <strong>⏰ This quote is valid for 14 days</strong>
        <p style="margin: 5px 0 0; font-size: 13px;">Contact us to confirm your booking!</p>
      </div>
      
      <a href="${bookingLink}" class="cta-button">Book Online Now →</a>
      
      <p style="color: #64748b; font-size: 14px; text-align: center;">
        Or simply reply to this email to confirm your booking
      </p>
    </div>
    
    <div class="footer">
      <p><strong>SN Cleaning Services</strong></p>
      <p>Professional cleaning you can trust</p>
      <p style="margin-top: 15px;">
        Questions? Reply to this email or call us at <a href="tel:02038355033">020 3835 5033</a>
      </p>
      <p style="font-size: 11px; margin-top: 20px; color: #94a3b8;">
        This quote was prepared especially for you by our team.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email
    const emailResult = await resend.emails.send({
      from: 'SN Cleaning <noreply@notifications.sncleaningservices.co.uk>',
      to: [quoteData.customerEmail],
      subject: `Your Cleaning Quote: £${finalCost.toFixed(2)} - SN Cleaning Services`,
      html: emailHtml,
    });

    console.log('Email send result:', emailResult);

    if (emailResult.error) {
      console.error('Resend API error:', emailResult.error);
      throw new Error(`Failed to send email: ${emailResult.error.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message_id: emailResult.data?.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-admin-quote-email:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
