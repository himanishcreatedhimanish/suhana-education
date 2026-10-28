#!/usr/bin/env bash
# ---------------------------------------------------------------
# Suhana Education — push env vars to Vercel and deploy.
# Run this in your Mac Terminal (it has internet; the assistant's
# bridge does not). It reads keys from .env.local — no secrets are
# typed here.
#
#   cd ~/suhana-education
#   vercel login        # once, opens a browser
#   bash vercel-setup.sh
# ---------------------------------------------------------------
set -e
cd "$(dirname "$0")"

# >>> If your live domain is different, change this line <<<
SITE_URL="https://suhana-education.vercel.app"

if [ ! -f .env.local ]; then
  echo "ERROR: .env.local not found in $(pwd)"; exit 1
fi

read_val () { grep -E "^$1=" .env.local | head -1 | cut -d= -f2-; }

RZ_ID="$(read_val RAZORPAY_KEY_ID)"
RZ_PUB="$(read_val NEXT_PUBLIC_RAZORPAY_KEY_ID)"
RZ_SECRET="$(read_val RAZORPAY_KEY_SECRET)"

echo "Keys found in .env.local:"
echo "  RAZORPAY_KEY_ID             = ${RZ_ID:0:9}... (${#RZ_ID} chars)"
echo "  NEXT_PUBLIC_RAZORPAY_KEY_ID = ${RZ_PUB:0:9}... (${#RZ_PUB} chars)"
echo "  RAZORPAY_KEY_SECRET         = ${RZ_SECRET:0:4}... (${#RZ_SECRET} chars)"
echo "  NEXT_PUBLIC_SITE_URL        = $SITE_URL"
echo

case "$RZ_ID" in
  rzp_live_*) echo "⚠️  These are LIVE keys — the public site will take REAL payments." ;;
  rzp_test_*) echo "✅  These are TEST keys — safe, no real charges." ;;
  *) echo "⚠️  RAZORPAY_KEY_ID doesn't look like a Razorpay key. Check .env.local." ;;
esac
echo
read -r -p "Push these to Vercel (Production) and deploy? (y/N) " ok
[ "$ok" = "y" ] || [ "$ok" = "Y" ] || { echo "Cancelled."; exit 0; }

# Vercel CLI
if ! command -v vercel >/dev/null 2>&1; then
  echo "==> Installing Vercel CLI..."; npm i -g vercel
fi

echo "==> Checking login..."
vercel whoami >/dev/null 2>&1 || { echo "Run 'vercel login' first, then re-run this script."; exit 1; }

echo "==> Linking project (choose your suhana-education project if asked)..."
vercel link

set_env () {
  local name="$1" val="$2"
  if [ -z "$val" ]; then echo "  !! $name empty, skipping"; return; fi
  echo "==> Setting $name (production)"
  vercel env rm "$name" production -y >/dev/null 2>&1 || true
  printf '%s' "$val" | vercel env add "$name" production >/dev/null
}

set_env RAZORPAY_KEY_ID             "$RZ_ID"
set_env NEXT_PUBLIC_RAZORPAY_KEY_ID "$RZ_PUB"
set_env RAZORPAY_KEY_SECRET         "$RZ_SECRET"
set_env NEXT_PUBLIC_SITE_URL        "$SITE_URL"

echo "==> Deploying to production (fresh build)..."
vercel --prod

echo
echo "DONE ✅  Test on $SITE_URL — log in, then Enroll Now should open the real Razorpay popup."
echo "If it still shows the demo box, tell the assistant."
