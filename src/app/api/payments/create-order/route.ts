import { NextResponse, type NextRequest } from "next/server";
import { getRazorpay } from "@/lib/razorpay";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { planById, priceBreakdown } from "@/lib/plans";

// Creates a Razorpay order on the server for either a single course OR a plan.
// Amount is always derived server-side (never trusted from the client).
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { courseId, planId } = body;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Payments require Supabase to be configured." }, { status: 400 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const razorpay = await getRazorpay();
  if (!razorpay) return NextResponse.json({ error: "Razorpay keys are not configured." }, { status: 400 });

  let amount = 0;
  let notes: Record<string, string> = { userId: user.id };
  let receipt = "";

  if (planId) {
    const plan = planById(planId);
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    const selectedClass = Number(body.class) || 9;
    amount = priceBreakdown(plan.price).total * 100; // incl GST, in paise
    notes = { ...notes, planId, class: String(selectedClass) };
    receipt = `p_${planId}_${user.id}`.slice(0, 40);
  } else {
    const { data: course } = await supabase.from("courses").select("id,price").eq("id", courseId).single();
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
    if (course.price <= 0) return NextResponse.json({ error: "This course is free — no payment needed." }, { status: 400 });
    amount = course.price * 100;
    notes = { ...notes, courseId };
    receipt = `c_${courseId}_${user.id}`.slice(0, 40);
  }

  const order = await razorpay.orders.create({ amount, currency: "INR", receipt, notes });

  const admin = createAdminClient();
  if (admin) {
    await admin.from("orders").insert({
      user_id: user.id,
      course_id: planId ? null : courseId,
      plan_id: planId ?? null,
      amount,
      razorpay_order_id: order.id,
      status: "created",
    });
  }

  return NextResponse.json({ id: order.id, amount, currency: "INR" });
}
