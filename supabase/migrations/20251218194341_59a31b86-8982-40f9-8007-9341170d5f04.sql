-- Update the complete_booking_link template to remove conditional syntax
UPDATE email_notification_templates 
SET html_content = '<!DOCTYPE html>
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
          <!-- Header -->
          <tr>
            <td style="background-color: #1e3a5f; padding: 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">SN Cleaning Services</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1e3a5f; margin: 0 0 20px 0; font-size: 22px;">Hi {{customer_name}},</h2>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for choosing SN Cleaning! We are delighted to provide you with a quote for your {{service_type}} cleaning service.
              </p>
              
              <!-- Quote Details Box -->
              <table role="presentation" style="width: 100%; background-color: #f8f9fa; border-radius: 8px; margin: 25px 0;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="color: #1e3a5f; margin: 0 0 15px 0; font-size: 18px;">Your Quote Details</h3>
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="color: #666666; padding: 8px 0; font-size: 15px;">Total Cost:</td>
                        <td style="color: #1e3a5f; padding: 8px 0; font-size: 15px; font-weight: 600; text-align: right;">£{{total_cost}}</td>
                      </tr>
                      <tr>
                        <td style="color: #666666; padding: 8px 0; font-size: 15px;">Estimated Duration:</td>
                        <td style="color: #1e3a5f; padding: 8px 0; font-size: 15px; font-weight: 600; text-align: right;">{{estimated_hours}} hours</td>
                      </tr>
                      <tr>
                        <td style="color: #666666; padding: 8px 0; font-size: 15px;">Location:</td>
                        <td style="color: #1e3a5f; padding: 8px 0; font-size: 15px; font-weight: 600; text-align: right;">{{postcode}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                To complete your booking and secure your preferred date and time, simply click the button below:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center; padding: 10px 0;">
                    <a href="{{booking_url}}" style="display: inline-block; background-color: #1e3a5f; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">Complete Your Booking</a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0; text-align: center;">
                If you have any questions, please don''t hesitate to contact us.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666666; font-size: 13px; margin: 0 0 10px 0;">SN Cleaning Services</p>
              <p style="color: #999999; font-size: 12px; margin: 0;">This quote is valid for 7 days.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
updated_at = now()
WHERE name = 'complete_booking_link';