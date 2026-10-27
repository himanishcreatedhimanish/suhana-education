import Link from "next/link";
import { CheckIcon, LiveIcon, InfoIcon } from "@/components/icons";

export const metadata = {
  title: "About Suhana Education",
  description: "An integrated online learning platform combining academics, career guidance and health support for Class 8, 9 & 10.",
};

const authorities = [
  "Halqa President",
  "Head of the local Masjid Committee",
  "Headmaster or Principal of the concerned school",
  "Numberdar",
  "Station House Officer (SHO)",
];

const partners = [
  ["KS Admission Pvt. Ltd.", "Uttarakhand"],
  ["Health Gennie", "Jaipur — health partner"],
  ["Soft Finn Solutions", "Psychometric & career guidance"],
];

export default function AboutPage() {
  return (
    <div className="wrap page">
      <div className="crumbs"><Link href="/">Home</Link> › About</div>

      <section style={{ maxWidth: 760 }}>
        <span className="eyebrow">Our mission</span>
        <h1 style={{ fontSize: "clamp(1.8rem,4.6vw,2.8rem)", margin: "12px 0 0" }}>Quality education, career guidance and health support — for every student.</h1>
        <p className="mut" style={{ fontSize: "1.08rem", marginTop: 16 }}>
          Suhana Education is an integrated online learning platform for J&amp;K State Board (JKBOSE) students of Classes 8, 9 and 10. We go beyond academic coaching — combining live and recorded classes, comprehensive study material and regular assessments with career guidance through psychometric tests and health consultation support.
        </p>
        <p className="mut" style={{ marginTop: 14 }}>
          Our aim is to transform the educational landscape and bring quality learning opportunities to students across Jammu &amp; Kashmir and Ladakh.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          <Link className="btn" href="/plans">View plans</Link>
          <Link className="btn ghost" href="/courses">Browse courses</Link>
        </div>
      </section>

      <section className="sec" style={{ paddingBottom: 0 }}>
        <h2 style={{ fontSize: "1.6rem", marginBottom: 18 }}>Holistic learning, in one platform</h2>
        <div className="tiles">
          {[
            ["Academics", "Live and recorded classes, comprehensive study material, DPPs, assignments and fortnightly online exams.", <LiveIcon size={23} key="a" />],
            ["Career guidance", "Psychometric tests (DPIT) help students understand their aptitude and explore suitable career paths.", <CheckIcon size={23} key="b" />],
            ["Health support", "Around 15 free health consultations by doctors and counsellors from across India, in association with our health partner.", <InfoIcon size={23} key="c" />],
          ].map(([t, d, icon]) => (
            <div key={t as string} className="card feat-c">
              <div className="ic">{icon as React.ReactNode}</div>
              <h3>{t as string}</h3>
              <p>{d as string}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="sec">
        <div className="card" style={{ background: "var(--primary-soft)", border: "none" }}>
          <span className="eyebrow">Free for those who need it most</span>
          <h2 style={{ fontSize: "1.5rem", margin: "10px 0 12px" }}>Financial hardship should never deprive a student of quality education.</h2>
          <p className="mut">
            The entire programme is completely free for eligible students from underprivileged backgrounds — including orphans, destitute children, students from economically weaker sections and wards of police martyrs.
          </p>
          <p style={{ fontWeight: 600, margin: "18px 0 10px" }}>Eligibility can be verified at the grassroots level by any one of the following:</p>
          <div style={{ display: "grid", gap: 8 }}>
            {authorities.map((a) => (
              <div key={a} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: ".92rem" }}>
                <span style={{ color: "var(--ok)", display: "grid", placeItems: "center" }}><CheckIcon size={16} /></span>{a}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: 16 }}>In collaboration with</h2>
        <div className="grid">
          {partners.map(([name, sub]) => (
            <div key={name} className="card">
              <h3 style={{ fontSize: "1.1rem" }}>{name}</h3>
              <p className="mut" style={{ fontSize: ".88rem", marginTop: 6 }}>{sub}</p>
            </div>
          ))}
        </div>
        <p className="mut" style={{ fontSize: ".86rem", marginTop: 18 }}>
          Launched by SKIE Classes as a social initiative to make learning more accessible, inclusive and comprehensive — opening new avenues of opportunity for students and their families.
        </p>
      </section>
    </div>
  );
}
