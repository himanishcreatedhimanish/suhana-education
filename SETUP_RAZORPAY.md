# Enabling Razorpay Payments for Suhana Education

Your Suhana Education platform **already has Razorpay fully implemented** for course and plan payments. To enable real payments, you just need to configure your Razorpay API keys.

## Current Status

✅ **Already implemented:**
- Course purchase flow with Razorpay checkout
- Plan subscription with Razorpay
- Payment verification & HMAC signature validation
- Automatic enrollment after successful payment
- Payment webhooks for order status updates
- Demo mode fallback (no real charges)

❌ **To enable in production:**
- Get Razorpay API keys from your Razorpay account

---

## How to Enable Razorpay Payments

### Step 1: Create a Razorpay Account

1. **Visit**: https://razorpay.com/
2. **Sign up** with:
   - Email
   - Mobile number
   - Business details
3. **Verify** your email and phone
4. You'll get instant test mode access

### Step 2: Get Your API Keys

1. **Go to Razorpay Dashboard** → **Settings → API Keys**
2. You'll see two sets of keys:
   - **Test Mode** (for development/testing)
   - **Live Mode** (for real payments)

3. **Copy these from Test Mode first**:
   - Key ID: `rzp_test_XXXXXXXXXXXX...`
   - Key Secret: `xxxxxxxxxxxxxxx...`

### Step 3: Add Keys to Your Environment

#### For Vercel Deployment:

1. **Go to Vercel Dashboard** → Your Project → **Settings → Environment Variables**
2. Add two variables (from Razorpay test keys):
   ```
   NEXT_PUBLIC_RAZORPAY_KEY_ID = rzp_test_XXXXXXXXXXXX
   RAZORPAY_KEY_SECRET = xxxxxxxxxxxxxxx
   ```
3. **Redeploy** your project

#### For Local Development:

1. Create `.env.local` in your project root:
   ```
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxx
   ```
2. **Restart** your dev server

---

## Testing Payments with Test Mode

### Test Credit Cards (Provided by Razorpay)

Use these cards to test without real charges:

| Card Type | Card Number | Expiry | CVV |
|-----------|-------------|--------|-----|
| Visa      | 4111 1111 1111 1111 | 12/25 | 123 |
| Mastercard | 5555 5555 5555 4444 | 12/25 | 123 |
| Amex      | 3782 822463 10005  | 12/25 | 1234 |

**These cards will NOT charge your account** — they're for testing only.

### Test OTP

- OTP: **000000** (six zeros)
- Always works in test mode

### Testing the Flow

1. **Go to your Suhana site** → **Plans** or **Courses**
2. Click **"Choose" or "Enroll"** on a paid item
3. Razorpay checkout will open
4. Use test card (e.g., 4111 1111 1111 1111)
5. Expiry: 12/25, CVV: 123
6. OTP: 000000
7. **Payment will succeed** (no real charge)
8. You'll be enrolled in the course/plan

---

## Going Live (Real Payments)

### Step 1: Activate Live Mode in Razorpay

1. **In Razorpay Dashboard** → **Settings → Account Settings**
2. **Account Status**: Should show "Demo Account"
3. Click **"Activate Live Mode"**
   - Provide business documents (PAN, GST, Bank Account)
   - Razorpay will verify (usually 24-48 hours)
4. Once approved, you'll get **Live Mode** API keys

### Step 2: Switch to Live Keys

1. Copy your **Live Mode** API keys from Razorpay
   - Key ID: `rzp_live_XXXXXXXXXXXX...`
   - Key Secret: `xxxxxxxxxxxxxxx...`

2. **Update Vercel Environment Variables**:
   ```
   NEXT_PUBLIC_RAZORPAY_KEY_ID = rzp_live_XXXXXXXXXXXX
   RAZORPAY_KEY_SECRET = xxxxxxxxxxxxxxx
   ```

3. **Redeploy** to production

4. **Test with real cards**:
   - Students can now use their own credit/debit cards
   - Real payments will be charged
   - Amount goes to your Razorpay account

---

## Payment Flow: What Happens After Payment

### When a Student Pays:

1. **Razorpay checkout** appears (card, netbanking, UPI, wallet options)
2. Student enters payment details
3. **Payment verified** with Razorpay servers
4. **HMAC signature** validated by your backend (security check)
5. **Automatic enrollment**:
   - Course: Student enrolled immediately
   - Plan: Subscription activated for selected class
6. **Notification**: "Payment successful — you're enrolled!"
7. **Dashboard**: Courses appear in their dashboard
8. **Email receipt**: Razorpay sends payment receipt

---

## Revenue Flow: How You Get Paid

### Settlement to Bank Account

1. **Razorpay Dashboard** → **Payouts**
2. Razorpay deposits payment directly to your bank account (daily/weekly)
3. You can see:
   - Transaction history
   - Payout schedule
   - Fees deducted

### Fees Charged by Razorpay

- **Credit/Debit Card**: 2% + ₹0 (for education/nonprofits: 0%)
- **Netbanking**: 0.8% + flat fee
- **UPI**: 0% (free for many categories)
- **Wallets**: 1-2%

**Special**: Razorpay offers **0% fees for education platforms** if you register as nonprofit — check their documentation.

---

## Troubleshooting

### Payment says "Razorpay keys not configured"

- Verify env vars are set in Vercel
- Check `.env.local` has correct keys (for local dev)
- Make sure `NEXT_PUBLIC_RAZORPAY_KEY_ID` starts with `rzp_test_` or `rzp_live_`
- Redeploy after adding/changing keys

### Payment fails: "Invalid Key"

- Copy key exactly from Razorpay (no extra spaces)
- Verify you're using matching Key ID and Secret (from same mode)
- Test mode and Live mode have different keys — don't mix them

### "Unsupported provider" error

- This is actually a Supabase error (not Razorpay)
- It means Supabase isn't configured yet
- See SETUP_PHONE_LOGIN.md to enable Supabase Auth

### Payment received but student not enrolled

- Check Razorpay webhook configuration
- Verify signature in order record
- Try verifying payment manually from dashboard

---

## Demo Mode Reference

While developing (before Razorpay keys are added):
- **All payments are simulated**
- No real charges
- Checkout shows a demo confirmation dialog
- Enrollment still works (testing the flow)

Once Razorpay keys are added, real Razorpay checkout appears.

---

## Suhana Education Pricing for Reference

| Plan | Base Price | + 18% GST | Annual Cost |
|------|-----------|----------|------------|
| Base | ₹1,999    | ₹359     | ₹2,358 per year |
| Rise | ₹2,899    | ₹521     | ₹3,420 per year |
| Elite | ₹3,999   | ₹720     | ₹4,719 per year |

### Per-Course Pricing (varies)

Students can purchase individual courses or subscribe to plans.

---

## Next Steps

1. **Create Razorpay account** (free, instant)
2. **Get test API keys** from Razorpay Settings
3. **Add to Vercel** environment variables
4. **Test with test cards** (4111 1111 1111 1111)
5. **Verify enrollments work**
6. **Apply for Live Mode** (submit docs to Razorpay)
7. **Switch to Live keys** once approved
8. **Go live!**

---

## Support

- **Razorpay docs**: https://razorpay.com/docs/
- **Suhana dashboard**: `/admin` (admin console)
- **Payment logs**: Razorpay Dashboard → Transactions

Your app is ready—just activate Razorpay and start accepting payments!
