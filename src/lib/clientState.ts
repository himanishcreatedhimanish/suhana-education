"use client";
// Per-browser state used in DEMO MODE (no Supabase). Mirrors the server
// tables: enrollments, lecture progress, attempts, notifications, and a demo
// profile. When Supabase is configured, components use the DB instead.
import type { AttemptResult, Profile } from "@/lib/types";

const KEY = "suhana.state.v1";
const UKEY = "suhana.user.v1";

export interface LocalState {
  enrolled: string[];
  progress: Record<string, boolean>; // `${courseId}/${lectureId}` -> true
  attempts: AttemptResult[];
  notifications: { body: string; at: number }[];
  subscription?: { planId: string; planName: string; class: number; at: number } | null;
}

const empty: LocalState = { enrolled: [], progress: {}, attempts: [], notifications: [], subscription: null };

export function getState(): LocalState {
  if (typeof window === "undefined") return empty;
  try {
    return { ...empty, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return empty;
  }
}
export function setState(s: LocalState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}
export function getDemoUser(): Partial<Profile> | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(UKEY);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}
export function setDemoUser(u: Partial<Profile> | null) {
  try {
    if (u) localStorage.setItem(UKEY, JSON.stringify(u));
    else localStorage.removeItem(UKEY);
  } catch {}
}
