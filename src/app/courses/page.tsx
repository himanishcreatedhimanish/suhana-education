import Link from "next/link";
import { getCourses } from "@/lib/data";
import CoursesBrowser from "@/components/CoursesBrowser";

export const dynamic = "force-dynamic";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { subject?: string };
}) {
  const courses = await getCourses();
  return (
    <div className="wrap page">
      <div className="crumbs"><Link href="/">Home</Link> › Courses</div>
      <div className="page-head">
        <div><h1>Courses</h1><p>J&amp;K State Board (JKBOSE), Classes 8–10. Filter by class, subject and course type.</p></div>
      </div>
      <CoursesBrowser courses={courses} initialSubject={searchParams.subject ?? ""} />
    </div>
  );
}
