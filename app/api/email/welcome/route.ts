import { NextRequest, NextResponse } from 'next/server'
import { appInfo } from '@/config/app-info'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, userId } = body

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    // In production, use a proper email service like Resend, SendGrid, or AWS SES
    // For now, we'll use a simple approach that logs the email
    // You can integrate with your preferred email service here

    const welcomeEmail = {
      to: email,
      subject: `Welcome to ${appInfo.name}! 🎉`,
      html: generateWelcomeEmailHTML(name, email, userId),
      text: generateWelcomeEmailText(name, email, userId),
    }

    // TODO: Replace this with actual email sending service
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: `Sololo <noreply@${process.env.EMAIL_DOMAIN}>`,
    //   to: email,
    //   subject: welcomeEmail.subject,
    //   html: welcomeEmail.html,
    // })

    // For development, log the email
    console.log('Welcome Email:', {
      to: email,
      subject: welcomeEmail.subject,
      // In production, remove this log
    })

    // In a real app, you would send the email here
    // For now, we'll simulate success
    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully',
    })
  } catch (e) {
    console.error('Error sending welcome email:', e)
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    )
  }
}

function generateWelcomeEmailHTML(name: string, email: string, userId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Sololo</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Welcome to Sololo!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Hi ${name},</h2>
    
    <p style="font-size: 16px; color: #4b5563;">
      Thank you for joining Sololo! We're excited to have you on board. Your AI-powered travel companion is ready to help you plan amazing trips and discover new destinations.
    </p>
    
    <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
      <h3 style="color: #1f2937; margin-top: 0;">Your Account Details:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Email:</td>
          <td style="padding: 8px 0; color: #1f2937;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Account ID:</td>
          <td style="padding: 8px 0; color: #1f2937; font-family: monospace; font-size: 12px;">${userId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Status:</td>
          <td style="padding: 8px 0; color: #10b981; font-weight: 600;">✓ Active</td>
        </tr>
      </table>
    </div>
    
    <div style="margin: 30px 0;">
      <h3 style="color: #1f2937;">What's Next?</h3>
      <ul style="color: #4b5563; padding-left: 20px;">
        <li style="margin-bottom: 10px;">📧 <strong>Verify your email</strong> - Check your inbox for a verification link</li>
        <li style="margin-bottom: 10px;">✈️ <strong>Plan your first trip</strong> - Create an itinerary with AI assistance</li>
        <li style="margin-bottom: 10px;">🗺️ <strong>Explore destinations</strong> - Discover amazing places around the world</li>
        <li style="margin-bottom: 10px;">🎧 <strong>Listen to audio guides</strong> - Get immersive travel experiences</li>
        <li style="margin-bottom: 10px;">👥 <strong>Connect with travelers</strong> - Join groups and share your adventures</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${appUrl}/app/home" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Get Started →
      </a>
    </div>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-top: 30px;">
      <h4 style="color: #1f2937; margin-top: 0;">Need Help?</h4>
      <p style="color: #6b7280; margin-bottom: 10px; font-size: 14px;">
        If you have any questions or need assistance, feel free to reach out:
      </p>
      <p style="color: #6b7280; margin: 0; font-size: 14px;">
        📧 Email: <a href="mailto:${appInfo.email}" style="color: #667eea; text-decoration: none;">${appInfo.email}</a><br>
        🌐 Website: <a href="${appUrl}" style="color: #667eea; text-decoration: none;">${appUrl}</a>
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
      This email was sent to ${email}. If you didn't create an account with Sololo, please ignore this email.<br>
      <a href="${appUrl}/privacy" style="color: #9ca3af;">Privacy Policy</a> | 
      <a href="${appUrl}/terms" style="color: #9ca3af;">Terms of Service</a>
    </p>
  </div>
</body>
</html>
  `
}

function generateWelcomeEmailText(name: string, email: string, userId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  return `
Welcome to Sololo! 🎉

Hi ${name},

Thank you for joining Sololo! We're excited to have you on board. Your AI-powered travel companion is ready to help you plan amazing trips and discover new destinations.

Your Account Details:
- Email: ${email}
- Account ID: ${userId}
- Status: ✓ Active

What's Next?
- 📧 Verify your email - Check your inbox for a verification link
- ✈️ Plan your first trip - Create an itinerary with AI assistance
- 🗺️ Explore destinations - Discover amazing places around the world
- 🎧 Listen to audio guides - Get immersive travel experiences
- 👥 Connect with travelers - Join groups and share your adventures

Get Started: ${appUrl}/app/home

Need Help?
Email: ${appInfo.email}
Website: ${appUrl}

---
This email was sent to ${email}. If you didn't create an account with Sololo, please ignore this email.
Privacy Policy: ${appUrl}/privacy
Terms of Service: ${appUrl}/terms
  `
}
