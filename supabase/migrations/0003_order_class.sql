-- ============================================================
-- Store the selected class on plan orders so the Razorpay webhook
-- can activate the correct subscription even if the browser never
-- returns to the verify endpoint.
-- Run this in Supabase → SQL Editor.
-- ============================================================
alter table orders add column if not exists class int;
