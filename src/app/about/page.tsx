import Link from "next/link";
import { CheckIcon } from "@/components/icons";

export const metadata = {
  title: "About Suhana Education",
  description: "An integrated online learning programme combining academics, career guidance and health support for JKBOSE Classes 8, 9 and 10.",
};

const QUALIFY = ["Orphans", "Destitute children", "Students from economically weaker sections", "Wards of police martyrs"];
const AUTHORITIES = [
  "Halqa President",
  "Head of the local Masjid Committee",
  "Headmaster or Principal of the concerned school",
  "Numberdar",
  "Station House Officer (SHO)",
];
const PARTNERS: [string, string][] = [
  ["SKIE Classes", "Founder of the initiative"],
  ["KS Admission Pvt. Ltd.", "Uttarakhand"],
  ["Health Gennie", "Health partner, Jaipur"],
  ["Soft Finn Solutions", "Psychometric and career guidance"],
];

export default function AboutPage() {
  return (
    <>
      <div className="wrap">
        <section className="about-hero">
          <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span className="sep" aria-hidden />About</nav>
          <h1>Good teaching, career guidance and health support, for every student in J&amp;K.</h1>
          <p className="lead">
            Suhana Education is an online learning programme for J&amp;K State Board (JKBOSE) students in Classes 8, 9 and 10.
            Alongside live and recorded classes, study material and regular assessments, students get psychometric career
            guidance and access to health consultations. Our aim is to bring good learning within reach of students across
            Jammu, Kashmir and Ladakh.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
            <Link className="btn lg" href="/plans">View plans</Link>
            <Link className="btn ghost lg" href="/courses">Browse courses</Link>
          </div>
        </section>

        <section style={{ paddingBottom: "clamp(64px, 9vw, 120px)" }} aria-labelledby="pillars-h">
          <h2 id="pillars-h" className="sr-only">What the programme includes</h2>
          <div className="about-cols">
            <div>
              <h3>Academics</h3>
              <p>Live and recorded classes, chapter-wise study material, daily practice problems, assignments and fortnightly online exams.</p>
            </div>
            <div>
              <h3>Career guidance</h3>
              <p>Psychometric tests (DPIT) help students understand their aptitude and explore the careers that suit them.</p>
            </div>
            <div>
              <h3>Health support</h3>
              <p>Around 15 free consultations with doctors and counsellors from across India, through our health partner.</p>
            </div>
          </div>
        </section>
      </div>

      <section className="sec mission lattice" id="free" aria-labelledby="free-h">
        <div className="wrap mission-in">
          <div>
            <h2 id="free-h">Financial hardship should never keep a student from a good education.</h2>
            <p className="lead">
              The entire programme is completely free for eligible students from underprivileged backgrounds.
              Eligibility is confirmed at the grassroots by any one of the people listed here.
            </p>
            <Link className="btn outline-night" href="/login">Create an account</Link>
          </div>
          <div className="mission-lists">
            <div>
              <h3>Who qualifies</h3>
              <ul>{QUALIFY.map((q) => <li key={q}><CheckIcon size={16} />{q}</li>)}</ul>
            </div>
            <div>
              <h3>Who can verify eligibility</h3>
              <ul>{AUTHORITIES.map((a) => <li key={a}><CheckIcon size={16} />{a}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" id="partners" aria-labelledby="partners-h">
        <div className="wrap">
          <div className="split-head">
            <h2 id="partners-h">In collaboration with</h2>
            <p>Suhana Education was launched by SKIE Classes as a social initiative to make learning more accessible, inclusive and complete for students and their families.</p>
          </div>
          <div className="partners">
            {PARTNERS.map(([n, d]) => <div className="partner" key={n}><b>{n}</b><span>{d}</span></div>)}
          </div>
        </div>
      </section>
    </>
  );
}
