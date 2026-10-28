"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { SUBJECT_META } from "@/components/icons";

// Interactive, animated hero visual for JKBOSE Classes 8–10.
// Four subjects orbit a centre node; hovering pauses the orbit, clicking a
// subject focuses it in the live progress card below. Respects reduced motion.

const SUBJECTS = [
  { name: "Mathematics", chapter: "Quadratic Equations", pct: 72 },
  { name: "Science", chapter: "Light & Reflection", pct: 58 },
  { name: "Social Science", chapter: "The French Revolution", pct: 41 },
  { name: "English", chapter: "Grammar & Writing", pct: 64 },
];

export default function HeroVisual() {
  const ringRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(false);
  const angle = useRef(0);
  const reduced = useRef(false);
  const lockCycle = useRef(false);

  // orbit animation
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    const R = 0.37; // radius as fraction of container
    const place = () => {
      const ring = ringRef.current;
      if (!ring) return;
      const w = ring.clientWidth, h = ring.clientHeight;
      const cx = w / 2, cy = h / 2;
      const rad = Math.min(w, h) * R;
      SUBJECTS.forEach((_, i) => {
        const a = angle.current + (i / SUBJECTS.length) * Math.PI * 2;
        const x = cx + rad * Math.cos(a);
        const y = cy + rad * Math.sin(a);
        const el = nodeRefs.current[i];
        if (el) el.style.transform = `translate(-50%,-50%) translate(${x}px, ${y}px)`;
      });
    };
    const loop = (t: number) => {
      const dt = (t - last) / 1000; last = t;
      if (!hover && !reduced.current) angle.current += dt * 0.22; // slow spin
      place();
      raf = requestAnimationFrame(loop);
    };
    place();
    raf = requestAnimationFrame(loop);
    const onResize = () => place();
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [hover]);

  // auto-cycle the focused subject
  useEffect(() => {
    if (reduced.current) return;
    const id = setInterval(() => {
      if (!lockCycle.current) setActive((a) => (a + 1) % SUBJECTS.length);
    }, 3800);
    return () => clearInterval(id);
  }, []);

  const cur = SUBJECTS[active];
  const curMeta = SUBJECT_META[cur.name] ?? SUBJECT_META.Mathematics;

  return (
    <div className="hv" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="hv-panel" aria-hidden>
        <svg className="hv-dots" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
          <defs><pattern id="hvd" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="#fff" opacity=".16" /></pattern></defs>
          <rect width="400" height="400" fill="url(#hvd)" />
          <circle cx="320" cy="92" r="120" fill="#fff" opacity=".05" />
        </svg>

        {/* orbit ring */}
        <div className="hv-ring" ref={ringRef}>
          <span className="hv-ring-circle" />
          <span className="hv-center">
            <svg viewBox="0 0 40 40" fill="none" aria-hidden><path d="M20 6l12 6.5v9.5c0 7.3-5.3 12.6-12 14.5-6.7-1.9-12-7.2-12-14.5V12.5L20 6Z" fill="rgba(255,255,255,.18)" stroke="#fff" strokeWidth="1.5" /><path d="M14 20.5l4 4 8-8.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
            <b>8–10</b>
          </span>
          {SUBJECTS.map((s, i) => {
            const m = SUBJECT_META[s.name] ?? SUBJECT_META.Mathematics;
            return (
              <button
                key={s.name}
                ref={(el) => { nodeRefs.current[i] = el; }}
                className={"hv-node" + (active === i ? " on" : "")}
                style={{ "--nc": m.c, "--nc2": m.c2 } as CSSProperties}
                onMouseEnter={() => { lockCycle.current = true; setActive(i); }}
                onMouseLeave={() => { lockCycle.current = false; }}
                onClick={() => { setActive(i); lockCycle.current = true; }}
                aria-label={s.name}
              >
                <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>{m.path}</svg>
              </button>
            );
          })}
        </div>
      </div>

      {/* live progress card (focused subject) */}
      <div className="glass hv-card">
        <div className="hv-card-top">
          <span className="hv-ico" style={{ background: `linear-gradient(135deg, ${curMeta.c}, ${curMeta.c2})` }}>
            <svg viewBox="0 0 24 24" fill="none" width={20} height={20} style={{ color: "#fff" }}>{curMeta.path}</svg>
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="hv-sub">{cur.name} · JKBOSE</div>
            <div className="hv-ch">{cur.chapter}</div>
          </div>
        </div>
        <div className="hv-bar"><i style={{ width: cur.pct + "%" }} /></div>
        <div className="hv-foot">
          <span className="hv-pct">{cur.pct}% complete</span>
          <Link href="/courses" className="hv-link">Start learning →</Link>
        </div>
      </div>
    </div>
  );
}
