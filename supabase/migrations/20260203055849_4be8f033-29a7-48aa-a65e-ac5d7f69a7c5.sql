-- Create SMS template for incomplete payment follow-up
INSERT INTO sms_templates (id, name, content, description, variables, is_active)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Incomplete Payment Follow-up',
  'Hi {{customer_name}}, we noticed you started a booking but didn''t complete payment. Your {{service_type}} cleaning is not yet confirmed. Complete your booking here: {{payment_link}} - SN Cleaning',
  'Follow-up SMS sent to customers who started a booking but did not complete payment',
  '["customer_name", "service_type", "payment_link"]',
  true
);

-- Create email template for incomplete payment follow-up
INSERT INTO email_notification_templates (id, name, subject, html_content, text_content, description, variables, is_active)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Incomplete Payment Follow-up',
  'Complete Your Booking - {{service_type}} Cleaning',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Booking</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #1e3a5f; padding: 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">SN Cleaning Services</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1e3a5f; margin: 0 0 20px 0; font-size: 22px;">Hi {{customer_name}},</h2>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We noticed you started booking a {{service_type}} cleaning service but didn''t complete the payment step.
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Your booking is not yet confirmed. To secure your preferred date and time, please complete your payment:
              </p>
              
              <table role="presentation" style="width: 100%; background-color: #f8f9fa; border-radius: 8px; margin: 25px 0;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="color: #1e3a5f; margin: 0 0 15px 0; font-size: 18px;">Booking Details</h3>
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="color: #666666; padding: 8px 0; font-size: 15px;">Service:</td>
                        <td style="color: #1e3a5f; padding: 8px 0; font-size: 15px; font-weight: 600; text-align: right;">{{service_type}}</td>
                      </tr>
                      <tr>
                        <td style="color: #666666; padding: 8px 0; font-size: 15px;">Date:</td>
                        <td style="color: #1e3a5f; padding: 8px 0; font-size: 15px; font-weight: 600; text-align: right;">{{booking_date}}</td>
                      </tr>
                      <tr>
                        <td style="color: #666666; padding: 8px 0; font-size: 15px;">Time:</td>
                        <td style="color: #1e3a5f; padding: 8px 0; font-size: 15px; font-weight: 600; text-align: right;">{{booking_time}}</td>
                      </tr>
                      <tr>
                        <td style="color: #666666; padding: 8px 0; font-size: 15px;">Total:</td>
                        <td style="color: #1e3a5f; padding: 8px 0; font-size: 15px; font-weight: 600; text-align: right;">£{{total_cost}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center; padding: 10px 0;">
                    <a href="{{payment_link}}" style="display: inline-block; background-color: #1e3a5f; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">Complete Payment</a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0; text-align: center;">
                If you have any questions, please contact us. We''re here to help!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666666; font-size: 13px; margin: 0 0 10px 0;">SN Cleaning Services</p>
              <p style="color: #999999; font-size: 12px; margin: 0;">Professional cleaning you can trust.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Hi {{customer_name}}, we noticed you started booking a {{service_type}} cleaning but didn''t complete payment. Your booking is not yet confirmed. Complete your payment here: {{payment_link}}',
  'Follow-up email sent to customers who started a booking but did not complete payment',
  '["customer_name", "service_type", "booking_date", "booking_time", "total_cost", "payment_link"]',
  true
);

-- Create the notification trigger for incomplete payment follow-up
INSERT INTO notification_triggers (
  id,
  name,
  trigger_event,
  template_id,
  sms_template_id,
  recipient_types,
  is_enabled,
  timing_offset,
  timing_unit,
  notification_channel,
  conditions
)
VALUES (
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'Incomplete Payment Follow-up',
  'incomplete_payment',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  ARRAY['customer'],
  true,
  30,
  'minutes',
  'both',
  '["payment_status_unpaid", "payment_method_stripe", "no_invoice_id"]'
);