"use client";
import { useState } from "react";
import Link from "next/link";
import { PLANS, PLAN_CLASSES } from "@/lib/plans";
import { subjectClass } from "@/components/icons";

// Homepage hero. The first decision a family makes is the class, so the
// class switch drives both the calls to action and the sample timetable.

type Kind = "live" | "recorded" | "dpp";
interface Slot { subject: string; kind: Kind; topic: string; when: string }
interface Week { rows: { day: string; slots: [Slot, Slot] }[]; exam: string }

const WEEKS: Record<number, Week> = {
  8: {
    rows: [
      { day: "Mon", slots: [{ subject: "Mathematics", kind: "live", when: "5:00 pm", topic: "Rational numbers" }, { subject: "Science", kind: "recorded", when: "40 min", topic: "Crop production and management" }] },
      { day: "Tue", slots: [{ subject: "Science", kind: "live", when: "5:00 pm", topic: "Microorganisms: friend and foe" }, { subject: "Mathematics", kind: "dpp", when: "Practice set", topic: "Operations on rational numbers" }] },
      { day: "Wed", slots: [{ subject: "Social Science", kind: "live", when: "5:00 pm", topic: "Resources" }, { subject: "English", kind: "recorded", when: "35 min", topic: "Tenses in everyday writing" }] },
      { day: "Thu", slots: [{ subject: "English", kind: "live", when: "5:00 pm", topic: "Paragraph writing" }, { subject: "Science", kind: "dpp", when: "Practice set", topic: "Microorganisms" }] },
      { day: "Fri", slots: [{ subject: "Mathematics", kind: "live", when: "5:00 pm", topic: "Linear equations in one variable" }, { subject: "Social Science", kind: "recorded", when: "45 min", topic: "The Indian Constitution" }] },
    ],
    exam: "Mathematics and Science",
  },
  9: {
    rows: [
      { day: "Mon", slots: [{ subject: "Mathematics", kind: "live", when: "5:00 pm", topic: "Number systems" }, { subject: "Science", kind: "recorded", when: "47 min", topic: "Matter in our surroundings" }] },
      { day: "Tue", slots: [{ subject: "Science", kind: "live", when: "5:00 pm", topic: "The fundamental unit of life" }, { subject: "Mathematics", kind: "dpp", when: "Practice set", topic: "Laws of exponents" }] },
      { day: "Wed", slots: [{ subject: "Social Science", kind: "live", when: "5:00 pm", topic: "The French Revolution" }, { subject: "English", kind: "recorded", when: "38 min", topic: "Reported speech" }] },
      { day: "Thu", slots: [{ subject: "English", kind: "live", when: "5:00 pm", topic: "Formal letter writing" }, { subject: "Science", kind: "dpp", when: "Practice set", topic: "States of matter" }] },
      { day: "Fri", slots: [{ subject: "Mathematics", kind: "live", when: "6:00 pm", topic: "Polynomials: factorisation" }, { subject: "Social Science", kind: "recorded", when: "42 min", topic: "India: size and location" }] },
    ],
    exam: "Mathematics and Science",
  },
  10: {
    rows: [
      { day: "Mon", slots: [{ subject: "Mathematics", kind: "live", when: "5:00 pm", topic: "Quadratic equations" }, { subject: "Science", kind: "recorded", when: "48 min", topic: "Light: reflection and refraction" }] },
      { day: "Tue", slots: [{ subject: "Science", kind: "live", when: "5:00 pm", topic: "Chemical reactions and equations" }, { subject: "Mathematics", kind: "dpp", when: "Practice set", topic: "Board-pattern quadratics" }] },
      { day: "Wed", slots: [{ subject: "Social Science", kind: "live", when: "5:00 pm", topic: "The rise of nationalism in Europe" }, { subject: "English", kind: "recorded", when: "38 min", topic: "Letter and essay writing" }] },
      { day: "Thu", slots: [{ subject: "English", kind: "live", when: "5:00 pm", topic: "Tenses and sentence structure" }, { subject: "Science", kind: "dpp", when: "Practice set", topic: "Ray diagrams" }] },
      { day: "Fri", slots: [{ subject: "Mathematics", kind: "live", when: "5:00 pm", topic: "Arithmetic progressions" }, { subject: "Social Science", kind: "recorded", when: "44 min", topic: "Resources and development" }] },
    ],
    exam: "Mathematics and Science",
  },
};

