import type { Course, Test } from "@/lib/types";

// Demo data used when Supabase is not configured, and mirrored by
// supabase/seed.sql for the real database. J&K State Board (JKBOSE),
// Classes 8–10. Keeps the app fully browsable without a backend.

export const SUBJECTS = ["Mathematics", "Science", "Social Science", "English"] as const;
export const BOARD = "JKBOSE"; // J&K State Board

export const demoCourses: Course[] = [
  {
    id: "c-jk8math", title: "Mathematics — Class 8 (JKBOSE)", class: 8, exam: "JKBOSE", subject: "Mathematics",
    type: "Recorded", teacher_name: "Mr. D. Rao", price: 0, mrp: 0,
    description: "Complete JKBOSE Class 8 Mathematics with recorded lessons and practice worksheets.",
    chapters: [
      { id: "ch1", title: "Rational Numbers", lectures: [
        { id: "l1", title: "Introduction to rational numbers", type: "recorded", duration_min: 42, description: "Properties and representation." },
        { id: "l2", title: "Operations on rational numbers", type: "recorded", duration_min: 46, description: "Addition, multiplication, reciprocals." },
      ]},
      { id: "ch2", title: "Linear Equations in One Variable", lectures: [
        { id: "l3", title: "Solving linear equations", type: "recorded", duration_min: 48, description: "Transposition and word problems." },
      ]},
    ],
  },
  {
    id: "c-jk8sci", title: "Science — Class 8 (JKBOSE)", class: 8, exam: "JKBOSE", subject: "Science",
    type: "Live", teacher_name: "Ms. P. Verma", price: 1999, mrp: 3000,
    description: "JKBOSE Class 8 Science with live classes, diagrams and chapter tests.",
    chapters: [
      { id: "ch1", title: "Crop Production & Management", lectures: [
        { id: "l1", title: "Agricultural practices", type: "recorded", duration_min: 40, description: "Crops, tools and irrigation." },
        { id: "l2", title: "Live doubt session", type: "live", duration_min: 60, description: "Weekly live doubt-solving.", scheduled_at: "2026-10-30T17:30:00" },
      ]},
      { id: "ch2", title: "Microorganisms", lectures: [
        { id: "l3", title: "Friend and foe", type: "recorded", duration_min: 44, description: "Bacteria, fungi, viruses and uses." },
      ]},
    ],
  },
  {
    id: "c-jk9math", title: "Mathematics — Class 9 (JKBOSE)", class: 9, exam: "JKBOSE", subject: "Mathematics",
    type: "Live", teacher_name: "Prof. K. Iyer", price: 2499, mrp: 4000,
    description: "JKBOSE Class 9 Mathematics — live classes, DPPs and fortnightly exams.",
    chapters: [
      { id: "ch1", title: "Number Systems", lectures: [
        { id: "l1", title: "Rational & irrational numbers", type: "recorded", duration_min: 45, description: "Real numbers on the number line." },
        { id: "l2", title: "Laws of exponents for real numbers", type: "recorded", duration_min: 41, description: "Rules and problems." },
      ]},
      { id: "ch2", title: "Polynomials", lectures: [
        { id: "l3", title: "Polynomials in one variable", type: "recorded", duration_min: 50, description: "Degrees, zeros, remainder theorem." },
        { id: "l4", title: "Live: factorisation practice", type: "live", duration_min: 60, description: "Live problem-solving.", scheduled_at: "2026-10-31T18:00:00" },
      ]},
    ],
  },
  {
    id: "c-jk9sci", title: "Science — Class 9 (JKBOSE)", class: 9, exam: "JKBOSE", subject: "Science",
    type: "Recorded", teacher_name: "Dr. R. Sharma", price: 2499, mrp: 4000,
    description: "JKBOSE Class 9 Science — Physics, Chemistry and Biology topics with tests.",
    chapters: [
      { id: "ch1", title: "Matter in Our Surroundings", lectures: [
        { id: "l1", title: "States of matter", type: "recorded", duration_min: 47, description: "Solids, liquids, gases and changes." },
      ]},
      { id: "ch2", title: "The Fundamental Unit of Life", lectures: [
        { id: "l2", title: "Cell: structure & function", type: "recorded", duration_min: 52, description: "Organelles and functions." },
      ]},
    ],
  },
  {
    id: "c-jk9sst", title: "Social Science — Class 9 (JKBOSE)", class: 9, exam: "JKBOSE", subject: "Social Science",
    type: "Recorded", teacher_name: "Ms. A. Bhat", price: 1999, mrp: 3500,
    description: "JKBOSE Class 9 Social Science — History, Geography, Civics and Economics.",
    chapters: [
      { id: "ch1", title: "The French Revolution", lectures: [
        { id: "l1", title: "Causes and events", type: "recorded", duration_min: 49, description: "Timeline and key figures." },
      ]},
    ],
  },
  {
    id: "c-jk10math", title: "Mathematics — Class 10 (JKBOSE)", class: 10, exam: "JKBOSE", subject: "Mathematics",
    type: "Live", teacher_name: "Prof. K. Iyer", price: 2899, mrp: 5000,
    description: "JKBOSE Class 10 Mathematics — complete board preparation with live classes and mock tests.",
    chapters: [
      { id: "ch1", title: "Real Numbers", lectures: [
        { id: "l1", title: "Euclid's division lemma", type: "recorded", duration_min: 44, description: "HCF and the division algorithm." },
        { id: "l2", title: "Fundamental theorem of arithmetic", type: "recorded", duration_min: 46, description: "Prime factorisation, HCF & LCM." },
      ]},
      { id: "ch2", title: "Quadratic Equations", lectures: [
        { id: "l3", title: "Solving quadratic equations", type: "recorded", duration_min: 55, description: "Factorisation and quadratic formula." },
        { id: "l4", title: "Live: board-pattern problems", type: "live", duration_min: 60, description: "Live exam-oriented practice.", scheduled_at: "2026-11-01T17:00:00" },
      ]},
    ],
  },
  {
    id: "c-jk10sci", title: "Science — Class 10 (JKBOSE)", class: 10, exam: "JKBOSE", subject: "Science",
    type: "Live", teacher_name: "Dr. S. Gupta", price: 2899, mrp: 5000,
    description: "JKBOSE Class 10 Science — full board syllabus with live classes, DPPs and tests.",
    chapters: [
      { id: "ch1", title: "Light — Reflection & Refraction", lectures: [
        { id: "l1", title: "Spherical mirrors & ray diagrams", type: "recorded", duration_min: 48, description: "Mirror formula and magnification." },
        { id: "l2", title: "Refraction through lenses", type: "recorded", duration_min: 45, description: "Lens formula and the eye." },
      ]},
      { id: "ch2", title: "Chemical Reactions & Equations", lectures: [
        { id: "l3", title: "Types of chemical reactions", type: "recorded", duration_min: 43, description: "Balancing and reaction types." },
      ]},
    ],
  },
  {
    id: "c-jk10eng", title: "English — Class 10 (JKBOSE)", class: 10, exam: "JKBOSE", subject: "English",
    type: "Recorded", teacher_name: "Ms. S. Qureshi", price: 1499, mrp: 2500,
    description: "JKBOSE Class 10 English — prose, poetry, grammar and writing skills.",
    chapters: [
      { id: "ch1", title: "Grammar & Writing", lectures: [
        { id: "l1", title: "Tenses & sentence structure", type: "recorded", duration_min: 40, description: "Core grammar for the board exam." },
        { id: "l2", title: "Letter & essay writing", type: "recorded", duration_min: 38, description: "Formats and marking scheme." },
      ]},
    ],
  },
];

