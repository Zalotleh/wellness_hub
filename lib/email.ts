/**
 * Email utility for sending transactional emails
 * 
 * For production, integrate with:
 * - SendGrid
 * - AWS SES
 * - Resend
 * - Mailgun
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  // For development: Log email to console
  if (process.env.NODE_ENV === 'development') {
    console.log('\n📧 EMAIL SENT (Development Mode)');
    console.log('=====================================');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML Preview:', html.substring(0, 200) + '...');
    console.log('=====================================\n');
    return { success: true, messageId: 'dev-mode' };
  }

  // For production: Integrate with your email service
  // Example with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to,
    from: process.env.EMAIL_FROM,
    subject,
    text: text || html.replace(/<[^>]*>/g, ''),
    html,
  };
  
  await sgMail.send(msg);
  */

  // Example with Resend:
  /*
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
  */

  // Placeholder for production
  console.warn('⚠️ Email service not configured. Email would be sent to:', to);
  return { success: true, messageId: 'placeholder' };
}

export function generatePasswordResetEmail(resetUrl: string, userName?: string) {
  const appName = '5x5x5 Wellness Hub';
  
  return {
    subject: `Reset Your ${appName} Password`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 10px;
            padding: 30px;
          }
          .card {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          h1 {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            padding: 14px 28px;
            background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            opacity: 0.9;
          }
          .info-box {
            background: #f3f4f6;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 14px;
          }
          .link {
            color: #3b82f6;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <div class="logo">🌟 ${appName}</div>
            </div>
            
            <h1>Reset Your Password</h1>
            
            <p>Hi ${userName || 'there'},</p>
            
            <p>We received a request to reset your password for your ${appName} account. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="info-box">
              <strong>⏰ This link expires in 1 hour</strong>
              <p style="margin: 5px 0 0 0; font-size: 14px;">For security reasons, this password reset link will only work once.</p>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p class="link">${resetUrl}</p>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <strong>Didn't request this?</strong><br>
              If you didn't ask to reset your password, you can safely ignore this email. Your password won't be changed.
            </p>
            
            <div class="footer">
              <p>This email was sent by ${appName}</p>
              <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Reset Your ${appName} Password

Hi ${userName || 'there'},

We received a request to reset your password for your ${appName} account.

Click this link to reset your password:
${resetUrl}

This link expires in 1 hour and will only work once.

If you didn't request this, you can safely ignore this email.

© ${new Date().getFullYear()} ${appName}
    `.trim(),
  };
}

export function generatePasswordChangedEmail(userName?: string) {
  const appName = '5x5x5 Wellness Hub';
  
  return {
    subject: `Your ${appName} Password Has Been Changed`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 10px;
            padding: 30px;
          }
          .card {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .success-icon {
            text-align: center;
            font-size: 48px;
            margin: 20px 0;
          }
          h1 {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .alert-box {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <div class="logo">🌟 ${appName}</div>
            </div>
            
            <div class="success-icon">✅</div>
            
            <h1>Password Successfully Changed</h1>
            
            <p>Hi ${userName || 'there'},</p>
            
            <p>This email confirms that your ${appName} password has been successfully changed.</p>
            
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            
            <div class="alert-box">
              <strong>⚠️ Didn't make this change?</strong>
              <p style="margin: 5px 0 0 0; font-size: 14px;">
                If you didn't change your password, please contact our support team immediately at support@wellness-hub.com
              </p>
            </div>
            
            <p style="margin-top: 30px;">
              For your security, we recommend:
            </p>
            <ul>
              <li>Using a unique password for each account</li>
              <li>Changing passwords regularly</li>
              <li>Never sharing your password with anyone</li>
            </ul>
            
            <div class="footer">
              <p>This email was sent by ${appName}</p>
              <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Password Successfully Changed - ${appName}

Hi ${userName || 'there'},

This email confirms that your ${appName} password has been successfully changed.

Time: ${new Date().toLocaleString()}

If you didn't make this change, please contact support immediately at support@wellness-hub.com

© ${new Date().getFullYear()} ${appName}
    `.trim(),
  };
}
