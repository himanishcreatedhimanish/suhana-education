import type { Test, AttemptResult } from "@/lib/types";

// Pure scoring used both on the server (authoritative) and reusable in tests.
// `answers` maps questionId -> selected value (int | int[] | string for numeric).
export function scoreTest(
  test: Test,
  answers: Record<string, number | number[] | string>,
  timeUsedSec = 0
): Omit<AttemptResult, "id" | "submitted_at"> {
  let correct = 0,
    wrong = 0,
    unattempted = 0,
    gained = 0;
  const bySub: Record<string, { c: number; w: number; u: number }> = {};

  for (const q of test.questions) {
    bySub[q.subject] = bySub[q.subject] || { c: 0, w: 0, u: 0 };
    const a = answers[q.id];
    const attempted =
      a != null && (Array.isArray(a) ? a.length > 0 : String(a) !== "");
    if (!attempted) {
      unattempted++;
      bySub[q.subject].u++;
      continue;
    }
    let ok = false;
    if (q.type === "numeric") {
      ok = parseFloat(String(a)) === parseFloat(String(q.answer));
    } else if (q.type === "multi") {
      const exp = (q.answer as number[]).slice().sort().join(",");
      const got = (a as number[]).slice().sort().join(",");
      ok = exp === got;
    } else {
      ok = a === q.answer;
    }
    if (ok) {
      correct++;
      gained += test.marks_correct;
      bySub[q.subject].c++;
    } else {
      wrong++;
      gained += test.marks_wrong;
      bySub[q.subject].w++;
    }
  }
  const max = test.questions.reduce((s) => s + test.marks_correct, 0);
  return {
    test_id: test.id,
    title: test.title,
    score: gained,
    max_score: max,
    correct,
    wrong,
    unattempted,
    by_subject: bySub,
    time_used_sec: timeUsedSec,
  };
}

// Strip answers before sending questions to the browser.
export function sanitizeTest(test: Test): Test {
  return {
    ...test,
    questions: test.questions.map((q) => ({ ...q, answer: -1 as number })),
  };
}
