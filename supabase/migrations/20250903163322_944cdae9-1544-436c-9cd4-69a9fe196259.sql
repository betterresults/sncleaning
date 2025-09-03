-- Update booking confirmation email template
UPDATE email_notification_templates 
SET 
  html_content = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #185166; margin: 0; font-size: 28px;">Booking Confirmed! 🎉</h1>
        <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Your cleaning service has been successfully booked</p>
      </div>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #18A5A5;">
        <h2 style="color: #185166; margin: 0 0 15px 0; font-size: 20px;">Hello {{customer_name}}!</h2>
        <p style="color: #333; margin: 0; line-height: 1.6;">
          Great news! Your cleaning service booking has been confirmed and scheduled. We''re looking forward to providing you with excellent service.
        </p>
      </div>

      <div style="background-color: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h3 style="color: #185166; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #18A5A5; padding-bottom: 5px;">📋 Booking Details</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold; width: 30%;">📅 Date:</td>
            <td style="padding: 8px 0; color: #333;">{{booking_date}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">⏰ Time:</td>
            <td style="padding: 8px 0; color: #333;">{{booking_time}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">🧹 Service:</td>
            <td style="padding: 8px 0; color: #333;">{{service_type}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">📍 Address:</td>
            <td style="padding: 8px 0; color: #333;">{{address}}</td>
          </tr>
          {{#if cleaner_name}}
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">👤 Cleaner:</td>
            <td style="padding: 8px 0; color: #333;">{{cleaner_name}}</td>
          </tr>
          {{/if}}
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">💰 Total Cost:</td>
            <td style="padding: 8px 0; color: #18A5A5; font-weight: bold; font-size: 18px;">£{{total_cost}}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #185166; margin: 0 0 10px 0; font-size: 16px;">📞 Need to make changes or have questions?</h3>
        <p style="color: #666; margin: 0; line-height: 1.6;">
          Please contact us as soon as possible if you need to reschedule or have any special requirements for your cleaning service.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #666; margin: 0; font-size: 14px;">
          Thank you for choosing SN Cleaning Services! ✨
        </p>
        <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">
          We look forward to providing you with exceptional cleaning service.
        </p>
      </div>
    </div>
  </div>',
  subject = 'Your Cleaning Service is Booked! - {{booking_date}}'
WHERE name = 'booking_created';