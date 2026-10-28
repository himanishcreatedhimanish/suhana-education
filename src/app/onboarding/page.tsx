import Onboarding from "@/components/Onboarding";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <div className="wrap page" style={{ maxWidth: 560 }}>
      <Onboarding />
    </div>
  );
}
