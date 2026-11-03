import Link from "next/link";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { CheckIcon, InfoIcon, SubjectGlyph, subjectClass } from "@/components/icons";
import { PLANS, priceBreakdown } from "@/lib/plans";
import HomeHero from "@/components/HomeHero";
import AuthCta from "@/components/AuthCta";
import WelcomePopup from "@/components/WelcomePopup";

// Which plans include a feature, worded for people rather than systems.
function availability(feature: string) {
  const names = PLANS.filter((p) => p.features.includes(feature)).map((p) => p.name.replace(" Plan", ""));
  if (names.length === PLANS.length) return { text: "Every plan", all: true };
  if (names.length === 0) return { text: "", all: false };
  return { text: names.length === 1 ? `${names[0]} only` : names.slice(0, -1).join(", ") + " and " + names.at(-1), all: false };
}

const INCLUDED: { group: string; items: [string, string, string][] }[] = [
  { group: "Classes", items: [
    ["Live lectures", "Teachers cover each chapter in scheduled live sessions.", "Live Lectures"],
    ["Recorded lectures", "Rewatch any lesson whenever you need it.", "Recorded Lectures"],
  ] },
  { group: "Practice and exams", items: [
    ["Daily practice problems", "A short set of questions after each lesson.", "DPPs (Daily Practice Problems)"],
    ["Assignments", "Regular written work set by your teachers.", "Assignments"],
    ["Fortnightly online exams", "A timed exam every two weeks, scored instantly.", "Fortnightly Online Exams"],
  ] },
  { group: "Study material", items: [
    ["Notes to download", "Chapter-wise notes and practice material.", "Soft Copy of Study Material"],
    ["Printed books", "The same material, printed and delivered home.", "Hard Copy of Study Material"],
  ] },
  { group: "Support", items: [
    ["Doubt solving", "Ask subject teachers online when you are stuck.", "Online Doubt Solving"],
    ["Health Gennie", "Consultations with doctors and counsellors.", "Health Gennie (health consultations)"],
    ["Career assessment (DPIT)", "A psychometric test to explore suitable careers.", "Psychoanalysis (DPIT)"],
  ] },
];

const SUBJECTS: [string, string][] = [
  ["Mathematics", "Number systems, algebra, geometry, trigonometry and statistics, worked step by step."],
  ["Science", "Physics, chemistry and biology with clear diagrams and everyday examples."],
  ["Social Science", "History, geography, political science and economics, told as connected stories."],
  ["English", "Grammar, letter and essay writing, prose and poetry for the board paper."],
];

const QUALIFY = ["Orphans", "Destitute children", "Students from economically weaker sections", "Wards of police martyrs"];
const VERIFY = ["Halqa President", "Head of the local Masjid Committee", "Headmaster or Principal of the school", "Numberdar", "Station House Officer (SHO)"];
const PARTNERS: [string, string][] = [
  ["SKIE Classes", "Founder of the initiative"],
  ["KS Admission Pvt. Ltd.", "Uttarakhand"],
  ["Health Gennie", "Health partner, Jaipur"],
  ["Soft Finn Solutions", "Psychometric and career guidance"],
];

