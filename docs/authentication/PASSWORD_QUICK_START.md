# Password Management Feature - Quick Start Guide

## ✅ What's Been Implemented

### 1. **Forgot Password Flow**
Users can reset their password if they forget it.

**How it works:**
1. User visits `/auth/forgot-password`
2. Enters their email
3. Receives reset link via email (expires in 1 hour)
4. Clicks link to set new password
5. Receives confirmation email

### 2. **Reset Password with Token**
Users can reset password using link from email.

**How it works:**
1. User clicks link from email: `/auth/reset-password?token=xxx`
2. Enters new password with real-time validation
3. Password is reset
4. Confirmation email sent
5. Redirected to login

### 3. **Change Password (While Logged In)**
Authenticated users can change their password from profile/settings.

**How it works:**
1. User goes to profile/settings
2. Uses `ChangePasswordForm` component
3. Enters current password
4. Enters new password
5. Password changed with confirmation email

## 🚀 Quick Setup

### Step 1: Database is Ready ✅
Schema has been updated and migrated. Nothing to do!

### Step 2: Add Email Service (Choose One)

**For Development:** Emails are logged to console automatically.

**For Production:** Add to `.env`:

```env
# Option A: SendGrid (recommended)
SENDGRID_API_KEY=your_api_key_here
EMAIL_FROM=noreply@wellness-hub.com

# Option B: Resend
RESEND_API_KEY=your_api_key_here
EMAIL_FROM=noreply@wellness-hub.com

# Option C: AWS SES
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
EMAIL_FROM=noreply@wellness-hub.com

# Required
NEXTAUTH_URL=https://your-production-domain.com
```

Then update `/lib/email.ts` sendEmail function with your chosen service.

### Step 3: Add Change Password to Profile Page

```tsx
// In your profile or settings page
import ChangePasswordForm from '@/components/profile/ChangePasswordForm';

export default function ProfilePage() {
  return (
    <div>
      {/* Your other profile content */}
      
      <ChangePasswordForm />
    </div>
  );
}
```

## 📧 Email Setup Guide

### SendGrid (Recommended)
1. Sign up at https://sendgrid.com
2. Create API key
3. Verify sender email
4. Add to `.env`
5. Uncomment SendGrid code in `/lib/email.ts`

### Resend (Easiest)
1. Sign up at https://resend.com
2. Get API key
3. Verify domain
4. Add to `.env`
5. Uncomment Resend code in `/lib/email.ts`

## 🧪 Testing

### Development Mode
Emails are automatically logged to console:
```
📧 EMAIL SENT (Development Mode)
=====================================
To: user@example.com
Subject: Reset Your Password
HTML Preview: ...
=====================================
```

### Test the Flow
1. Go to `/auth/forgot-password`
2. Enter email
3. Check console for reset link
4. Copy link and open in browser
5. Reset password
6. Login with new password

## 📁 Files You Might Want to Customize

1. **Email Templates** - `/lib/email.ts`
   - Change styling, colors, text
   - Add your logo
   - Customize email copy

2. **Password Requirements** - Update in:
   - `/app/(auth)/reset-password/page.tsx`
   - `/components/profile/ChangePasswordForm.tsx`
   - `/app/api/auth/reset-password/route.ts`
   - `/app/api/auth/change-password/route.ts`

3. **Token Expiration** - `/app/api/auth/forgot-password/route.ts`
   ```typescript
   // Change from 1 hour to your preference
   expires.setHours(expires.getHours() + 1);
   ```

## 🔒 Security Features Included

- ✅ Secure random token generation
- ✅ Tokens expire after 1 hour
- ✅ One-time use tokens
- ✅ Email doesn't reveal if account exists
- ✅ Password strength validation
- ✅ Bcrypt password hashing
- ✅ Current password verification
- ✅ Confirmation emails

## 🛠️ Troubleshooting

**Prisma errors?**
```bash
npx prisma generate
npm run dev
```

**Emails not sending?**
- Check `.env` has correct keys
- In development, check console logs
- Verify sender email with email service

**TypeScript errors?**
- Restart VS Code
- Restart dev server
- Run `npx prisma generate`

## 📚 Full Documentation

See `/docs/PASSWORD_RESET_FEATURE.md` for:
- Complete API documentation
- Security best practices
- Advanced configuration
- Testing checklists
- Future enhancement ideas

## 🎯 Next Steps

1. **Now:** Test in development mode
2. **Before Production:** 
   - Set up email service
   - Add rate limiting
   - Consider CAPTCHA
   - Test all flows
3. **Future Enhancements:**
   - 2FA support
   - Magic link authentication
   - Password history
   - Account recovery questions

---

**Need Help?** Check the full docs or the code comments!
