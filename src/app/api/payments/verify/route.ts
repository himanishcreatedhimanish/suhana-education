import { NextResponse, type NextRequest } from "next/server";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { planById, priceBreakdown } from "@/lib/plans";

// Verifies the Checkout signature, then marks the order paid and grants access
// (enrollment for a course, or an active subscription for a plan).
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, planId } = body;

  const supabase = createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const valid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!valid) return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, error: "Server key missing" }, { status: 500 });

  await admin.from("orders").update({ status: "paid", razorpay_payment_id }).eq("razorpay_order_id", razorpay_order_id);

  if (planId) {
    const plan = planById(planId);
    if (!plan) return NextResponse.json({ ok: false, error: "Plan not found" }, { status: 404 });
    const selectedClass = Number(body.class) || 9;
    await admin.from("subscriptions").insert({
      user_id: user.id,
      plan_id: plan.id,
      plan_name: plan.name,
      class: selectedClass,
      amount: priceBreakdown(plan.price).total * 100,
      status: "active",
    });
    await admin.from("notifications").insert({ user_id: user.id, body: `${plan.name} activated.` });
  } else {
    await admin.from("enrollments").upsert({ user_id: user.id, course_id: courseId }, { onConflict: "user_id,course_id" });
    await admin.from("notifications").insert({ user_id: user.id, body: "Payment successful — course unlocked." });
  }

  return NextResponse.json({ ok: true });
}
