import { demoCourses, demoTests } from "@/lib/seed";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  // demoCourses / demoTests are only used when Supabase is not configured.
  return <Dashboard demoCourses={demoCourses} demoTests={demoTests} />;
}
