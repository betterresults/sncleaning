import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CarpetItem {
  id: string;
  name: string;
  type: 'carpet' | 'upholstery' | 'mattress';
  size?: string;
  quantity: number;
  price: number;
  bothSides?: boolean;
}

interface CarpetQuoteData {
  carpetItems: CarpetItem[];
  upholsteryItems: CarpetItem[];
  mattressItems: CarpetItem[];
  totalCost: number;
  shortNoticeCharge?: number;
  selectedDate?: string;
  selectedTime?: string;
  postcode?: string;
}

interface CarpetQuoteEmailRequest {
  email: string;
  quoteData: CarpetQuoteData;
  sessionId: string;
}

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Not selected';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

const formatItems = (items: CarpetItem[]): string => {
  if (!items || items.length === 0) return '';
  return items.map(item => {
    const bothSidesText = item.bothSides ? ' (Both sides)' : '';
    return `<tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">${item.name}${bothSidesText}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 500;">£${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`;
  }).join('');
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, quoteData, sessionId }: CarpetQuoteEmailRequest = await req.json();

    if (!email || !email.includes('@')) {
      throw new Error('Valid email address is required');
    }

    console.log('Sending carpet quote email to:', email);
    console.log('Quote data:', quoteData);

    // Generate booking link
    const referer = req.headers.get('referer') || req.headers.get('origin') || '';
    const baseUrl = referer ? new URL(referer).origin : 'https://sncleaningservices.co.uk';
    
    const params = new URLSearchParams();
    params.set('utm_source', 'exit-popup');
    params.set('utm_medium', 'email');
    params.set('utm_campaign', 'carpet-quote-recovery');
    params.set('ref', sessionId);
    if (quoteData.postcode) params.set('postcode', quoteData.postcode);
    if (email) params.set('email', email);
    
    const resumeLink = `${baseUrl}/carpet-booking?${params.toString()}`;

    // Calculate subtotals
    const carpetTotal = quoteData.carpetItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const upholsteryTotal = quoteData.upholsteryItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const mattressTotal = quoteData.mattressItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

    // Build items HTML sections
    let itemsHtml = '';
    
    if (quoteData.carpetItems?.length > 0) {
      itemsHtml += `
        <h4 style="color: #1a365d; margin: 20px 0 10px; font-size: 14px;">🏠 Carpets & Rugs</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px;">Item</th>
              <th style="text-align: center; padding: 8px 0; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px;">Qty</th>
              <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${formatItems(quoteData.carpetItems)}
          </tbody>
        </table>
      `;
    }
    
    if (quoteData.upholsteryItems?.length > 0) {
      itemsHtml += `
        <h4 style="color: #1a365d; margin: 20px 0 10px; font-size: 14px;">🛋️ Upholstery</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px;">Item</th>
              <th style="text-align: center; padding: 8px 0; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px;">Qty</th>
              <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${formatItems(quoteData.upholsteryItems)}
          </tbody>
        </table>
      `;
    }
    
    if (quoteData.mattressItems?.length > 0) {
      itemsHtml += `
        <h4 style="color: #1a365d; margin: 20px 0 10px; font-size: 14px;">🛏️ Mattresses</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px;">Item</th>
              <th style="text-align: center; padding: 8px 0; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px;">Qty</th>
              <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${formatItems(quoteData.mattressItems)}
          </tbody>
        </table>
      `;
    }

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Carpet Cleaning Quote</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <div style="background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%); color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">Your Carpet Cleaning Quote</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">SN Cleaning Services</p>
    </div>
    
    <div style="padding: 30px;">
      <p>Hi there,</p>
      <p>Thank you for your interest in our professional carpet and upholstery cleaning services! Here's your personalized quote:</p>
      
      <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 20px 0;">
        <p style="text-align: center; color: #64748b; font-size: 14px; margin: 0;">Your Estimated Cost</p>
        <p style="font-size: 36px; font-weight: bold; color: #1a365d; text-align: center; margin: 10px 0;">£${quoteData.totalCost.toFixed(2)}</p>
      </div>
      
      <h3 style="color: #1a365d; margin-top: 30px;">Items Included</h3>
      ${itemsHtml}
      
      ${quoteData.shortNoticeCharge && quoteData.shortNoticeCharge > 0 ? `
      <div style="margin-top: 15px; padding: 10px; background: #fef3c7; border-radius: 8px;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">
          <strong>Short Notice Fee:</strong> +£${quoteData.shortNoticeCharge.toFixed(2)}
        </p>
      </div>
      ` : ''}
      
      ${quoteData.selectedDate || quoteData.selectedTime ? `
      <div style="margin-top: 20px;">
        <h4 style="color: #1a365d; margin-bottom: 10px;">Preferred Schedule</h4>
        ${quoteData.selectedDate ? `<p style="margin: 5px 0;"><strong>Date:</strong> ${formatDate(quoteData.selectedDate)}</p>` : ''}
        ${quoteData.selectedTime ? `<p style="margin: 5px 0;"><strong>Time:</strong> ${quoteData.selectedTime}</p>` : ''}
      </div>
      ` : ''}
      
      ${quoteData.postcode ? `
      <p style="margin-top: 15px;"><strong>Location:</strong> ${quoteData.postcode.toUpperCase()}</p>
      ` : ''}
      
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
        <strong style="color: #92400e;">⏰ This quote is valid for 7 days</strong>
        <p style="margin: 5px 0 0; font-size: 13px;">Book now to secure your preferred time slot!</p>
      </div>
      
      <a href="${resumeLink}" style="display: block; background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%); color: white !important; text-decoration: none; padding: 18px 30px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold; margin: 30px 0;">Complete Your Booking →</a>
      
      <p style="color: #64748b; font-size: 14px; text-align: center;">
        Click the button above to continue where you left off
      </p>
    </div>
    
    <div style="background: #f8fafc; padding: 25px; text-align: center; font-size: 13px; color: #64748b;">
      <p><strong>SN Cleaning Services</strong></p>
      <p>Professional cleaning you can trust</p>
      <p style="margin-top: 15px;">
        Questions? Reply to this email or call us at <a href="tel:02038355033" style="color: #1a365d;">020 3835 5033</a>
      </p>
      <p style="font-size: 11px; margin-top: 20px; color: #94a3b8;">
        You received this email because you requested a carpet cleaning quote from SN Cleaning Services.
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
      subject: `Your Carpet Cleaning Quote: £${quoteData.totalCost.toFixed(2)} - SN Cleaning Services`,
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
    console.error('Error in send-carpet-quote-email:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
