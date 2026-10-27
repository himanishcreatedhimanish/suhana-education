// Central place to read env + decide whether we run with a real
// backend or in demo mode (local seed data, no auth/payments).

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Supabase is considered configured only when both public vars exist.
export const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON);

// Razorpay is optional; checkout falls back to demo mode when unset.
export const RAZORPAY_CONFIGURED = Boolean(
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
);
export const RAZORPAY_PUBLIC_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
