import { notFound } from "next/navigation";
import { getCourse } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import CourseDetail from "@/components/CourseDetail";

export const dynamic = "force-dynamic";

export default async function CoursePage({ params }: { params: { id: string } }) {
  const course = await getCourse(params.id);
  if (!course) notFound();

  let userId: string | null = null;
  let enrolled = false;
  let progress: string[] = [];

  const supabase = createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: e } = await supabase.from("enrollments").select("id").match({ user_id: user.id, course_id: course.id }).maybeSingle();
      enrolled = !!e;
      const lectureIds = course.chapters.flatMap((c) => c.lectures.map((l) => l.id));
      if (lectureIds.length) {
        const { data: p } = await supabase.from("lecture_progress").select("lecture_id").eq("user_id", user.id).in("lecture_id", lectureIds);
        progress = (p ?? []).map((r) => r.lecture_id);
      }
    }
  }

  return <CourseDetail course={course} userId={userId} initialEnrolled={enrolled} initialProgress={progress} />;
}
