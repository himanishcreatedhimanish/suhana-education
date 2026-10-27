export type Role = "student" | "teacher" | "admin";
export type CourseType = "Live" | "Recorded" | "Test Series";
export type LectureType = "recorded" | "live";
export type QuestionType = "single" | "multi" | "numeric";

export interface Lecture {
  id: string;
  title: string;
  type: LectureType;
  duration_min: number;
  description: string | null;
  scheduled_at?: string | null;
  position?: number;
}

export interface Chapter {
  id: string;
  title: string;
  position?: number;
  lectures: Lecture[];
}

export interface Course {
  id: string;
  title: string;
  class: number;
  exam: string;
  subject: string;
  type: CourseType;
  teacher_name: string;
  price: number;
  mrp: number;
  description: string | null;
  chapters: Chapter[];
}

export interface Question {
  id: string;
  subject: string;
  type: QuestionType;
  text: string;
  options?: string[] | null;
  answer: number | number[] | number; // hidden from client in real mode
  marks: number;
}

export interface Test {
  id: string;
  title: string;
  exam: string;
  class: number;
  duration_min: number;
  marks_correct: number;
  marks_wrong: number;
  questions: Question[];
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: Role;
  class: number | null;
  target_exam: string | null;
  onboarded: boolean;
}

export interface AttemptResult {
  id: string;
  test_id: string;
  title: string;
  score: number;
  max_score: number;
  correct: number;
  wrong: number;
  unattempted: number;
  by_subject: Record<string, { c: number; w: number; u: number }>;
  time_used_sec: number;
  submitted_at: string;
}
