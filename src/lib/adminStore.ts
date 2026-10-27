"use client";
// DEMO-ONLY mutable store (localStorage) for the admin/teacher console when
// Supabase is not configured. Note: edits here are local to this browser and
// do not change the server-rendered public pages (those read the static seed).
// With Supabase configured, the console writes to the real database instead.
import { demoCourses, demoTests } from "@/lib/seed";
import type { Course, Test } from "@/lib/types";

const CK = "suhana.admin.courses.v1";
const TK = "suhana.admin.tests.v1";
const SK = "suhana.admin.students.v1";

export interface DemoStudent { id: string; name: string; cls: number; exam: string; enrolled: string[]; }

function read<T>(k: string, fallback: T): T {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function write(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

export function getCourses(): Course[] { return read(CK, demoCourses); }
export function saveCourses(c: Course[]) { write(CK, c); }
export function getTests(): Test[] { return read(TK, demoTests); }
export function saveTests(t: Test[]) { write(TK, t); }
export function getStudents(): DemoStudent[] {
  return read(SK, [
    { id: "s1", name: "Rhea Kapoor", cls: 10, exam: "JKBOSE", enrolled: ["c-jk10math"] },
    { id: "s2", name: "Arjun Menon", cls: 9, exam: "JKBOSE", enrolled: ["c-jk9sci"] },
  ]);
}
export function saveStudents(s: DemoStudent[]) { write(SK, s); }