const KIND_LABEL: Record<Kind, string> = { live: "Live", recorded: "Recorded", dpp: "DPP" };
const FROM = Math.min(...PLANS.map((p) => p.price));

export default function HomeHero({ initialClass = 9 }: { initialClass?: number }) {
  const [cls, setCls] = useState<number>(initialClass);
  const week = WEEKS[cls] ?? WEEKS[9];

  return (
    <section className="hero">
      <div className="wrap hero-in">
        <div className="hero-copy">
          <h1 className="t-display">Live JKBOSE classes, from Class 8 to&nbsp;10.</h1>
          <p className="lead">
            Teachers take you through the syllabus in live classes, in English with Urdu and Kashmiri explanations.
            Recordings, study material, daily practice problems and a fortnightly exam keep each week on track.
          </p>
          <div className="hero-pick">
            <p className="label" id="hero-class-label">Choose a class to see its week</p>
            <div className="seg" role="group" aria-labelledby="hero-class-label">
              {PLAN_CLASSES.map((c) => (
                <button key={c} type="button" aria-pressed={cls === c} onClick={() => setCls(c)}>Class {c}</button>
              ))}
            </div>
            <div className="hero-cta">
              <Link className="btn lg" href={`/plans?class=${cls}`}>See Class {cls} plans</Link>
              <Link className="btn ghost lg" href={`/courses?class=${cls}`}>Browse Class {cls} subjects</Link>
            </div>
          </div>
          <dl className="hero-facts">
            <div><dt>Syllabus</dt><dd>JKBOSE 2026–27</dd></div>
            <div><dt>Teaching</dt><dd>English, Urdu and Kashmiri</dd></div>
            <div><dt>Plans from</dt><dd>₹{FROM.toLocaleString("en-IN")} a year + GST</dd></div>
          </dl>
        </div>

        <figure className="tt" style={{ margin: 0 }} aria-label={`Sample weekly timetable for Class ${cls}`}>
          <div className="tt-head">
            <div>
              <div className="tt-title">Class {cls} timetable</div>
              <div className="tt-sub">Sample week</div>
            </div>
            <div className="tt-legend" aria-hidden>
              <span><i className="lv" />Live</span>
              <span><i />Recorded</span>
              <span><i className="dp" />DPP</span>
            </div>
          </div>
          <div className="tt-body tt-swap" key={cls}>
            {week.rows.map((r) => (
              <div className="tt-row" key={r.day}>
                <div className="tt-day">{r.day}</div>
                {r.slots.map((s, i) => (
                  <div className={"tt-slot " + subjectClass(s.subject)} key={i}>
                    <span className="sub-bar" aria-hidden />
                    <div className="tt-slot-main">
                      <div className="tt-slot-top">
                        <span className={"tt-kind" + (s.kind === "live" ? " live" : "")}>{KIND_LABEL[s.kind]}</span>
                        <b>{s.subject}</b>
                        <span>{s.when}</span>
                      </div>
                      <div className="tt-topic">{s.topic}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div className="tt-row">
              <div className="tt-day">Sat</div>
              <div className="tt-exam">
                <div><b>Fortnightly online exam</b><span>{week.exam}</span></div>
                <span className="tt-mins">60 min</span>
              </div>
            </div>
          </div>
          <figcaption className="tt-foot">
            Every plan includes live classes, doubt solving and the fortnightly exam. Recorded lectures and DPPs come with Rise and Elite.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
