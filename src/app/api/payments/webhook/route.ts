import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/server";
import { planById } from "@/lib/plans";

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
      // Mark order paid (idempotent) and grant access: a plan order activates a
      // subscription; a course order creates an enrollment. The status guard
      // makes re-delivered webhooks a no-op.
      const { data: order } = await admin.from("orders").select("user_id,course_id,plan_id,class,amount,status").eq("razorpay_order_id", orderId).maybeSingle();
      if (order && order.status !== "paid") {
        await admin.from("orders").update({ status: "paid", razorpay_payment_id: payment.id }).eq("razorpay_order_id", orderId);
        if (order.plan_id) {
          const plan = planById(order.plan_id);
          await admin.from("subscriptions").insert({
            user_id: order.user_id,
            plan_id: order.plan_id,
            plan_name: plan?.name ?? order.plan_id,
            class: order.class ?? 9,
            amount: order.amount,
            status: "active",
          });
          await admin.from("notifications").insert({ user_id: order.user_id, body: `${plan?.name ?? "Plan"} activated.` });
        } else if (order.course_id) {
          await admin.from("enrollments").upsert({ user_id: order.user_id, course_id: order.course_id }, { onConflict: "user_id,course_id" });
          await admin.from("notifications").insert({ user_id: order.user_id, body: "Payment successful — course unlocked." });
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
