import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuoteData {
  totalCost: number;
  estimatedHours: number | null;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  serviceFrequency: string;
  hasOvenCleaning: boolean;
  ovenType: string;
  selectedDate: string | null;
  selectedTime: string;
  postcode: string;
  shortNoticeCharge?: number;
  isFirstTimeCustomer?: boolean;
  discountAmount?: number;
}

interface QuoteEmailRequest {
  email: string;
  quoteData: QuoteData;
  sessionId: string;
  serviceType: string;
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return 'Not selected';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

const formatFrequency = (freq: string): string => {
  const map: Record<string, string> = {
    'weekly': 'Weekly',
    'biweekly': 'Every 2 Weeks',
    'monthly': 'Monthly',
    'onetime': 'One-time Clean',
  };
  return map[freq] || freq;
};

const formatPropertyType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, quoteData, sessionId, serviceType }: QuoteEmailRequest = await req.json();

    if (!email || !email.includes('@')) {
      throw new Error('Valid email address is required');
    }

    console.log('Sending quote email to:', email);
    console.log('Quote data:', quoteData);

    // Generate booking link with session ID to resume
    const baseUrl = Deno.env.get('SITE_URL') || 'https://sncleaningservices.co.uk';
    const bookingPath = serviceType === 'Domestic' ? '/domestic-booking' : '/airbnb-booking';
    const resumeLink = `${baseUrl}${bookingPath}?resume=${sessionId}`;

    // Calculate base cost before discount
    const baseCost = quoteData.isFirstTimeCustomer 
      ? quoteData.totalCost / 0.9 
      : quoteData.totalCost;
    const discount = quoteData.isFirstTimeCustomer 
      ? baseCost - quoteData.totalCost 
      : 0;

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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Cleaning Quote</h1>
      <p>SN Cleaning Services</p>
    </div>
    
    <div class="content">
      <p>Hi there,</p>
      <p>Thank you for your interest in our ${serviceType.toLowerCase()} cleaning services! Here's your personalized quote:</p>
      
      <div class="quote-box">
        <p class="quote-label">Your Estimated Cost</p>
        <p class="quote-total">£${quoteData.totalCost.toFixed(2)}</p>
        ${quoteData.isFirstTimeCustomer ? `
        <div style="text-align: center;">
          <span class="discount-badge">🎉 10% First-Time Discount Applied!</span>
          <p style="font-size: 13px; color: #64748b; margin-top: 8px;">You save £${discount.toFixed(2)}</p>
        </div>
        ` : ''}
      </div>
      
      <h3 style="color: #1a365d; margin-top: 30px;">Quote Details</h3>
      <table class="details-table">
        ${quoteData.propertyType ? `
        <tr>
          <td>Property Type</td>
          <td>${formatPropertyType(quoteData.propertyType)}</td>
        </tr>
        ` : ''}
        ${quoteData.bedrooms ? `
        <tr>
          <td>Bedrooms</td>
          <td>${quoteData.bedrooms}</td>
        </tr>
        ` : ''}
        ${quoteData.bathrooms ? `
        <tr>
          <td>Bathrooms</td>
          <td>${quoteData.bathrooms}</td>
        </tr>
        ` : ''}
        ${quoteData.estimatedHours ? `
        <tr>
          <td>Estimated Duration</td>
          <td>${quoteData.estimatedHours} hours</td>
        </tr>
        ` : ''}
        ${quoteData.serviceFrequency ? `
        <tr>
          <td>Frequency</td>
          <td>${formatFrequency(quoteData.serviceFrequency)}</td>
        </tr>
        ` : ''}
        ${quoteData.hasOvenCleaning ? `
        <tr>
          <td>Oven Cleaning</td>
          <td>Included${quoteData.ovenType ? ` (${quoteData.ovenType})` : ''}</td>
        </tr>
        ` : ''}
        ${quoteData.selectedDate ? `
        <tr>
          <td>Preferred Date</td>
          <td>${formatDate(quoteData.selectedDate)}</td>
        </tr>
        ` : ''}
        ${quoteData.selectedTime ? `
        <tr>
          <td>Preferred Time</td>
          <td>${quoteData.selectedTime}</td>
        </tr>
        ` : ''}
        ${quoteData.postcode ? `
        <tr>
          <td>Postcode</td>
          <td>${quoteData.postcode.toUpperCase()}</td>
        </tr>
        ` : ''}
        ${quoteData.shortNoticeCharge && quoteData.shortNoticeCharge > 0 ? `
        <tr>
          <td>Short Notice Fee</td>
          <td>+£${quoteData.shortNoticeCharge.toFixed(2)}</td>
        </tr>
        ` : ''}
      </table>
      
      <div class="validity">
        <strong>⏰ This quote is valid for 7 days</strong>
        <p style="margin: 5px 0 0; font-size: 13px;">Book now to secure your preferred time slot!</p>
      </div>
      
      <a href="${resumeLink}" class="cta-button">Complete Your Booking →</a>
      
      <p style="color: #64748b; font-size: 14px; text-align: center;">
        Click the button above to continue where you left off
      </p>
    </div>
    
    <div class="footer">
      <p><strong>SN Cleaning Services</strong></p>
      <p>Professional cleaning you can trust</p>
      <p style="margin-top: 15px;">
        Questions? Reply to this email or call us at <a href="tel:+447000000000">07XXX XXXXXX</a>
      </p>
      <p style="font-size: 11px; margin-top: 20px; color: #94a3b8;">
        You received this email because you requested a cleaning quote from SN Cleaning Services.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email
    const emailResult = await resend.emails.send({
      from: 'SN Cleaning <noreply@notifications.sncleaningservices.co.uk>',
      to: [email],
      subject: `Your Cleaning Quote: £${quoteData.totalCost.toFixed(2)} - SN Cleaning Services`,
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
    console.error('Error in send-quote-email:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
