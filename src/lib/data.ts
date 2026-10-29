import { createClient } from "@/lib/supabase/server";
import { demoCourses, demoCourse, demoTests, demoTest } from "@/lib/seed";
import type { Course, Test, Profile } from "@/lib/types";

// Server-side data access. Uses Supabase when configured, otherwise returns
// demo seed data so the whole site is browsable without a backend.

export async function getCourses(): Promise<Course[]> {
  const supabase = await createClient();
  if (!supabase) return demoCourses;
  const { data: courses } = await supabase
    .from("courses")
    .select("id,title,class,exam,subject,type,teacher_name,price,mrp,description")
    .eq("published", true)
    .order("created_at", { ascending: true });
  if (!courses) return [];
  // attach lecture counts lazily via a second query per list is wasteful;
  // for the catalog we don't need chapters, so return empty arrays.
  return courses.map((c) => ({ ...c, chapters: [] })) as Course[];
}

// Courses WITH chapters & lectures, for the discovery/explorer page.
// Demo mode returns the full seed; Supabase mode assembles outlines so
// subject cards show accurate chapter/lecture counts and live schedules.
export async function getCoursesDetailed(): Promise<Course[]> {
  const supabase = await createClient();
  if (!supabase) return demoCourses;
  const { data: courses } = await supabase
    .from("courses")
    .select("id,title,class,exam,subject,type,teacher_name,price,mrp,description")
    .eq("published", true)
    .order("created_at", { ascending: true });
  if (!courses || !courses.length) return [];
  const courseIds = courses.map((c: any) => c.id);
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id,title,position,course_id")
    .in("course_id", courseIds)
    .order("position", { ascending: true });
  const chIds = (chapters ?? []).map((c: any) => c.id);
  const { data: lectures } = chIds.length
    ? await supabase
        .from("lectures")
        .select("id,title,type,duration_min,description,scheduled_at,position,chapter_id")
        .in("chapter_id", chIds)
        .order("position", { ascending: true })
    : { data: [] as any[] };
  return courses.map((c: any) => ({
    ...c,
    chapters: (chapters ?? [])
      .filter((ch: any) => ch.course_id === c.id)
      .map((ch: any) => ({ ...ch, lectures: (lectures ?? []).filter((l: any) => l.chapter_id === ch.id) })),
  })) as Course[];
}

export async function getCourse(id: string): Promise<Course | null> {
  const supabase = await createClient();
  if (!supabase) return demoCourse(id);
  const { data: course } = await supabase
    .from("courses")
    .select("id,title,class,exam,subject,type,teacher_name,price,mrp,description")
    .eq("id", id)
    .single();
  if (!course) return null;
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id,title,position,lectures(id,title,type,duration_min,description,scheduled_at,position)")
    .eq("course_id", id)
    .order("position", { ascending: true });
  return {
    ...course,
    chapters: (chapters ?? []).map((ch: any) => ({
      ...ch,
      lectures: (ch.lectures ?? []).sort((a: any, b: any) => a.position - b.position),
    })),
  } as Course;
}

export async function getTests(): Promise<Test[]> {
  const supabase = await createClient();
  if (!supabase) return demoTests.map((t) => ({ ...t, questions: [] }));
  const { data } = await supabase
    .from("tests")
    .select("id,title,exam,class,duration_min,marks_correct,marks_wrong")
    .eq("published", true);
  return (data ?? []).map((t) => ({ ...t, questions: [] })) as Test[];
}

// Full test WITH answers — server only, never send directly to the client.
export async function getTestWithAnswers(id: string): Promise<Test | null> {
  const supabase = await createClient();
  if (!supabase) return demoTest(id);
  const { data: test } = await supabase
    .from("tests")
    .select("id,title,exam,class,duration_min,marks_correct,marks_wrong")
    .eq("id", id)
    .single();
  if (!test) return null;
  const { data: questions } = await supabase
    .from("questions")
    .select("id,subject,type,text,options,answer,marks,position")
    .eq("test_id", id)
    .order("position", { ascending: true });
  return { ...test, questions: (questions ?? []) as any } as Test;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  if (!supabase) return null; // demo mode handled client-side
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id,full_name,role,class,target_exam,onboarded")
    .eq("id", user.id)
    .single();
  return (data as Profile) ?? null;
}
