-- Create customer portal login email template
INSERT INTO email_notification_templates (
  name,
  subject,
  html_content,
  variables,
  description,
  is_active
) VALUES (
  'customer_portal_login',
  'Access Your SN Cleaning Services Customer Portal',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #185166; margin: 0; font-size: 28px;">Welcome to Your Customer Portal! 🎉</h1>
        <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Manage your bookings and account easily online</p>
      </div>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #18A5A5;">
        <h2 style="color: #185166; margin: 0 0 15px 0; font-size: 20px;">Hello {{customer_name}}!</h2>
        <p style="color: #333; margin: 0; line-height: 1.6;">
          Great news! We''ve set up your customer account so you can manage your cleaning services online. You can now view your bookings, schedule new services, and much more!
        </p>
      </div>

      <div style="background-color: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h3 style="color: #185166; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #18A5A5; padding-bottom: 5px;">🔑 Login Details</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold; width: 30%;">🌐 Website:</td>
            <td style="padding: 8px 0; color: #333;"><a href="https://account.sncleaningservices.co.uk" style="color: #18A5A5; text-decoration: none;">account.sncleaningservices.co.uk</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">📧 Email:</td>
            <td style="padding: 8px 0; color: #333;">{{customer_email}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">🔐 Temporary Password:</td>
            <td style="padding: 8px 0; color: #18A5A5; font-weight: bold; font-size: 18px;">{{temp_password}}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">🛡️ Important Security Note</h3>
        <p style="color: #856404; margin: 0; line-height: 1.6; font-size: 14px;">
          Please change your password after your first login for security purposes. You can do this in your account settings.
        </p>
      </div>

      <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #185166; margin: 0 0 15px 0; font-size: 18px;">✨ What You Can Do</h3>
        <ul style="color: #333; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>View all your upcoming and past bookings</li>
          <li>Schedule new cleaning services</li>
          <li>Update your contact information and addresses</li>
          <li>View cleaning photos after service completion</li>
          <li>Manage your payment methods</li>
          <li>Chat with our team and cleaners</li>
        </ul>
      </div>

      <div style="text-align: center; margin-bottom: 20px;">
        <a href="https://account.sncleaningservices.co.uk" style="display: inline-block; background-color: #18A5A5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
          Access Your Account Now →
        </a>
      </div>

      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #185166; margin: 0 0 10px 0; font-size: 16px;">📞 Need Help?</h3>
        <p style="color: #666; margin: 0; line-height: 1.6;">
          If you have any questions about using your customer portal, please don''t hesitate to contact us. We''re here to help make your experience as smooth as possible!
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
  '["customer_name", "customer_email", "temp_password"]',
  'Sent to inform customers about their customer portal access',
  true
);