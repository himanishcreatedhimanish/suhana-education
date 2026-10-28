"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { SUBJECT_META } from "@/components/icons";

// Interactive, animated 3D hero visual for JKBOSE Classes 8–10.
// Four subjects orbit a glass progress dial that reflects the focused
// subject. The scene tilts to the pointer and parallaxes on scroll for
// real depth. Everything is disabled under prefers-reduced-motion.

const SUBJECTS = [
  { name: "Mathematics", chapter: "Quadratic Equations", pct: 72, tag: "Live" },
  { name: "Science", chapter: "Light & Reflection", pct: 58, tag: "New" },
  { name: "Social Science", chapter: "The French Revolution", pct: 41, tag: "Doubts" },
  { name: "English", chapter: "Grammar & Writing", pct: 64, tag: "Recap" },
];

const R = 36; // core ring radius in a 0 0 64 64 viewBox
const CIRC = 2 * Math.PI * R;

export default function HeroVisual() {
  const hvRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(false);
  const angle = useRef(0);
  const reduced = useRef(false);
  const lockCycle = useRef(false);

  // pointer-tilt (target + current for smooth lerp) and scroll offset
  const tilt = useRef({ tx: 0, ty: 0, cx: 0, cy: 0 });
  const scrollT = useRef(0);

  // orbit + tilt animation loop
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    const ORBIT = 0.33; // radius as fraction of container
    const DEPTH = 46; // node pop toward viewer (px); card sits in front of these
    const place = () => {
      const ring = ringRef.current;
      if (!ring) return;
      const w = ring.clientWidth, h = ring.clientHeight;
      const cx = w / 2, cy = h * 0.43; // lift orbit into the upper area, clear of the card
      const rad = Math.min(w, h) * ORBIT;
      SUBJECTS.forEach((_, i) => {
        const a = angle.current + (i / SUBJECTS.length) * Math.PI * 2;
        const x = cx + rad * Math.cos(a);
        const y = cy + rad * Math.sin(a);
        const bob = reduced.current ? 0 : Math.sin(angle.current * 1.6 + i * 1.7) * 5;
        const el = nodeRefs.current[i];
        if (el) el.style.transform = `translate(-50%,-50%) translate(${x}px, ${y + bob}px) translateZ(${DEPTH}px)`;
      });
    };
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (!hover && !reduced.current) angle.current += dt * 0.2; // slow spin
      place();
      // smooth tilt toward pointer, plus a touch of scroll-driven rotateX
      const T = tilt.current;
      const k = Math.min(1, dt * 8);
      T.cx += (T.tx - T.cx) * k;
      T.cy += (T.ty - T.cy) * k;
      const st = stageRef.current;
      if (st && !reduced.current) {
        const ry = T.cx * 11;
        const rx = -T.cy * 11 + scrollT.current * 7;
        st.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };
    place();
    raf = requestAnimationFrame(loop);
    const onResize = () => place();
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [hover]);

  // auto-cycle focused subject
  useEffect(() => {
    if (reduced.current) return;
    const id = setInterval(() => {
      if (!lockCycle.current) setActive((a) => (a + 1) % SUBJECTS.length);
    }, 3600);
    return () => clearInterval(id);
  }, []);

  // scroll parallax (normalised -1..1 around viewport centre)
  useEffect(() => {
    const onScroll = () => {
      const el = hvRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const centre = r.top + r.height / 2;
      scrollT.current = -Math.max(-1, Math.min(1, (centre - vh / 2) / (vh / 2)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function onMove(e: React.PointerEvent) {
    if (reduced.current) return;
    const el = hvRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    tilt.current.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    tilt.current.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  }
  function onLeave() {
    setHover(false);
    tilt.current.tx = 0;
    tilt.current.ty = 0;
  }

  const cur = SUBJECTS[active];
  const curMeta = SUBJECT_META[cur.name] ?? SUBJECT_META.Mathematics;
  const dashOffset = CIRC * (1 - cur.pct / 100);

  return (
    <div
      className="hv"
      ref={hvRef}
      onPointerMove={onMove}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={onLeave}
    >
      <div className="hv-stage" ref={stageRef}>
        <div className="hv-panel" aria-hidden>
          <svg className="hv-dots" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
            <defs><pattern id="hvd" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="#fff" opacity=".16" /></pattern></defs>
            <rect width="400" height="400" fill="url(#hvd)" />
          </svg>
          <span className="hv-glow a" />
          <span className="hv-glow b" />
        </div>

        {/* live flag */}
        <span className="hv-flag"><i />Live classes every day</span>

        {/* orbit ring + glass progress core + subject nodes */}
        <div className="hv-ring" ref={ringRef} aria-hidden>
          <span className="hv-ring-circle" />
          <span className="hv-ring-circle outer" />

          <div className="hv-core" style={{ "--cc": curMeta.c, "--cc2": curMeta.c2 } as CSSProperties}>
            <span className="hv-core-halo" />
            <svg className="hv-core-ring" viewBox="0 0 80 80">
              <circle className="trk" cx="40" cy="40" r={R} />
              <circle className="prg" cx="40" cy="40" r={R} style={{ strokeDasharray: CIRC, strokeDashoffset: dashOffset }} />
            </svg>
            <span className="hv-core-ic" key={active}>
              <svg viewBox="0 0 24 24" fill="none" width={34} height={34}>{curMeta.path}</svg>
            </span>
            <span className="hv-core-tag">{cur.tag}</span>
          </div>

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
                onFocus={() => { lockCycle.current = true; setActive(i); }}
                onBlur={() => { lockCycle.current = false; }}
                onClick={() => { setActive(i); lockCycle.current = true; }}
                aria-label={`${s.name} — ${s.pct}% complete`}
              >
                <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>{m.path}</svg>
              </button>
            );
          })}
        </div>

        {/* live progress card (focused subject) */}
        <div className="hv-card">
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
    </div>
  );
}
