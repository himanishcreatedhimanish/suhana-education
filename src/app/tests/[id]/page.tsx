import { notFound } from "next/navigation";
import { getTestWithAnswers } from "@/lib/data";
import { sanitizeTest } from "@/lib/scoring";
import ExamRunner from "@/components/ExamRunner";

export const dynamic = "force-dynamic";

export default async function TestPage({ params }: { params: { id: string } }) {
  const full = await getTestWithAnswers(params.id);
  if (!full) notFound();
  // Never send answers to the browser.
  const safe = sanitizeTest(full);
  return <ExamRunner test={safe} />;
}
