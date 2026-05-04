# Email Configuration Guide

## Setup Instructions

### 1. Install Nodemailer
```bash
npm install nodemailer
```

### 2. Gmail SMTP Setup (Recommended)

#### Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com
2. Click "Security" on the left
3. Enable "2-Step Verification"

#### Step 2: Create App-Specific Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Google will generate a 16-character password
4. Copy this password

#### Step 3: Update .env File
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

### 3. Alternative: Use Other Email Services

#### Using SendGrid
```env
EMAIL_SERVICE=sendgrid
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.xxxxxxxxxxxxxxxxxxx
```

#### Using Mailgun
```env
EMAIL_SERVICE=mailgun
EMAIL_USER=postmaster@yourdomain.com
EMAIL_PASSWORD=your-mailgun-api-key
```

---

## Automated Email Workflows

### 1️⃣ Registration Email
- **When:** User registers
- **Contains:** 
  - Welcome message
  - Referral code
  - Next steps
  - Dashboard link

### 2️⃣ KYC Approval Email
- **When:** Admin approves KYC
- **Contains:**
  - KYC approved notification
  - Available plans
  - Payment methods
  - Call-to-action button

### 3️⃣ Plan Activation Email
- **When:** Admin approves offline/bank payment
- **Contains:**
  - Plan activated confirmation
  - Plan details
  - **Referral code (highlighted)**
  - Instructions to share code
  - Dashboard link

### 4️⃣ Payment Rejection Email
- **When:** Admin rejects payment
- **Contains:**
  - Rejection notice
  - Rejection reason
  - What to do next
  - Support contact link

---

## Testing Email Sending

### Using Mailtrap (for Testing)
1. Go to https://mailtrap.io
2. Create free account
3. Create new inbox
4. Copy SMTP credentials
5. Update .env:
```env
EMAIL_SERVICE=mailtrap
EMAIL_USER=your_mailtrap_username
EMAIL_PASSWORD=your_mailtrap_password
```

---

## Environment Variables Required

| Variable | Example | Purpose |
|----------|---------|---------|
| EMAIL_SERVICE | gmail | Email service provider |
| EMAIL_USER | your-email@gmail.com | Sender email |
| EMAIL_PASSWORD | xxxx xxxx xxxx xxxx | App password |
| ADMIN_EMAIL | admin@mlmnetwork.com | Admin notification email |
| APP_URL | http://localhost:3000 | Base URL for email links |
| OFFICE_PHONE | 9876543210 | Contact in emails |
| OFFICE_ADDRESS | New Delhi | Address in emails |

---

## Files Created/Modified

### New Files:
- `Utils/Email.js` - Email sending functions

### Modified Files:
- `Controllers/UserController.js` - Added registration email
- `Controllers/AdminController.js` - Added KYC, approval, rejection emails
- `.env.example` - Email configuration template

---

## Email Functions Available

```javascript
// Send registration email
sendRegistrationEmail(user)

// Send KYC approval email
sendKYCApprovalEmail(user)

// Send plan activation email
sendPlanActivationEmail(user, plan, amount, referralCode)

// Send payment rejection email
sendPaymentRejectionEmail(user, plan, reason)

// Send contact form email (admin notification)
sendContactFormEmail(name, email, subject, message)
```

---

## Troubleshooting

### Email Not Sending
1. Check `.env` file for correct credentials
2. Verify email service is set correctly
3. Check console logs for error messages
4. Test with Mailtrap first

### Gmail App Password Issues
- Make sure 2FA is enabled
- Token should have spaces every 4 characters
- Copy the full 16-character password with spaces

### Email Template Not Showing
- Check email client HTML support
- Some clients may have different rendering
- Test in different email clients

---

## Next Steps

1. ✅ Install nodemailer: `npm install nodemailer`
2. ✅ Configure .env with email credentials
3. ✅ Test registration email
4. ✅ Test KYC approval email
5. ✅ Test offline payment approval email
6. ✅ Deploy to production

All done! 🎉
