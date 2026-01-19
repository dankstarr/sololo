# Email Setup Guide

This guide explains how to set up email sending for Sololo, including welcome emails and password reset emails.

## Overview

Sololo uses email for:
- Welcome emails when users register
- Password reset emails
- Email verification (handled by Supabase)

## Email Service Options

### Option 1: Resend (Recommended)

Resend is a modern email API built for developers.

1. **Sign up** at [resend.com](https://resend.com)
2. **Get your API key** from the dashboard
3. **Add to `.env.local`**:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   EMAIL_FROM=noreply@yourdomain.com
   ```

4. **Update `/app/api/email/welcome/route.ts`**:
   ```typescript
   import { Resend } from 'resend'
   
   const resend = new Resend(process.env.RESEND_API_KEY)
   
   await resend.emails.send({
     from: process.env.EMAIL_FROM || 'Sololo <noreply@sololo.com>',
     to: email,
     subject: welcomeEmail.subject,
     html: welcomeEmail.html,
   })
   ```

### Option 2: SendGrid

1. **Sign up** at [sendgrid.com](https://sendgrid.com)
2. **Create API key** in Settings > API Keys
3. **Add to `.env.local`**:
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   EMAIL_FROM=noreply@yourdomain.com
   ```

4. **Install SendGrid**:
   ```bash
   npm install @sendgrid/mail
   ```

5. **Update the email route** to use SendGrid

### Option 3: AWS SES

1. **Set up AWS SES** in your AWS account
2. **Verify your domain** or email address
3. **Create IAM credentials** with SES permissions
4. **Add to `.env.local`**:
   ```env
   AWS_SES_REGION=us-east-1
   AWS_ACCESS_KEY_ID=xxxxx
   AWS_SECRET_ACCESS_KEY=xxxxx
   EMAIL_FROM=noreply@yourdomain.com
   ```

### Option 4: Supabase Email (Development)

Supabase can send emails directly, but it's limited. For production, use a dedicated email service.

## Environment Variables

Add these to your `.env.local`:

```env
# Email Service (choose one)
RESEND_API_KEY=your_resend_api_key
# OR
SENDGRID_API_KEY=your_sendgrid_api_key
# OR
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Email Configuration
EMAIL_FROM=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Testing

In development, emails are logged to the console. Check your server logs to see the email content.

For production, ensure your email service is properly configured and test the welcome email flow.

## Email Templates

Welcome emails are generated in `/app/api/email/welcome/route.ts`. You can customize:
- HTML template (`generateWelcomeEmailHTML`)
- Plain text template (`generateWelcomeEmailText`)

## Troubleshooting

1. **Emails not sending**: Check your API keys and service configuration
2. **Emails going to spam**: Set up SPF/DKIM records for your domain
3. **Rate limits**: Check your email service's rate limits
4. **Supabase emails**: Ensure Supabase email settings are configured in the Supabase dashboard