export default function HomePage() {
  return (
    <>
      <WelcomePopup />
      {!SUPABASE_CONFIGURED && (
        <div className="demo-bar" role="note">
          <div className="wrap">
            <InfoIcon size={16} />
            <span><b>Demo mode.</b> Supabase isn’t configured, so content is sample data and sign-in and payments are simulated. Add keys to <code>.env.local</code> to go live.</span>
          </div>
        </div>
      )}

      <HomeHero />

      <section className="sec" aria-labelledby="incl-h">
        <div className="wrap">
          <div className="split-head">
            <h2 id="incl-h">One subscription covers the whole board year.</h2>
            <p>Every plan is built around live teaching and a fortnightly exam. Higher plans add recordings, daily practice, printed books, and health and career support.</p>
          </div>
          <div className="incl">
            {INCLUDED.map((g) => (
              <div className="incl-col" key={g.group}>
                <h3>{g.group}</h3>
                <ul>
                  {g.items.map(([name, desc, feature]) => {
                    const a = availability(feature);
                    return (
                      <li key={name}>
                        <b>{name}</b>
                        <p>{desc}</p>
                        {a.text && <small className={a.all ? "all" : undefined}>{a.text}</small>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec flush-top" aria-labelledby="subj-h">
        <div className="wrap">
          <div className="split-head">
            <h2 id="subj-h">Four board subjects, taught chapter by chapter.</h2>
            <p>Lessons follow the JKBOSE syllabus chapter by chapter, so what you study here lines up with your school textbook.</p>
          </div>
          <div className="subjects">
            {SUBJECTS.map(([name, desc]) => (
              <Link key={name} href="/courses" className={"subject-cover cover " + subjectClass(name)}>
                <div>
                  <h3>{name}</h3>
                  <p>{desc}</p>
                </div>
                <div className="sc-foot">
                  <span>Classes 8, 9 and 10</span>
                  <span className="sc-glyph"><SubjectGlyph subject={name} /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sec sec-mist" aria-labelledby="plans-h">
        <div className="wrap">
          <div className="split-head">
            <h2 id="plans-h">Three plans, priced for the year.</h2>
            <p>Pick your class on the plans page, compare every feature side by side, and pay securely online. Prices are per academic year; 18% GST is added at checkout.</p>
          </div>
          <div className="plan-cols">
            {PLANS.map((plan) => {
              const { gst, total } = priceBreakdown(plan.price);
              const shown = plan.features.slice(0, 4);
              return (
                <div key={plan.id} className={"plan-col" + (plan.popular ? " feature" : "")}>
                  <div className="pc-top">
                    <h3>{plan.name}</h3>
                    {plan.popular && <span className="pc-flag">Most popular</span>}
                  </div>
                  <p className="pc-tag">{plan.tagline}</p>
                  <div>
                    <div className="pc-price"><b>₹{plan.price.toLocaleString("en-IN")}</b><span>a year</span></div>
                    <div className="pc-gst" style={{ marginTop: 8 }}>+ ₹{gst.toLocaleString("en-IN")} GST, ₹{total.toLocaleString("en-IN")} in total</div>
                  </div>
                  <ul className="pc-list">
                    {shown.map((f) => <li key={f}><CheckIcon size={17} /><span>{f}</span></li>)}
                    {plan.features.length > shown.length && <li className="plus">and {plan.features.length - shown.length} more</li>}
                  </ul>
                  <Link className={"btn block" + (plan.popular ? " light" : " ghost")} href="/plans">Choose {plan.name.replace(" Plan", "")}</Link>
                </div>
              );
            })}
          </div>
          <p className="plan-note"><Link className="link" href="/plans">Compare every feature</Link></p>
        </div>
      </section>

      <section className="sec mission lattice" id="free" aria-labelledby="free-h">
        <div className="wrap mission-in">
          <div>
            <h2 id="free-h">Free for the students who need it most.</h2>
            <p className="lead">
              Financial hardship should never keep a student from a good education. The entire programme is free for
              eligible students, verified at the grassroots by someone who knows the family.
            </p>
            <Link className="btn outline-night" href="/about#free">Read about eligibility</Link>
          </div>
          <div className="mission-lists">
            <div>
              <h3>Who qualifies</h3>
              <ul>{QUALIFY.map((q) => <li key={q}><CheckIcon size={16} />{q}</li>)}</ul>
            </div>
            <div>
              <h3>Who can verify eligibility</h3>
              <ul>{VERIFY.map((v) => <li key={v}><CheckIcon size={16} />{v}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" aria-labelledby="partners-h">
        <div className="wrap">
          <h2 id="partners-h" style={{ fontSize: "1.125rem", letterSpacing: "-0.01em", marginBottom: 20 }}>Delivered with</h2>
          <div className="partners">
            {PARTNERS.map(([n, d]) => (
              <div className="partner" key={n}><b>{n}</b><span>{d}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec flush-top guest-only">
        <div className="wrap">
          <div className="closing">
            <div>
              <h2>Admissions for 2026–27 are open.</h2>
              <p>Create an account with your phone number, email or Google, choose your class, and join this week’s live classes.</p>
            </div>
            <div className="acts">
              <AuthCta className="btn lg" loggedOutLabel="Create your account" loggedInLabel="Go to my dashboard" />
              <Link className="btn ghost lg" href="/plans">View plans</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
