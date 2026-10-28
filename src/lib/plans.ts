// Subscription plans for Suhana Education (Classes 8, 9 & 10).
// Prices are the base amount in INR; GST is added at checkout.

export const GST_RATE = 0.18;
export const PLAN_CLASSES = [8, 9, 10] as const;

export interface Plan {
  id: "base" | "rise" | "elite";
  name: string;
  tagline: string;
  price: number; // base price in INR (before GST)
  popular?: boolean;
  accent: string; // brand accent for the plan
  features: string[];
  note?: string;
}

// Feature set shown on every plan card, with a tick/cross per plan.
export const ALL_FEATURES = [
  "Live Lectures",
  "Recorded Lectures",
  "Soft Copy of Study Material",
  "Hard Copy of Study Material",
  "DPPs (Daily Practice Problems)",
  "Assignments",
  "Online Doubt Solving",
  "Fortnightly Online Exams",
  "Health Gennie (health consultations)",
  "Psychoanalysis (DPIT)",
] as const;

export const PLANS: Plan[] = [
  {
    id: "base",
    name: "Base Plan",
    tagline: "Complete learning essentials for Class 8, 9 & 10",
    price: 1999,
    accent: "#2563eb",
    features: [
      "Live Lectures",
      "Soft Copy of Study Material",
      "Assignments",
      "Online Doubt Solving",
      "Fortnightly Online Exams",
    ],
  },
  {
    id: "rise",
    name: "Rise Plan",
    tagline: "Adds recorded lectures, DPPs, health & career support",
    price: 2899,
    accent: "#ef8a1f",
    features: [
      "Live Lectures",
      "Recorded Lectures",
      "Soft Copy of Study Material",
      "DPPs (Daily Practice Problems)",
      "Online Doubt Solving",
      "Fortnightly Online Exams",
      "Health Gennie (health consultations)",
      "Psychoanalysis (DPIT)",
    ],
  },
  {
    id: "elite",
    name: "Elite Plan",
    tagline: "Everything in Rise, with printed study material delivered",
    price: 3999,
    popular: true,
    accent: "#6d28d9",
    features: [
      "Live Lectures",
      "Recorded Lectures",
      "Soft Copy of Study Material",
      "Hard Copy of Study Material",
      "DPPs (Daily Practice Problems)",
      "Assignments",
      "Online Doubt Solving",
      "Fortnightly Online Exams",
      "Health Gennie (health consultations)",
      "Psychoanalysis (DPIT)",
    ],
  },
];

export function planById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function priceBreakdown(price: number) {
  const gst = Math.round(price * GST_RATE);
  return { price, gst, total: price + gst };
}
