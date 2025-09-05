-- Create email template for payment method collection
INSERT INTO email_notification_templates (
  name,
  subject,
  description,
  html_content,
  text_content,
  variables,
  is_active
) VALUES (
  'payment_method_collection',
  'Add Your Payment Card - {{customer_name}}',
  'Email sent to customers when we need to collect their payment method details',
  '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Your Payment Card</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; background-color: #2563eb; color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
        .button { display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px; }
        .important { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Secure Card Setup</h1>
        </div>
        
        <p>Dear {{customer_name}},</p>
        
        <p>We need to securely collect your payment card details for future bookings with SN Cleaning Services.</p>
        
        <div class="important">
            <strong>📧 Your booking details:</strong><br>
            {{#if booking_date}}📅 Service Date: {{booking_date}}<br>{{/if}}
            {{#if address}}📍 Address: {{address}}<br>{{/if}}
            {{#if total_cost}}💰 Amount: £{{total_cost}}{{/if}}
        </div>
        
        <p>Click the secure button below to add your payment card:</p>
        
        <div style="text-align: center;">
            <a href="{{payment_link}}" class="button">🔒 Add Payment Card Securely</a>
        </div>
        
        <p><strong>Why do we need this?</strong></p>
        <ul>
            <li>✅ Secure, contactless payments for your cleaning services</li>
            <li>✅ No need to handle cash or cards on cleaning day</li>
            <li>✅ Your card details are safely stored by Stripe (used by millions)</li>
            <li>✅ You can update or remove your card anytime</li>
        </ul>
        
        <p><strong>🔐 Security Information:</strong></p>
        <ul>
            <li>This link is secure and encrypted</li>
            <li>We never see or store your full card details</li>
            <li>Powered by Stripe - bank-level security</li>
            <li>You will only be charged when services are completed</li>
        </ul>
        
        <p>If you have any questions, please contact us at <strong>sales@sncleaningservices.co.uk</strong> or call us.</p>
        
        <p>Thank you for choosing SN Cleaning Services!</p>
        
        <div class="footer">
            <p>SN Cleaning Services<br>
            Professional Cleaning Solutions<br>
            <a href="mailto:sales@sncleaningservices.co.uk">sales@sncleaningservices.co.uk</a></p>
            
            <p style="margin-top: 15px; font-size: 11px;">
                This is an automated email. If you didn''t request this, please ignore this email.<br>
                The secure link will expire in 24 hours for your security.
            </p>
        </div>
    </div>
</body>
</html>',
  'Dear {{customer_name}},

We need to securely collect your payment card details for future bookings with SN Cleaning Services.

{{#if booking_date}}Service Date: {{booking_date}}{{/if}}
{{#if address}}Address: {{address}}{{/if}}
{{#if total_cost}}Amount: £{{total_cost}}{{/if}}

Please click this secure link to add your payment card:
{{payment_link}}

Why do we need this?
- Secure, contactless payments for your cleaning services
- No need to handle cash or cards on cleaning day  
- Your card details are safely stored by Stripe
- You can update or remove your card anytime

Security Information:
- This link is secure and encrypted
- We never see or store your full card details
- Powered by Stripe - bank-level security
- You will only be charged when services are completed

If you have any questions, please contact us at sales@sncleaningservices.co.uk

Thank you for choosing SN Cleaning Services!

---
SN Cleaning Services
Professional Cleaning Solutions
sales@sncleaningservices.co.uk

This is an automated email. If you didn''t request this, please ignore this email.
The secure link will expire in 24 hours for your security.',
  '["customer_name", "booking_date", "address", "total_cost", "payment_link"]',
  true
);