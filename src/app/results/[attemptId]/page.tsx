import { createClient } from "@/lib/supabase/server";
import ResultView from "@/components/ResultView";
import type { AttemptResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ResultPage({ params }: { params: { attemptId: string } }) {
  let attempt: AttemptResult | null = null;
  const supabase = await createClient();
  if (supabase && !params.attemptId.startsWith("demo-")) {
    const { data } = await supabase
      .from("attempts")
      .select("id,test_id,score,max_score,correct,wrong,unattempted,by_subject,time_used_sec,submitted_at,tests(title)")
      .eq("id", params.attemptId)
      .maybeSingle();
    if (data) {
      attempt = {
        id: data.id,
        test_id: data.test_id,
        title: (data as any).tests?.title ?? "Test",
        score: data.score,
        max_score: data.max_score,
        correct: data.correct,
        wrong: data.wrong,
        unattempted: data.unattempted,
        by_subject: data.by_subject,
        time_used_sec: data.time_used_sec,
        submitted_at: data.submitted_at,
      };
    }
  }
  // Demo attempts (and any not in DB) are read from localStorage client-side.
  return <ResultView attempt={attempt} id={params.attemptId} />;
}