export const demoTests: Test[] = [
  {
    id: "t-jk10math", title: "Class 10 Mathematics — Practice Test (JKBOSE)", exam: "JKBOSE", class: 10,
    duration_min: 25, marks_correct: 4, marks_wrong: -1,
    questions: [
      { id: "q1", subject: "Mathematics", type: "single", marks: 4, text: "The HCF of 96 and 404 is:", options: ["2", "4", "8", "12"], answer: 1 },
      { id: "q2", subject: "Mathematics", type: "numeric", marks: 4, text: "If the roots of x² − 5x + 6 = 0 are α and β, enter the value of α + β.", answer: 5 },
      { id: "q3", subject: "Mathematics", type: "single", marks: 4, text: "The distance of the point (3, 4) from the origin is:", options: ["5", "7", "1", "25"], answer: 0 },
      { id: "q4", subject: "Mathematics", type: "multi", marks: 4, text: "Which of these are prime numbers? (Select all)", options: ["2", "9", "11", "15"], answer: [0, 2] },
    ],
  },
  {
    id: "t-jk9sci", title: "Class 9 Science — Chapter Test (JKBOSE)", exam: "JKBOSE", class: 9,
    duration_min: 20, marks_correct: 4, marks_wrong: -1,
    questions: [
      { id: "q1", subject: "Science", type: "single", marks: 4, text: "The basic structural and functional unit of life is the:", options: ["Tissue", "Organ", "Cell", "Organism"], answer: 2 },
      { id: "q2", subject: "Science", type: "single", marks: 4, text: "Evaporation causes:", options: ["Heating", "Cooling", "No change", "Freezing"], answer: 1 },
      { id: "q3", subject: "Science", type: "multi", marks: 4, text: "Which are states of matter? (Select all)", options: ["Solid", "Energy", "Liquid", "Gas"], answer: [0, 2, 3] },
    ],
  },
  {
    id: "t-jk8", title: "Class 8 — Maths & Science Practice (JKBOSE)", exam: "JKBOSE", class: 8,
    duration_min: 15, marks_correct: 1, marks_wrong: 0,
    questions: [
      { id: "q1", subject: "Mathematics", type: "numeric", marks: 1, text: "Enter the additive inverse of −7.", answer: 7 },
      { id: "q2", subject: "Science", type: "single", marks: 1, text: "Which microorganism is used to make curd?", options: ["Yeast", "Lactobacillus", "Virus", "Algae"], answer: 1 },
      { id: "q3", subject: "Mathematics", type: "single", marks: 1, text: "Solve: 2x + 3 = 11. x = ?", options: ["2", "3", "4", "5"], answer: 2 },
    ],
  },
];

export function demoCourse(id: string) {
  return demoCourses.find((c) => c.id === id) ?? null;
}
export function demoTest(id: string) {
  return demoTests.find((t) => t.id === id) ?? null;
}
