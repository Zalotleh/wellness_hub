# Password Reset & Change Password Feature

## Overview

Complete implementation of secure password reset and change password functionality for the 5x5x5 Wellness Hub application.

## Features Implemented

### 1. Forgot Password Flow
- ✅ User requests password reset via email
- ✅ Secure token generation (32-byte random hex)
- ✅ Token expires after 1 hour
- ✅ One-time use tokens
- ✅ Email with reset link
- ✅ Security-focused (doesn't reveal if email exists)

### 2. Reset Password Flow
- ✅ User clicks link from email
- ✅ Token validation (exists, not used, not expired)
- ✅ Password strength requirements
- ✅ Real-time password validation
- ✅ Confirm password matching
- ✅ Confirmation email sent after reset

### 3. Change Password (Authenticated Users)
- ✅ Verify current password
- ✅ New password validation
- ✅ Prevent reusing same password
- ✅ Real-time strength indicator
- ✅ Confirmation email sent after change

## Database Schema

### PasswordResetToken Model

```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expires   DateTime
  used      Boolean  @default(false)
  usedAt    DateTime?
  createdAt DateTime @default(now())
  
  @@index([token])
  @@index([userId])
  @@index([expires])
}
```

## API Routes

### POST `/api/auth/forgot-password`

Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** (Always success for security)
```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive password reset instructions."
}
```

**Security Features:**
- Doesn't reveal if email exists in database
- Rate limiting recommended (add middleware)
- Old unused tokens are deleted
- Tokens expire after 1 hour

---

### POST `/api/auth/reset-password`

Reset password using token from email.

**Request Body:**
```json
{
  "token": "hex-token-from-email",
  "password": "newSecurePassword123"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Your password has been successfully reset"
}
```

**Error Responses:**
- `400` - Invalid or expired token
- `400` - Token already used
- `400` - Password too weak
- `500` - Server error

**Security Features:**
- Token can only be used once
- Expires after 1 hour
- Password strength validation
- Confirmation email sent

---

### POST `/api/auth/change-password`

Change password for authenticated user.

**Authentication:** Required (uses session)

**Request Body:**
```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newSecurePassword123"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Your password has been successfully changed"
}
```

**Error Responses:**
- `401` - Not authenticated
- `400` - Current password incorrect
- `400` - New password same as current
- `400` - Password too weak
- `500` - Server error

**Security Features:**
- Requires authentication
- Verifies current password
- Prevents password reuse
- Confirmation email sent

## Frontend Pages

### 1. Forgot Password Page
**Path:** `/auth/forgot-password`

**Features:**
- Email input with validation
- Loading states
- Success screen with instructions
- Link to login
- Dark mode support

### 2. Reset Password Page
**Path:** `/auth/reset-password?token=xxx`

**Features:**
- Token validation from URL
- New password input
- Confirm password input
- Real-time strength indicator
- Password requirements display
- Show/hide password toggles
- Success/error dialogs
- Redirect to login after success
- Dark mode support

### 3. Change Password Component
**Path:** Component for Profile/Settings page

**Features:**
- Current password verification
- New password input
- Confirm password input
- Real-time validation
- Password requirements
- Security tips
- Success/error dialogs
- Dark mode support

## Email Templates

### Password Reset Email

**Subject:** Reset Your 5x5x5 Wellness Hub Password

**Features:**
- Professional HTML template
- Gradient styling
- Clear CTA button
- Backup text link
- Security information
- Expiration warning
- Plain text fallback

### Password Changed Email

**Subject:** Your 5x5x5 Wellness Hub Password Has Been Changed

**Features:**
- Confirmation of change
- Timestamp
- Security alert if not requested
- Support contact info
- Security tips

## Email Service Integration

### Development Mode
- Emails logged to console
- No actual email sent
- Shows full email content

### Production Setup

**Option 1: SendGrid**
```env
SENDGRID_API_KEY=your_api_key
EMAIL_FROM=noreply@wellness-hub.com
```

**Option 2: Resend**
```env
RESEND_API_KEY=your_api_key
EMAIL_FROM=noreply@wellness-hub.com
```

**Option 3: AWS SES**
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
EMAIL_FROM=noreply@wellness-hub.com
```

## Environment Variables

Add to `.env`:

```env
# Required
NEXTAUTH_URL=https://your-domain.com
EMAIL_FROM=noreply@wellness-hub.com

# Choose one email service
SENDGRID_API_KEY=xxx
# OR
RESEND_API_KEY=xxx
# OR
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```

## Password Requirements

Passwords must meet these criteria:
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 number (0-9)
- ✅ Cannot be the same as current password (for change password)

## Security Best Practices

### Implemented
- ✅ Secure token generation (crypto.randomBytes)
- ✅ Token expiration (1 hour)
- ✅ One-time use tokens
- ✅ Password hashing (bcrypt)
- ✅ Current password verification
- ✅ Email confirmation
- ✅ No email enumeration (always returns success)
- ✅ Old tokens cleanup
- ✅ Session-based authentication

### Recommended Additions
- 🔒 Rate limiting (e.g., max 3 requests per hour per IP)
- 🔒 CAPTCHA for forgot password form
- 🔒 2FA option
- 🔒 Password history (prevent reusing last N passwords)
- 🔒 Account lockout after failed attempts
- 🔒 Email verification on new registrations
- 🔒 Security questions backup option

## Testing

### Manual Testing Checklist

**Forgot Password:**
- [ ] Request reset for existing email
- [ ] Request reset for non-existing email (should still show success)
- [ ] Check email received (or console in dev)
- [ ] Verify reset link format
- [ ] Try expired token (change expiration in DB)
- [ ] Try used token (reset twice with same token)

**Reset Password:**
- [ ] Valid token resets password
- [ ] Expired token shows error
- [ ] Used token shows error
- [ ] Invalid token shows error
- [ ] Weak password rejected
- [ ] Mismatched passwords rejected
- [ ] Success redirects to login
- [ ] Can login with new password
- [ ] Confirmation email received

**Change Password:**
- [ ] Must be logged in
- [ ] Wrong current password rejected
- [ ] Same password as current rejected
- [ ] Weak password rejected
- [ ] Mismatched passwords rejected
- [ ] Success shows dialog
- [ ] Can still login after change
- [ ] Confirmation email received

## Usage

### Adding to Profile Page

```tsx
import ChangePasswordForm from '@/components/profile/ChangePasswordForm';

export default function ProfilePage() {
  return (
    <div>
      {/* Other profile content */}
      
      <ChangePasswordForm />
    </div>
  );
}
```

### Custom Email Service

Update `/lib/email.ts`:

```typescript
export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  // Your email service implementation
  const response = await yourEmailService.send({
    to,
    from: process.env.EMAIL_FROM,
    subject,
    html,
  });
  
  return response;
}
```

## Troubleshooting

### Emails not sending
- Check `.env` has correct email API keys
- Verify email service is configured
- Check console logs in development
- Verify sender email is verified with service

### Token errors
- Run `npx prisma db push` to sync schema
- Run `npx prisma generate` to update client
- Restart development server
- Check token hasn't expired
- Verify token in database

### TypeScript errors
- Run `npx prisma generate`
- Restart VS Code TypeScript server
- Restart development server
- Clear `.next` cache

## Future Enhancements

- [ ] Add rate limiting middleware
- [ ] Implement CAPTCHA
- [ ] Add 2FA support
- [ ] Password strength meter with visual feedback
- [ ] Password history tracking
- [ ] Magic link authentication option
- [ ] Social login password reset handling
- [ ] Email templates customization UI
- [ ] Admin panel for viewing reset attempts
- [ ] Analytics for password reset success rates

## Files Created/Modified

### New Files
```
/lib/email.ts                                    - Email utility and templates
/app/api/auth/forgot-password/route.ts          - Forgot password API
/app/api/auth/reset-password/route.ts           - Reset password API
/app/api/auth/change-password/route.ts          - Change password API
/app/(auth)/reset-password/page.tsx             - Reset password page
/components/profile/ChangePasswordForm.tsx      - Change password component
/docs/PASSWORD_RESET_FEATURE.md                 - This documentation
```

### Modified Files
```
/prisma/schema.prisma                           - Added PasswordResetToken model
```

## Support

For issues or questions:
- Check this documentation
- Review error messages in console
- Check database for token status
- Verify email service configuration
- Test in development mode first

---

**Version:** 1.0  
**Last Updated:** December 18, 2025  
**Status:** ✅ Complete and Ready for Use
