import Onboarding from "@/components/Onboarding";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Set up your profile — Suhana Education",
};

export default function OnboardingPage() {
  return (
    <div className="wrap page" style={{ paddingTop: "clamp(40px, 6vw, 80px)" }}>
      <Onboarding />
    </div>
  );
}
