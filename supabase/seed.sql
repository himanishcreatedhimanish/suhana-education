-- ============================================================
-- Seed data for Suhana Education (run after 0001_init.sql & 0002_plans.sql).
-- J&K State Board (JKBOSE), Classes 8–10. Safe to re-run (ON CONFLICT).
-- ============================================================

insert into courses (id, title, class, exam, subject, type, teacher_name, price, mrp, description) values
 ('11111111-0000-0000-0000-000000000001','Mathematics — Class 8 (JKBOSE)',8,'JKBOSE','Mathematics','Recorded','Mr. D. Rao',0,0,'Complete JKBOSE Class 8 Mathematics with recorded lessons and practice worksheets.'),
 ('11111111-0000-0000-0000-000000000002','Science — Class 8 (JKBOSE)',8,'JKBOSE','Science','Live','Ms. P. Verma',1999,3000,'JKBOSE Class 8 Science with live classes, diagrams and chapter tests.'),
 ('11111111-0000-0000-0000-000000000003','Mathematics — Class 9 (JKBOSE)',9,'JKBOSE','Mathematics','Live','Prof. K. Iyer',2499,4000,'JKBOSE Class 9 Mathematics — live classes, DPPs and fortnightly exams.'),
 ('11111111-0000-0000-0000-000000000004','Science — Class 9 (JKBOSE)',9,'JKBOSE','Science','Recorded','Dr. R. Sharma',2499,4000,'JKBOSE Class 9 Science — Physics, Chemistry and Biology topics with tests.'),
 ('11111111-0000-0000-0000-000000000005','Mathematics — Class 10 (JKBOSE)',10,'JKBOSE','Mathematics','Live','Prof. K. Iyer',2899,5000,'JKBOSE Class 10 Mathematics — complete board preparation with live classes and mock tests.'),
 ('11111111-0000-0000-0000-000000000006','Science — Class 10 (JKBOSE)',10,'JKBOSE','Science','Live','Dr. S. Gupta',2899,5000,'JKBOSE Class 10 Science — full board syllabus with live classes, DPPs and tests.'),
 ('11111111-0000-0000-0000-000000000007','English — Class 10 (JKBOSE)',10,'JKBOSE','English','Recorded','Ms. S. Qureshi',1499,2500,'JKBOSE Class 10 English — prose, poetry, grammar and writing skills.')
on conflict (id) do nothing;

insert into chapters (id, course_id, title, position) values
 ('22222222-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000005','Real Numbers',0),
 ('22222222-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000005','Quadratic Equations',1),
 ('22222222-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000006','Light — Reflection & Refraction',0),
 ('22222222-0000-0000-0000-000000000004','11111111-0000-0000-0000-000000000004','Matter in Our Surroundings',0)
on conflict (id) do nothing;

insert into lectures (chapter_id, title, type, duration_min, description, position) values
 ('22222222-0000-0000-0000-000000000001','Euclid''s division lemma','recorded',44,'HCF and the division algorithm.',0),
 ('22222222-0000-0000-0000-000000000001','Fundamental theorem of arithmetic','recorded',46,'Prime factorisation, HCF & LCM.',1),
 ('22222222-0000-0000-0000-000000000002','Solving quadratic equations','recorded',55,'Factorisation and quadratic formula.',0),
 ('22222222-0000-0000-0000-000000000003','Spherical mirrors & ray diagrams','recorded',48,'Mirror formula and magnification.',0),
 ('22222222-0000-0000-0000-000000000004','States of matter','recorded',47,'Solids, liquids, gases and changes.',0)
on conflict do nothing;

insert into lectures (chapter_id, title, type, duration_min, description, scheduled_at, position) values
 ('22222222-0000-0000-0000-000000000002','Live: board-pattern problems','live',60,'Live exam-oriented practice.', now() + interval '4 days', 1)
on conflict do nothing;

insert into tests (id, title, exam, class, duration_min, marks_correct, marks_wrong) values
 ('33333333-0000-0000-0000-000000000001','Class 10 Mathematics — Practice Test (JKBOSE)','JKBOSE',10,25,4,-1),
 ('33333333-0000-0000-0000-000000000002','Class 9 Science — Chapter Test (JKBOSE)','JKBOSE',9,20,4,-1)
on conflict (id) do nothing;

insert into questions (test_id, subject, type, text, options, answer, marks, position) values
 ('33333333-0000-0000-0000-000000000001','Mathematics','single','The HCF of 96 and 404 is:','["2","4","8","12"]','1',4,0),
 ('33333333-0000-0000-0000-000000000001','Mathematics','numeric','If the roots of x^2 - 5x + 6 = 0 are a and b, enter a + b.',null,'5',4,1),
 ('33333333-0000-0000-0000-000000000001','Mathematics','single','The distance of the point (3, 4) from the origin is:','["5","7","1","25"]','0',4,2),
 ('33333333-0000-0000-0000-000000000002','Science','single','The basic structural and functional unit of life is the:','["Tissue","Organ","Cell","Organism"]','2',4,0),
 ('33333333-0000-0000-0000-000000000002','Science','multi','Which are states of matter? (Select all)','["Solid","Energy","Liquid","Gas"]','[0,2,3]',4,1)
on conflict do nothing;
