import type { ReactNode } from "react";

// Small icon set as inline SVG (no external icon dependency).
const I = (children: ReactNode, opts?: { fill?: boolean }) => (p: { size?: number }) =>
  (
    <svg
      viewBox="0 0 24 24"
      width={p.size ?? 20}
      height={p.size ?? 20}
      fill={opts?.fill ? "currentColor" : "none"}
      stroke={opts?.fill ? "none" : "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );

export const PlayIcon = I(<path d="M8 5v14l11-7z" />, { fill: true });
export const LiveIcon = I(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M5 12a7 7 0 0 1 14 0" />
  </>
);
export const ClockIcon = I(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>
);
export const BookIcon = I(
  <path d="M4 5a2 2 0 0 1 2-2h5v16H6a2 2 0 0 0-2 2V5zM20 5a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 1 2 2V5z" />
);
export const CheckIcon = I(<path d="M20 6 9 17l-5-5" />);
export const InfoIcon = I(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </>
);
export const SunIcon = I(
  <>
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
  </>
);
export const MoonIcon = I(<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.6 6.6 0 0 0 21 12.8Z" />);
export const BellIcon = I(
  <>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </>
);
export const ChartIcon = I(<path d="M3 3v18h18M7 14l4-4 3 3 5-6" />);
export const DownloadIcon = I(<><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>);
export const ReceiptIcon = I(<><path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3Z" /><path d="M8 8h8M8 12h8M8 16h5" /></>);
export const CheckCircleIcon = I(<><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>);
export const SearchIcon = I(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></>);

// Subjects for J&K State Board (JKBOSE), Classes 8–10.
export const SUBJECT_META: Record<string, { c: string; c2: string; path: ReactNode }> = {
  Mathematics: {
    c: "#db2777", c2: "#f97316",
    path: <path d="M5 5h14M7 5l5 14M12 12h7M15 12l-3 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
  },
  Science: {
    c: "#0d9488", c2: "#16a34a",
    path: (
      <>
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <ellipse cx="12" cy="12" rx="10" ry="4.3" stroke="currentColor" strokeWidth="1.7" fill="none" />
        <ellipse cx="12" cy="12" rx="10" ry="4.3" stroke="currentColor" strokeWidth="1.7" fill="none" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4.3" stroke="currentColor" strokeWidth="1.7" fill="none" transform="rotate(120 12 12)" />
      </>
    ),
  },
  "Social Science": {
    c: "#4338ca", c2: "#7c3aed",
    path: (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" fill="none" />
        <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </>
    ),
  },
  English: {
    c: "#0e7490", c2: "#2563eb",
    path: (
      <>
        <path d="M4 5a2 2 0 0 1 2-2h5v16H6a2 2 0 0 0-2 2V5zM20 5a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 1 2 2V5z" stroke="currentColor" strokeWidth="1.7" fill="none" />
      </>
    ),
  },
};
