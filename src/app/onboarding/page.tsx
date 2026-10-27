import { getCourses } from "@/lib/data";
import Onboarding from "@/components/Onboarding";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const courses = await getCourses();
  return (
    <div className="wrap page" style={{ maxWidth: 560 }}>
      <Onboarding courses={courses.map((c) => ({ id: c.id, title: c.title }))} />
    </div>
  );
}
