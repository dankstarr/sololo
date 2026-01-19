// Email utility for sending invitations
// Supports multiple email providers via environment variables

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, text } = options

  // Check if Resend API key is configured (recommended for production)
  const resendApiKey = process.env.RESEND_API_KEY
  if (resendApiKey) {
    return sendViaResend({ to, subject, html, text }, resendApiKey)
  }

  // Check if SMTP is configured
  const smtpHost = process.env.SMTP_HOST
  if (smtpHost) {
    return sendViaSMTP({ to, subject, html, text })
  }

  // Fallback: Log email in development (for testing without email service)
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email (dev mode - not sent):', {
      to,
      subject,
      html,
    })
    return true
  }

  console.error('No email service configured. Set RESEND_API_KEY or SMTP_* variables.')
  return false
}

async function sendViaResend(
  options: EmailOptions,
  apiKey: string
): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Sololo <noreply@sololo.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Resend API error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending email via Resend:', error)
    return false
  }
}

async function sendViaSMTP(options: EmailOptions): Promise<boolean> {
  // For SMTP, you would use nodemailer or similar
  // This is a placeholder - implement if needed
  console.warn('SMTP email sending not yet implemented. Use Resend or implement nodemailer.')
  return false
}

export function generateInvitationEmailHtml(
  inviterName: string,
  groupName: string,
  destination: string,
  verificationUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Group Invitation - Sololo</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi there!
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${inviterName}</strong> has invited you to join a travel group:
    </p>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="margin-top: 0; color: #667eea; font-size: 22px;">${groupName || destination}</h2>
      <p style="margin: 10px 0; color: #6b7280;">
        <strong>Destination:</strong> ${destination}
      </p>
    </div>
    
    <p style="font-size: 16px; margin: 30px 0;">
      Click the button below to accept the invitation and join the group chat:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" 
         style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Accept Invitation
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Or copy and paste this link into your browser:<br>
      <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
    </p>
    
    <p style="font-size: 12px; color: #9ca3af; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>Sent from Sololo - Your AI Travel Companion</p>
  </div>
</body>
</html>
  `.trim()
}
