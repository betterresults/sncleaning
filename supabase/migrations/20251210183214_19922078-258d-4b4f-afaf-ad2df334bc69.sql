-- Fix the Payment Authorization Failed email template to use correct payment link
UPDATE email_notification_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .booking-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #dc2626; }
    .action-button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Payment Authorization Failed</h1>
    </div>
    <div class="content">
      <p>Dear {{customer_name}},</p>
      
      <p>We attempted to authorize payment for your upcoming cleaning service, but unfortunately the authorization was unsuccessful.</p>
      
      <div class="booking-details">
        <h3>Booking Details:</h3>
        <p><strong>Service Date:</strong> {{booking_date}}</p>
        <p><strong>Service Time:</strong> {{booking_time}}</p>
        <p><strong>Service Type:</strong> {{service_type}}</p>
        <p><strong>Address:</strong> {{address}}</p>
        <p><strong>Total Amount:</strong> £{{total_cost}}</p>
      </div>
      
      <div class="warning">
        <h3>🚨 Immediate Action Required</h3>
        <p>Please update your payment information immediately. We need to successfully authorize payment at least 24 hours before your scheduled service. If we are not able to authorize payment 12 hours before the service, your cleaning may be cancelled.</p>
      </div>
      
      <p><strong>Common reasons for authorization failure:</strong></p>
      <ul>
        <li>Insufficient funds in your account</li>
        <li>Expired or invalid payment card</li>
        <li>Card limit restrictions</li>
        <li>Bank security blocks</li>
      </ul>
      
      <p><strong>What to do next:</strong></p>
      <ol>
        <li>Check your payment method is valid and has sufficient funds</li>
        <li>Contact your bank if you suspect a security block</li>
        <li>Update your payment information by clicking the button below</li>
        <li>Contact us if you need assistance: sales@sncleaningservices.co.uk</li>
      </ol>
      
      <center>
        <a href="{{payment_link}}" class="action-button">Update Payment Method</a>
      </center>
      
      <p>If you have any questions or need assistance, please don''t hesitate to contact us.</p>
      
      <p>Best regards,<br>
      SN Cleaning Services Team</p>
    </div>
    <div class="footer">
      <p>SN Cleaning Services | sales@sncleaningservices.co.uk</p>
      <p>This is an automated notification regarding your booking.</p>
    </div>
  </div>
</body>
</html>',
variables = '["customer_name", "booking_date", "booking_time", "service_type", "address", "total_cost", "payment_link"]'::jsonb,
updated_at = now()
WHERE id = '8b244981-3823-49e0-98b8-e858a5dace71';