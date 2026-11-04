import type { ReactNode } from "react";

// Inline SVG icon set (no external icon dependency). 1.75px strokes, round
// joins, drawn on a 24px grid so they sit quietly next to text.
const I = (children: ReactNode, opts?: { fill?: boolean }) => {
  const Icon = (p: { size?: number; className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      width={p.size ?? 20}
      height={p.size ?? 20}
      className={p.className}
      fill={opts?.fill ? "currentColor" : "none"}
      stroke={opts?.fill ? "none" : "currentColor"}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
  return Icon;
};

export const PlayIcon = I(<path d="M8 5.5v13a.8.8 0 0 0 1.2.7l10.4-6.5a.8.8 0 0 0 0-1.4L9.2 4.8A.8.8 0 0 0 8 5.5Z" />, { fill: true });
export const LiveIcon = I(<><circle cx="12" cy="12" r="2.5" /><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" /></>);
export const ClockIcon = I(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>);
export const BookIcon = I(<><path d="M12 6.5c-1.6-1.3-4-2-7-2v13c3 0 5.4.7 7 2 1.6-1.3 4-2 7-2v-13c-3 0-5.4.7-7 2Z" /><path d="M12 6.5v13" /></>);
export const CheckIcon = I(<path d="M20 6.5 9.5 17 4 11.5" />);
export const InfoIcon = I(<><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>);
export const SunIcon = I(<><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" /></>);
export const MoonIcon = I(<path d="M20.5 13.4A8.5 8.5 0 1 1 10.6 3.5a6.6 6.6 0 0 0 9.9 9.9Z" />);
export const BellIcon = I(<><path d="M18 9a6 6 0 1 0-12 0c0 6.5-2.5 8-2.5 8h17S18 15.5 18 9Z" /><path d="M13.7 20.5a2 2 0 0 1-3.4 0" /></>);
export const ChartIcon = I(<path d="M4 4v16h16M8 15l3.5-4 3 2.5L20 7" />);
export const DownloadIcon = I(<><path d="M12 4v11" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M5 20h14" /></>);
export const ReceiptIcon = I(<><path d="M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8Z" /><path d="M9 8.5h6M9 12h6M9 15.5h3" /></>);
export const CheckCircleIcon = I(<><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>);
export const SearchIcon = I(<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>);
export const ChevronIcon = I(<path d="m9 6 6 6-6 6" />);
export const ChevronLeftIcon = I(<path d="m15 6-6 6 6 6" />);
export const XIcon = I(<path d="M6 6l12 12M18 6 6 18" />);
export const MenuIcon = I(<path d="M4 7h16M4 12h16M4 17h16" />);
export const LockIcon = I(<><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>);
export const ShieldIcon = I(<><path d="M12 3.5 5 6v5.5c0 4.4 3 7.8 7 9 4-1.2 7-4.6 7-9V6Z" /><path d="m9 12 2 2 4-4" /></>);
export const CalendarIcon = I(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 9.5h16M8.5 3v4M15.5 3v4" /></>);
export const HomeIcon = I(<><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1Z" /></>);
export const FileIcon = I(<><path d="M7 3.5h7l4.5 4.5v12.5H7Z" /><path d="M14 3.5V8h4.5M9.5 13h6M9.5 16.5h4" /></>);
export const HelpIcon = I(<><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8M12 17h.01" /></>);
export const UserIcon = I(<><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" /></>);
export const TargetIcon = I(<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r=".8" fill="currentColor" /></>);
export const LogoutIcon = I(<><path d="M14 4.5H6.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H14" /><path d="M10.5 12H20M16.5 8.5 20 12l-3.5 3.5" /></>);
export const PanelIcon = I(<><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><path d="M9 4.5v15" /></>);

// Subjects for J&K State Board (JKBOSE), Classes 8–10.
// `key` maps to the CSS ink + notebook-paper classes (.s-maths etc.).
// `c` / `c2` are the solid inks, kept for any inline styling.
const G = (children: ReactNode) => (
  <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{children}</g>
);
export const SUBJECT_META: Record<string, { key: string; short: string; c: string; c2: string; path: ReactNode }> = {
  Mathematics: {
    key: "maths", short: "Ma", c: "#2c3fb3", c2: "#22328f",
    // set-square with angle mark
    path: G(<><path d="M4.5 19.5V4.5l15 15Z" /><path d="M4.5 15.5h4v4" /><path d="M8 11.5v4.5h4.5Z" /></>),
  },
  Science: {
    key: "science", short: "Sc", c: "#0b7a6f", c2: "#085f57",
    // conical flask
    path: G(<><path d="M9.5 3.5h5M10.5 3.5v6L5 18.6A1.3 1.3 0 0 0 6.1 20.5h11.8a1.3 1.3 0 0 0 1.1-1.9L13.5 9.5v-6" /><path d="M7.4 15h9.2" /></>),
  },
  "Social Science": {
    key: "social", short: "SS", c: "#9c3f2a", c2: "#7c3121",
    // globe
    path: G(<><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.2 6.1-3.8 8.5M12 3.5C9.4 5.9 8.2 8.7 8.2 12s1.2 6.1 3.8 8.5" /></>),
  },
  English: {
    key: "english", short: "En", c: "#6a3fa0", c2: "#55327f",
    // open book with text lines
    path: G(<><path d="M12 6.5c-1.6-1.3-4-2-7-2v13c3 0 5.4.7 7 2 1.6-1.3 4-2 7-2v-13c-3 0-5.4.7-7 2Z" /><path d="M12 6.5v13M7.5 9h2M7.5 12h2M14.5 9h2M14.5 12h2" /></>),
  },
};

export function subjectMeta(subject: string) {
  return SUBJECT_META[subject] ?? SUBJECT_META.Mathematics;
}

/** Class name for a subject's ink + paper pattern, e.g. "s-maths". */
export function subjectClass(subject: string) {
  return "s-" + subjectMeta(subject).key;
}

export function SubjectGlyph({ subject, size = 20 }: { subject: string; size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>{subjectMeta(subject).path}</svg>;
}
