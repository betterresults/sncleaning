-- Create a manual payment request email template
INSERT INTO email_notification_templates (
  name,
  subject,
  html_content,
  description,
  is_active,
  variables
) VALUES (
  'Manual Payment Request',
  'Payment Required - Booking #{{booking_id}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Required</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Payment Required</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Dear {{customer_name}},</p>
    
    <p style="font-size: 16px;">We were unable to process the payment for your cleaning service. Please complete your payment at your earliest convenience to avoid any service disruption.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0; color: #667eea;">Booking Details</h3>
      <p style="margin: 5px 0;"><strong>Booking ID:</strong> #{{booking_id}}</p>
      <p style="margin: 5px 0;"><strong>Date:</strong> {{booking_date}}</p>
      <p style="margin: 5px 0;"><strong>Time:</strong> {{booking_time}}</p>
      <p style="margin: 5px 0;"><strong>Address:</strong> {{address}}</p>
      <p style="margin: 5px 0; font-size: 18px;"><strong>Amount Due:</strong> £{{total_cost}}</p>
    </div>
    
    {{#if custom_message}}
    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <p style="margin: 0; color: #856404;">{{custom_message}}</p>
    </div>
    {{/if}}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{payment_link}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block;">Pay Now</a>
    </div>
    
    <p style="font-size: 14px; color: #666;">If you have already made the payment or believe this was sent in error, please contact us.</p>
    
    <p style="font-size: 16px;">Thank you for your understanding.</p>
    
    <p style="font-size: 16px;">Best regards,<br><strong>SN Cleaning Team</strong></p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>SN Cleaning Services<br>
    Email: info@sncleaning.co.uk | Phone: 020 1234 5678</p>
  </div>
</body>
</html>',
  'Manual email template for requesting payment from customers when automatic payment fails. Can be sent to specific bookings.',
  true,
  '["customer_name", "booking_id", "booking_date", "booking_time", "address", "total_cost", "payment_link", "custom_message"]'
);