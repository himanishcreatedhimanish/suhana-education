# Enabling Phone OTP Login for Suhana Education

Your Suhana Education platform already has **phone number OTP authentication fully coded**. To enable it in production, you need to configure Supabase Auth with an SMS provider.

## Current Status

✅ **Already implemented:**
- Phone input validation (10-digit Indian numbers)
- OTP send/verify flows
- Demo mode fallback (OTP: 123456)
- Automatic onboarding after phone login
- Integration with student profiles & dashboard

❌ **To enable in production:**
- Connect an SMS provider to Supabase

---

## How to Enable Phone OTP

### Step 1: Choose an SMS Provider

Supabase supports:
1. **Twilio** (recommended, most reliable)
2. **AWS SNS**
3. **Vonage (Nexmo)**

For India, Twilio is the easiest and most reliable.

### Step 2: Set Up Twilio (Recommended)

1. **Create a Twilio account**: https://www.twilio.com/try-twilio
   - Sign up with your email and phone
   - Verify your phone number
   - Get your free Twilio trial credits

2. **Get Twilio credentials**:
   - Account SID: visible on Twilio dashboard
   - Auth Token: visible on Twilio dashboard
   - Phone number: Twilio will assign you a number (e.g., +1234567890)

3. **Configure Twilio for India**:
   - In Twilio Console, go to **Messaging → Sending Domains**
   - Add a domain or use the default
   - Twilio trial accounts work for Indian numbers but may have limits
   - For production: upgrade to paid account (₹500-1000/month)

### Step 3: Connect Twilio to Supabase

1. **Go to Supabase Dashboard** → Your Project → **Auth → Providers**
2. Click **Phone** (or **SMS**)
3. Select **Twilio** from dropdown
4. Fill in:
   - **Twilio Account SID**: `ACxxxxxxxxxxxxxxxxx...`
   - **Twilio Auth Token**: `abcdef123456...`
   - **Twilio Message Service SID** (optional): Leave blank for default
5. **Save**

Your Supabase project will now send real SMS for phone OTP.

---

## Testing Phone OTP

After configuring Supabase:

1. **Visit your app's login page** → Select **Phone OTP** tab
2. Enter a valid 10-digit Indian phone number
3. **Send OTP** → Twilio will send an SMS
4. Enter the 6-digit code from your SMS
5. **Verify** → Auto-redirect to onboarding

---

## Alternative SMS Providers

### AWS SNS
1. Create AWS account at https://aws.amazon.com
2. Enable SNS service
3. Get Access Key ID & Secret
4. In Supabase: select **AWS SNS**, enter credentials
5. Cost: ~₹0.50 per SMS in India

### Vonage (Nexmo)
1. Sign up at https://www.vonage.com/communications-apis/
2. Get API key & secret
3. In Supabase: select **Vonage**, enter credentials
4. Cost: ₹2-5 per SMS

---

## Troubleshooting

### "OTP sending failed"
- Verify Twilio credentials are correct
- Check Twilio balance (trial accounts have limits)
- Ensure phone number format is correct (+91XXXXXXXXXX)

### "Unsupported provider"
- Go to Supabase Auth → Providers → Phone
- Make sure Phone provider is **Enabled** (toggle ON)
- Verify SMS service is selected

### Students not receiving SMS
- Check Twilio logs in Twilio Console
- Verify phone number with country code (+91 for India)
- Try a different phone or Twilio's test mode

---

## Demo Mode Reference

During development (before Supabase is configured), phone OTP is simulated:
- **Demo OTP code**: `123456`
- No real SMS is sent
- Perfect for testing locally

Once Supabase Auth is configured with Twilio, real SMS will be sent automatically.

---

## Cost Estimate (Monthly)

| Provider    | Cost/SMS | Estimated/Month | Annual |
|------------|----------|-----------------|---------|
| Twilio     | $0.0075  | $7-15 (if 1000-2000 signups) | $100-150 |
| AWS SNS    | $0.50    | $5-10           | $75-150 |
| Vonage     | $2-5     | $20-50          | $250-600 |

**Recommendation**: Start with **Twilio** (trial is free, lowest production cost).

---

## Next Steps

1. Create a Twilio account (free trial)
2. Get your Twilio credentials
3. Go to your Supabase Project → Auth → Providers
4. Enable Phone with Twilio details
5. Test by sending an OTP to your own phone
6. Deploy to Vercel (no code changes needed)

Your app is already 100% ready—just plug in the SMS service!
