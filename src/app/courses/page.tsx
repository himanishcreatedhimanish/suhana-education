import { getCoursesDetailed } from "@/lib/data";
import CoursesExplorer from "@/components/CoursesExplorer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Courses — Suhana Education",
  description: "Explore JKBOSE Class 8, 9 & 10 subjects — live classes, recorded lectures and chapter-wise practice.",
};

export default async function CoursesPage({ searchParams }: { searchParams: { class?: string } }) {
  const c = Number(searchParams.class);
  const initialClass = [8, 9, 10].includes(c) ? c : 9;
  const courses = await getCoursesDetailed();
  return <CoursesExplorer courses={courses} initialClass={initialClass} />;
}
