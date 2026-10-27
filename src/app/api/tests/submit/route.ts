import { NextResponse, type NextRequest } from "next/server";
import { getTestWithAnswers } from "@/lib/data";
import { scoreTest } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";

// Authoritative, server-side scoring. Answers never leave the server, so the
// client cannot see the key or compute its own score.
export async function POST(req: NextRequest) {
  const { testId, answers, timeUsedSec } = await req.json();
  const test = await getTestWithAnswers(testId);
  if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

  const result = scoreTest(test, answers ?? {}, timeUsedSec ?? 0);

  const supabase = createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const { data, error } = await supabase
      .from("attempts")
      .insert({
        user_id: user.id,
        test_id: test.id,
        answers,
        score: result.score,
        max_score: result.max_score,
        correct: result.correct,
        wrong: result.wrong,
        unattempted: result.unattempted,
        by_subject: result.by_subject,
        time_used_sec: result.time_used_sec,
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabase.from("notifications").insert({
      user_id: user.id,
      body: `Test submitted: ${test.title} — scored ${result.score}/${result.max_score}`,
    });
    return NextResponse.json({ id: data.id });
  }

  // Demo mode: return the full result for the client to store locally.
  const id = "demo-" + Date.now();
  return NextResponse.json({ id, result: { id, submitted_at: new Date().toISOString(), ...result } });
}
