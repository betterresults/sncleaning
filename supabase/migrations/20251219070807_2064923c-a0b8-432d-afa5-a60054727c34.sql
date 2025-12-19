-- Create staff invitation email template
INSERT INTO public.email_notification_templates (
  name,
  subject,
  description,
  html_content,
  variables,
  is_active
) VALUES (
  'staff_invitation',
  'Welcome to SN Cleaning Services - Set Up Your Account',
  'Sent to new staff members (cleaners, sales agents, admins) when their account is created',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SN Cleaning Services</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1a365d; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to SN Cleaning Services</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hello {{first_name}},
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Your account has been created as a <strong>{{role_display}}</strong> at SN Cleaning Services.
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Here are your login details:
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; border-radius: 6px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; color: #666666;"><strong>Email:</strong> {{email}}</p>
                    <p style="margin: 0; color: #666666;"><strong>Temporary Password:</strong> {{temp_password}}</p>
                  </td>
                </tr>
              </table>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Please click the button below to log in and change your password:
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #2563eb; border-radius: 6px;">
                    <a href="{{login_url}}" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                      Log In to Your Account
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0; padding-top: 20px; border-top: 1px solid #eeeeee;">
                If the button does not work, copy and paste this link into your browser:<br>
                <a href="{{login_url}}" style="color: #2563eb;">{{login_url}}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2024 SN Cleaning Services. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["first_name", "last_name", "email", "temp_password", "role_display", "login_url"]'::jsonb,
  true
);