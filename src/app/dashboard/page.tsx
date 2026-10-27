import { demoCourses } from "@/lib/seed";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  // demoCourses is only used when Supabase is not configured.
  return <Dashboard demoCourses={demoCourses} />;
}
