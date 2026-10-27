import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/server";

// Razorpay webhook — the authoritative source of truth for payment state.
// Configure in Dashboard → Webhooks with event `payment.captured` and the
// secret set in RAZORPAY_WEBHOOK_SECRET.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let event: any;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: true }); // acknowledge; nothing to persist

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload?.payment?.entity;
    const orderId = payment?.order_id;
    if (orderId) {
      // Mark order paid (idempotent) and enroll based on the order's notes.
      const { data: order } = await admin.from("orders").select("user_id,course_id,status").eq("razorpay_order_id", orderId).maybeSingle();
      if (order && order.status !== "paid") {
        await admin.from("orders").update({ status: "paid", razorpay_payment_id: payment.id }).eq("razorpay_order_id", orderId);
        await admin.from("enrollments").upsert({ user_id: order.user_id, course_id: order.course_id }, { onConflict: "user_id,course_id" });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
